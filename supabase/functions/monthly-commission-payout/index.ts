// =====================================================
// Edge Function: الدفع الشهري التلقائي للعمولات
// =====================================================
// الوصف: دالة تعمل تلقائياً في اليوم الأول من كل شهر
// المهام:
//   1. استدعاء process_monthly_commissions()
//   2. إرسال إشعارات للمستخدمين
//   3. إرسال تقرير للأدمن
//   4. تسجيل النتائج
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// =====================================================
// الأنواع والواجهات
// =====================================================
interface PayoutResult {
  user_id: string;
  username: string;
  email: string;
  total_amount: number;
  commission_count: number;
  payment_method_type: string;
  payment_details: any;
  success: boolean;
  message: string;
}

interface AdminNotification {
  total_users: number;
  total_amount: number;
  successful_payouts: number;
  failed_payouts: number;
  details: PayoutResult[];
}

// =====================================================
// الدالة الرئيسية
// =====================================================
serve(async (req) => {
  try {
    // 1. التحقق من الصلاحيات
    const authHeader = req.headers.get("Authorization");
    
    // السماح فقط لـ Supabase Cron أو المستخدمين المصرح لهم
    if (!authHeader && req.headers.get("x-supabase-cron") !== "true") {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. إنشاء عميل Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🚀 بدء معالجة الدفع الشهري للعمولات...");

    // 3. الحصول على ملخص العمولات المعلقة قبل المعالجة
    const { data: summaryBefore, error: summaryError } = await supabase
      .rpc("get_pending_commissions_summary");

    if (summaryError) {
      console.error("❌ خطأ في جلب الملخص:", summaryError);
    } else {
      console.log("📊 ملخص العمولات المعلقة:", summaryBefore);
    }

    // 4. تنفيذ معالجة العمولات
    const { data: results, error: processError } = await supabase
      .rpc("process_monthly_commissions");

    if (processError) {
      console.error("❌ خطأ في معالجة العمولات:", processError);
      
      // إرسال تنبيه للأدمن بالخطأ
      await sendAdminErrorNotification(supabase, processError.message);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: processError.message 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ تم معالجة العمولات:", results);

    // 5. تحليل النتائج
    const payoutResults = results as PayoutResult[];
    const successfulPayouts = payoutResults.filter(r => r.success && r.user_id);
    const failedPayouts = payoutResults.filter(r => !r.success && r.user_id);
    
    const totalAmount = successfulPayouts.reduce(
      (sum, r) => sum + (r.total_amount || 0), 
      0
    );

    // 6. إرسال تقرير للأدمن
    const adminReport: AdminNotification = {
      total_users: successfulPayouts.length,
      total_amount: totalAmount,
      successful_payouts: successfulPayouts.length,
      failed_payouts: failedPayouts.length,
      details: payoutResults
    };

    await sendAdminReport(supabase, adminReport);

    // 7. تسجيل النتيجة النهائية
    console.log("📊 التقرير النهائي:");
    console.log(`   ✅ عدد المستخدمين المدفوع لهم: ${successfulPayouts.length}`);
    console.log(`   💰 إجمالي المبلغ المدفوع: $${totalAmount.toFixed(2)}`);
    console.log(`   ❌ عدد الفشل: ${failedPayouts.length}`);

    // 8. إرجاع النتيجة
    return new Response(
      JSON.stringify({
        success: true,
        message: "تم معالجة الدفع الشهري بنجاح",
        summary: {
          total_users: successfulPayouts.length,
          total_amount: totalAmount,
          successful_payouts: successfulPayouts.length,
          failed_payouts: failedPayouts.length
        },
        details: payoutResults
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("❌ خطأ غير متوقع:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "حدث خطأ غير متوقع" 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// =====================================================
// دالة إرسال تقرير للأدمن
// =====================================================
async function sendAdminReport(
  supabase: any, 
  report: AdminNotification
): Promise<void> {
  try {
    // جلب جميع المديرين
    const { data: admins, error: adminError } = await supabase
      .from("users")
      .select("id, email, username")
      .eq("role", "admin")
      .eq("is_active", true);

    if (adminError) {
      console.error("❌ خطأ في جلب المديرين:", adminError);
      return;
    }

    if (!admins || admins.length === 0) {
      console.warn("⚠️ لا يوجد مديرين لإرسال التقرير");
      return;
    }

    // إنشاء رسالة التقرير
    const currentMonth = new Date().toLocaleDateString("ar-SA", { 
      year: "numeric", 
      month: "long" 
    });

    let message = `📊 تقرير الدفع الشهري - ${currentMonth}\n\n`;
    
    if (report.total_users > 0) {
      message += `✅ تم دفع $${report.total_amount.toFixed(2)} لـ ${report.total_users} مستخدمين\n\n`;
      
      // إضافة تفاصيل كل مستخدم
      message += "التفاصيل:\n";
      report.details
        .filter(d => d.success && d.user_id)
        .forEach((detail, index) => {
          message += `${index + 1}. ${detail.username} - $${detail.total_amount.toFixed(2)} (${detail.commission_count} عمولة)\n`;
        });
    } else {
      message += "ℹ️ لا توجد عمولات مستحقة للدفع هذا الشهر";
    }

    if (report.failed_payouts > 0) {
      message += `\n\n⚠️ فشل دفع ${report.failed_payouts} عمولات`;
    }

    // إرسال إشعار لكل مدير
    for (const admin of admins) {
      await supabase.from("notifications").insert({
        user_id: admin.id,
        title: `📊 تقرير الدفع الشهري - ${currentMonth}`,
        message: message,
        type: "admin_report",
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    console.log(`✅ تم إرسال التقرير لـ ${admins.length} مديرين`);
  } catch (error) {
    console.error("❌ خطأ في إرسال تقرير الأدمن:", error);
  }
}

// =====================================================
// دالة إرسال تنبيه خطأ للأدمن
// =====================================================
async function sendAdminErrorNotification(
  supabase: any, 
  errorMessage: string
): Promise<void> {
  try {
    const { data: admins } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin")
      .eq("is_active", true);

    if (!admins || admins.length === 0) return;

    const currentMonth = new Date().toLocaleDateString("ar-SA", { 
      year: "numeric", 
      month: "long" 
    });

    for (const admin of admins) {
      await supabase.from("notifications").insert({
        user_id: admin.id,
        title: `⚠️ خطأ في الدفع الشهري - ${currentMonth}`,
        message: `حدث خطأ أثناء معالجة الدفع الشهري للعمولات:\n\n${errorMessage}\n\nالرجاء المراجعة والتدخل اليدوي.`,
        type: "error",
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    console.log("✅ تم إرسال تنبيه الخطأ للمديرين");
  } catch (error) {
    console.error("❌ خطأ في إرسال تنبيه الخطأ:", error);
  }
}
