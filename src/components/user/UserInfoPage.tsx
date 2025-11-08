import React, { useState, useEffect } from 'react';
import { Globe, User, Mail, Phone } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { Footer } from '../layout/Footer';

interface UserInfo {
  fullName: string;
  email: string;
  phone: string;
}

interface UserInfoPageProps {
  selectedPlan: any;
  onSubmitUserInfo: (userInfo: UserInfo) => void;
  onBack: () => void;
}
const USER_INFO_STORAGE_KEY = 'user_info_form_data';

// حفظ واستعادة بيانات النموذج
const saveFormData = (data: any) => {
  try {
    localStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {

  }
};

const loadFormData = () => {
  try {
    const saved = localStorage.getItem(USER_INFO_STORAGE_KEY);
    return saved ? JSON.parse(saved) : { fullName: '', email: '', phone: '' };
  } catch (error) {

    return { fullName: '', email: '', phone: '' };
  }
};

export const UserInfoPage: React.FC<UserInfoPageProps> = ({ selectedPlan, onSubmitUserInfo, onBack }) => {
  const { language, setLanguage, t, dir } = useLanguage();
  const [userInfo, setUserInfo] = useState(() => loadFormData());

  // حفظ البيانات عند تغييرها
  useEffect(() => {
    saveFormData(userInfo);
  }, [userInfo]);

  // ...
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInfo.fullName && userInfo.email && userInfo.phone) {
      // مسح بيانات النموذج عند الإرسال الناجح
      localStorage.removeItem(USER_INFO_STORAGE_KEY);
      onSubmitUserInfo(userInfo);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex flex-col" dir={dir}>
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
        <button
          onClick={() => {
            const nextLang = language === 'ar' ? 'en' : language === 'en' ? 'fr' : 'ar';
            setLanguage(nextLang);
          }}
          className="flex items-center gap-1 bg-white/10 text-white px-2 py-1 rounded-lg border border-white/20 text-xs"
        >
          <Globe className="w-3 h-3" />
          <span className="text-xs font-medium">{language === 'ar' ? 'العربية' : language === 'en' ? 'English' : 'Français'}</span>
        </button>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-3">
        <Card className="w-full max-w-md" padding="sm">
        <div className="text-center mb-2.5 sm:mb-4">
          <h1 className="text-base sm:text-xl font-bold text-white mb-1 sm:mb-2">{t('userinfo.title')}</h1>
          <p className="text-gray-400 mb-2 sm:mb-3 text-xs sm:text-sm">{t('userinfo.subtitle')}</p>
          
          {/* تحذير مهم */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 sm:p-3 mb-2.5 sm:mb-4">
            <div className="flex items-start gap-1.5 sm:gap-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-black text-[10px] sm:text-xs font-bold">!</span>
              </div>
              <div className={`${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                <h3 className="text-yellow-400 font-bold text-xs sm:text-base mb-0.5 sm:mb-1">
                  {language === 'ar' ? 'تنبيه مهم' : language === 'fr' ? 'Avertissement Important' : 'Important Warning'}
                </h3>
                <p className="text-yellow-200 text-[11px] sm:text-xs leading-relaxed">
                  {language === 'ar' 
                    ? 'يرجى إدخال معلوماتك الحقيقية والصحيحة. سيتم إرسال بيانات تسجيل الدخول إلى البريد الإلكتروني المدخل، وستحتاج هذه المعلومات لاستعادة حسابك في المستقبل.'
                    : language === 'fr'
                    ? 'Veuillez saisir vos informations réelles et correctes. Les données de connexion seront envoyées à l\'adresse e-mail saisie, et vous aurez besoin de ces informations pour récupérer votre compte à l\'avenir.'
                    : 'Please enter your real and correct information. Login credentials will be sent to the entered email address, and you will need this information to recover your account in the future.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className={`mb-2.5 sm:mb-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
          <p className="text-gray-400 mb-0.5 sm:mb-1 text-xs sm:text-sm">{t('userinfo.selectedPlan')}: {language === 'ar' ? selectedPlan.name_ar : selectedPlan.name}</p>
          <p className="text-green-400 font-bold text-base sm:text-lg">${selectedPlan.price}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
          <div>
            <div className="relative">
              <User className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400`} />
              <input
                type="text"
                value={userInfo.fullName}
                onChange={(e) => setUserInfo((prev: UserInfo) => ({ ...prev, fullName: e.target.value }))}
                className={`w-full bg-white/10 border border-white/20 text-white rounded-xl py-2.5 sm:py-3 ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                placeholder={t('userinfo.placeholder.fullName')}
                required
                dir={dir}
              />
            </div>
          </div>

          <div>
            <label className={`block text-white mb-1.5 sm:mb-2 text-sm sm:text-base ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('userinfo.email')}</label>
            <div className="relative">
              <Mail className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400`} />
              <input
                type="email"
                value={userInfo.email}
                onChange={(e) => setUserInfo((prev: UserInfo) => ({ ...prev, email: e.target.value }))}
                className={`w-full bg-white/10 border border-white/20 text-white rounded-xl py-2.5 sm:py-3 ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                placeholder={t('userinfo.placeholder.email')}
                required
                dir={dir}
              />
            </div>
          </div>

          <div>
            <label className={`block text-white mb-1.5 sm:mb-2 text-sm sm:text-base ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('userinfo.phone')}</label>
            <div className="relative">
              <Phone className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400`} />
              <input
                type="tel"
                value={userInfo.phone}
                onChange={(e) => setUserInfo((prev: UserInfo) => ({ ...prev, phone: e.target.value }))}
                className={`w-full bg-white/10 border border-white/20 text-white rounded-xl py-2.5 sm:py-3 ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                placeholder={t('userinfo.placeholder.phone')}
                required
                dir={dir}
              />
            </div>
          </div>

          <div className="flex gap-2.5 sm:gap-3 pt-2 sm:pt-3">
            <Button onClick={onBack} variant="ghost" className="flex-1 py-2 text-sm">
              {t('userinfo.back')}
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 py-2 sm:py-2.5 text-sm">
              {t('userinfo.continue')}
            </Button>
          </div>
        </form>
        </Card>
      </div>
      
      {/* الفوتر */}
      <Footer />
    </div>
  );
};
