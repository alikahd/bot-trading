import React, { useEffect, useState } from 'react';
import { supabase } from '../../config/supabaseClient';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

interface EmailConfirmationCallbackProps {
  onConfirmed: () => void;
}

export const EmailConfirmationCallback: React.FC<EmailConfirmationCallbackProps> = ({ onConfirmed }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('جاري التحقق من البريد الإلكتروني...');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // الحصول على session الحالية
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('خطأ في الحصول على الجلسة:', sessionError);
          setStatus('error');
          setMessage('حدث خطأ في التحقق من البريد الإلكتروني');
          return;
        }

        if (!session?.user) {
          setStatus('error');
          setMessage('لم يتم العثور على معلومات المستخدم');
          return;
        }

        // التحقق من أن البريد مؤكد
        if (session.user.email_confirmed_at) {
          console.log('✅ Email is confirmed, updating database...');
          console.log('📧 User auth_id:', session.user.id);
          console.log('📅 Confirmed at:', session.user.email_confirmed_at);
          
          // تحديث حالة المستخدم في قاعدة البيانات
          const { error: updateError } = await supabase
            .from('users')
            .update({
              email_verified: true,
              status: 'pending_subscription',
              email_verified_at: session.user.email_confirmed_at,
              updated_at: new Date().toISOString()
            })
            .eq('auth_id', session.user.id);

          if (updateError) {
            console.error('خطأ في تحديث حالة المستخدم:', updateError);
            setStatus('error');
            setMessage('حدث خطأ في تحديث حالة الحساب');
            return;
          }

          setStatus('success');
          setMessage('تم تأكيد البريد الإلكتروني بنجاح! جاري التوجيه لصفحة الاشتراك...');
          
          // الانتقال إلى صفحة الاشتراك بعد 1.5 ثانية
          setTimeout(() => {
            onConfirmed();
          }, 1500);
        } else {
          setStatus('error');
          setMessage('البريد الإلكتروني لم يتم تأكيده بعد');
        }
      } catch (error) {
        console.error('خطأ في معالجة تأكيد البريد:', error);
        setStatus('error');
        setMessage('حدث خطأ غير متوقع');
      }
    };

    handleEmailConfirmation();
  }, [onConfirmed]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-6">
              <Loader className="w-16 h-16 text-blue-400 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              جاري التحقق...
            </h2>
            <p className="text-slate-300">
              {message}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              تم التأكيد بنجاح!
            </h2>
            <p className="text-slate-300 mb-6">
              {message}
            </p>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 text-sm">
                سيتم توجيهك إلى صفحة الاشتراك...
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-6">
              <XCircle className="w-16 h-16 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              فشل التحقق
            </h2>
            <p className="text-slate-300 mb-6">
              {message}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              العودة للصفحة الرئيسية
            </button>
          </>
        )}
      </div>
    </div>
  );
};
