-- =====================================================
-- Database Function: معالجة الدفع الشهري للعمولات
-- =====================================================
-- الوصف: دالة تلقائية تعمل في اليوم الأول من كل شهر
-- المهام:
--   1. جلب جميع العمولات المعلقة
--   2. التحقق من الحد الأدنى للسحب
--   3. تحديث حالة العمولات إلى 'paid'
--   4. إنشاء سجلات الدفع
--   5. إرجاع قائمة المستخدمين المدفوع لهم
-- =====================================================

-- إنشاء نوع مخصص لإرجاع النتائج
CREATE TYPE commission_payout_result AS (
  user_id UUID,
  username TEXT,
  email TEXT,
  total_amount DECIMAL(10,2),
  commission_count INTEGER,
  payment_method_type TEXT,
  payment_details JSONB
);

-- الدالة الرئيسية لمعالجة العمولات الشهرية
CREATE OR REPLACE FUNCTION process_monthly_commissions()
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  email TEXT,
  total_amount DECIMAL(10,2),
  commission_count INTEGER,
  payment_method_type TEXT,
  payment_details JSONB,
  success BOOLEAN,
  message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_minimum_payout DECIMAL(10,2);
  v_payment_cycle_days INTEGER;
  v_settings_active BOOLEAN;
  v_processed_count INTEGER := 0;
  v_total_paid DECIMAL(10,2) := 0;
  v_user_record RECORD;
  v_commission_ids UUID[];
  v_payment_id UUID;
BEGIN
  -- 1. جلب إعدادات نظام الإحالة
  SELECT 
    minimum_payout,
    payment_cycle_days,
    is_active
  INTO 
    v_minimum_payout,
    v_payment_cycle_days,
    v_settings_active
  FROM referral_settings
  LIMIT 1;

  -- التحقق من تفعيل النظام
  IF NOT v_settings_active THEN
    RETURN QUERY
    SELECT 
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      0::DECIMAL(10,2),
      0::INTEGER,
      NULL::TEXT,
      NULL::JSONB,
      FALSE,
      'نظام الإحالة غير مفعل'::TEXT;
    RETURN;
  END IF;

  -- استخدام القيمة الافتراضية إذا لم تكن موجودة
  v_minimum_payout := COALESCE(v_minimum_payout, 10.00);

  -- 2. معالجة كل مستخدم لديه عمولات معلقة
  FOR v_user_record IN
    SELECT 
      pc.referrer_id,
      u.username,
      u.email,
      SUM(pc.commission_amount) as total_pending,
      COUNT(pc.id) as commission_count,
      ARRAY_AGG(pc.id) as commission_ids,
      pm.payment_type,
      pm.payment_details
    FROM pending_commissions pc
    INNER JOIN users u ON u.id = pc.referrer_id
    LEFT JOIN payment_methods pm ON pm.user_id = pc.referrer_id AND pm.is_primary = true
    WHERE pc.status = 'pending'
    GROUP BY 
      pc.referrer_id, 
      u.username, 
      u.email,
      pm.payment_type,
      pm.payment_details
    HAVING SUM(pc.commission_amount) >= v_minimum_payout
  LOOP
    BEGIN
      -- 3. تحديث حالة العمولات إلى 'paid'
      UPDATE pending_commissions
      SET 
        status = 'paid',
        paid_at = NOW(),
        updated_at = NOW()
      WHERE id = ANY(v_user_record.commission_ids)
        AND status = 'pending'; -- تأكيد إضافي

      -- 4. إنشاء سجل في commission_payments
      INSERT INTO commission_payments (
        referrer_id,
        total_amount,
        commission_ids,
        payment_method,
        payment_status,
        payment_date,
        notes
      ) VALUES (
        v_user_record.referrer_id,
        v_user_record.total_pending,
        v_user_record.commission_ids,
        COALESCE(v_user_record.payment_type, 'pending_setup'),
        'completed',
        NOW(),
        'دفع تلقائي شهري - ' || TO_CHAR(NOW(), 'YYYY-MM')
      )
      RETURNING id INTO v_payment_id;

      -- 5. إنشاء إشعار للمستخدم
      INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        is_read,
        created_at
      ) VALUES (
        v_user_record.referrer_id,
        '🎉 تم دفع عمولاتك الشهرية',
        'تم دفع عمولاتك بقيمة $' || v_user_record.total_pending || ' بنجاح. شكراً لك!',
        'commission_paid',
        FALSE,
        NOW()
      );

      -- 6. تحديث الإحصائيات
      v_processed_count := v_processed_count + 1;
      v_total_paid := v_total_paid + v_user_record.total_pending;

      -- 7. إرجاع النتيجة للمستخدم الحالي
      RETURN QUERY
      SELECT 
        v_user_record.referrer_id,
        v_user_record.username,
        v_user_record.email,
        v_user_record.total_pending,
        v_user_record.commission_count,
        COALESCE(v_user_record.payment_type, 'not_set'),
        v_user_record.payment_details,
        TRUE,
        'تم الدفع بنجاح'::TEXT;

    EXCEPTION WHEN OTHERS THEN
      -- في حالة حدوث خطأ، نسجله ونستمر مع المستخدمين الآخرين
      RETURN QUERY
      SELECT 
        v_user_record.referrer_id,
        v_user_record.username,
        v_user_record.email,
        v_user_record.total_pending,
        v_user_record.commission_count,
        COALESCE(v_user_record.payment_type, 'not_set'),
        v_user_record.payment_details,
        FALSE,
        ('خطأ: ' || SQLERRM)::TEXT;
    END;
  END LOOP;

  -- إذا لم يتم معالجة أي مستخدم
  IF v_processed_count = 0 THEN
    RETURN QUERY
    SELECT 
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      0::DECIMAL(10,2),
      0::INTEGER,
      NULL::TEXT,
      NULL::JSONB,
      TRUE,
      'لا توجد عمولات مستحقة للدفع (أقل من الحد الأدنى $' || v_minimum_payout || ')'::TEXT;
  END IF;

  RETURN;
END;
$$;

-- =====================================================
-- دالة مساعدة: الحصول على ملخص العمولات المعلقة
-- =====================================================
CREATE OR REPLACE FUNCTION get_pending_commissions_summary()
RETURNS TABLE (
  total_users INTEGER,
  total_amount DECIMAL(10,2),
  eligible_users INTEGER,
  eligible_amount DECIMAL(10,2),
  minimum_payout DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_minimum_payout DECIMAL(10,2);
BEGIN
  -- جلب الحد الأدنى
  SELECT minimum_payout INTO v_minimum_payout
  FROM referral_settings
  LIMIT 1;
  
  v_minimum_payout := COALESCE(v_minimum_payout, 10.00);

  RETURN QUERY
  WITH user_totals AS (
    SELECT 
      referrer_id,
      SUM(commission_amount) as user_total
    FROM pending_commissions
    WHERE status = 'pending'
    GROUP BY referrer_id
  )
  SELECT 
    COUNT(*)::INTEGER as total_users,
    COALESCE(SUM(user_total), 0)::DECIMAL(10,2) as total_amount,
    COUNT(*) FILTER (WHERE user_total >= v_minimum_payout)::INTEGER as eligible_users,
    COALESCE(SUM(user_total) FILTER (WHERE user_total >= v_minimum_payout), 0)::DECIMAL(10,2) as eligible_amount,
    v_minimum_payout
  FROM user_totals;
END;
$$;

-- =====================================================
-- دالة مساعدة: الحصول على تقرير الدفعات الشهرية
-- =====================================================
CREATE OR REPLACE FUNCTION get_monthly_payout_report(target_month DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  month TEXT,
  total_paid DECIMAL(10,2),
  total_users INTEGER,
  total_commissions INTEGER,
  payment_breakdown JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(target_month, 'YYYY-MM') as month,
    COALESCE(SUM(cp.total_amount), 0)::DECIMAL(10,2) as total_paid,
    COUNT(DISTINCT cp.referrer_id)::INTEGER as total_users,
    SUM(ARRAY_LENGTH(cp.commission_ids, 1))::INTEGER as total_commissions,
    JSONB_AGG(
      JSONB_BUILD_OBJECT(
        'user_id', u.id,
        'username', u.username,
        'email', u.email,
        'amount', cp.total_amount,
        'payment_method', cp.payment_method,
        'payment_date', cp.payment_date
      )
    ) as payment_breakdown
  FROM commission_payments cp
  INNER JOIN users u ON u.id = cp.referrer_id
  WHERE DATE_TRUNC('month', cp.payment_date) = DATE_TRUNC('month', target_month)
    AND cp.payment_status = 'completed';
END;
$$;

-- =====================================================
-- منح الصلاحيات
-- =====================================================
-- السماح للمستخدمين المصادق عليهم باستدعاء الدوال
GRANT EXECUTE ON FUNCTION process_monthly_commissions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_commissions_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_payout_report(DATE) TO authenticated;

-- =====================================================
-- تعليقات توضيحية
-- =====================================================
COMMENT ON FUNCTION process_monthly_commissions() IS 'معالجة الدفع الشهري التلقائي للعمولات المستحقة';
COMMENT ON FUNCTION get_pending_commissions_summary() IS 'الحصول على ملخص العمولات المعلقة';
COMMENT ON FUNCTION get_monthly_payout_report(DATE) IS 'الحصول على تقرير الدفعات الشهرية';
