// تعريفات الأنواع العامة للتطبيق
declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
    paypal?: {
      Buttons: (options: any) => {
        render: (selector: string | HTMLElement) => Promise<void>;
        isEligible?: () => boolean;
      };
      FUNDING: {
        PAYPAL: string;
        CARD: string;
        CREDIT: string;
        VENMO: string;
      };
    };
    checkInstallStatus: () => {
      isInstalled: boolean;
      isInstallable: boolean;
      hasPrompt: boolean;
    };
    installApp?: () => Promise<void>;
  }
}

export {};
