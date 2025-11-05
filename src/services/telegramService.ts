/**
 * خدمة Telegram Bot API
 * للتواصل مع Telegram Bot وإرسال الإشعارات
 */

interface TelegramMessage {
  chat_id: string | number;
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
}

interface TelegramResponse {
  ok: boolean;
  result?: any;
  description?: string;
  error_code?: number;
}

class TelegramService {
  private botToken: string;
  private chatId: string;
  private baseUrl: string;

  constructor() {
    this.botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
    this.chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID || '';
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  /**
   * التحقق من صحة إعدادات البوت
   */
  isConfigured(): boolean {
    return !!this.botToken && !!this.chatId;
  }

  /**
   * اختبار اتصال البوت
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/getMe`);
      const data: TelegramResponse = await response.json();
      
      if (data.ok) {
        console.log('✅ Telegram Bot متصل:', data.result);
        return true;
      } else {
        console.error('❌ خطأ في الاتصال:', data.description);
        return false;
      }
    } catch (error) {
      console.error('❌ فشل الاتصال بـ Telegram:', error);
      return false;
    }
  }

  /**
   * إرسال رسالة نصية
   */
  async sendMessage(
    text: string,
    chatId?: string | number,
    options?: Partial<TelegramMessage>
  ): Promise<TelegramResponse> {
    if (!this.isConfigured()) {
      console.warn('⚠️ Telegram Bot غير مُعد بشكل صحيح');
      return { ok: false, description: 'Bot not configured' };
    }

    try {
      const message: TelegramMessage = {
        chat_id: chatId || this.chatId,
        text,
        parse_mode: 'HTML',
        ...options,
      };

      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const data: TelegramResponse = await response.json();

      if (data.ok) {
        console.log('✅ تم إرسال الرسالة بنجاح');
      } else {
        console.error('❌ فشل إرسال الرسالة:', data.description);
      }

      return data;
    } catch (error) {
      console.error('❌ خطأ في إرسال الرسالة:', error);
      return { ok: false, description: String(error) };
    }
  }

  /**
   * إرسال إشعار بتسجيل مستخدم جديد
   */
  async notifyNewUser(userData: {
    email: string;
    fullName: string;
    country?: string;
    registrationMethod: 'email' | 'google';
  }): Promise<void> {
    const message = `
🆕 <b>مستخدم جديد</b>

👤 الاسم: ${userData.fullName}
📧 البريد: ${userData.email}
🌍 الدولة: ${userData.country || 'غير محدد'}
🔐 طريقة التسجيل: ${userData.registrationMethod === 'google' ? 'Google' : 'البريد الإلكتروني'}

⏰ ${new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
    `.trim();

    await this.sendMessage(message);
  }

  /**
   * إرسال إشعار باشتراك جديد
   */
  async notifyNewSubscription(subscriptionData: {
    userName: string;
    userEmail: string;
    planName: string;
    amount: number;
    currency: string;
    duration: string;
  }): Promise<void> {
    const message = `
💰 <b>اشتراك جديد</b>

👤 المستخدم: ${subscriptionData.userName}
📧 البريد: ${subscriptionData.userEmail}
📦 الباقة: ${subscriptionData.planName}
💵 المبلغ: ${subscriptionData.amount} ${subscriptionData.currency}
⏱️ المدة: ${subscriptionData.duration}

⏰ ${new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
    `.trim();

    await this.sendMessage(message);
  }

  /**
   * إرسال إشعار بإحالة جديدة
   */
  async notifyNewReferral(referralData: {
    referrerName: string;
    referrerEmail: string;
    newUserName: string;
    newUserEmail: string;
    commission: number;
    currency: string;
  }): Promise<void> {
    const message = `
🎁 <b>إحالة جديدة</b>

👥 المُحيل: ${referralData.referrerName}
📧 بريد المُحيل: ${referralData.referrerEmail}

🆕 المستخدم الجديد: ${referralData.newUserName}
📧 بريد المستخدم: ${referralData.newUserEmail}

💰 العمولة: ${referralData.commission} ${referralData.currency}

⏰ ${new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
    `.trim();

    await this.sendMessage(message);
  }

  /**
   * إرسال إشعار بدفع عمولة
   */
  async notifyCommissionPaid(paymentData: {
    userName: string;
    userEmail: string;
    amount: number;
    currency: string;
    referralsCount: number;
  }): Promise<void> {
    const message = `
💸 <b>تم دفع عمولة</b>

👤 المستخدم: ${paymentData.userName}
📧 البريد: ${paymentData.userEmail}
💰 المبلغ: ${paymentData.amount} ${paymentData.currency}
📊 عدد الإحالات: ${paymentData.referralsCount}

⏰ ${new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
    `.trim();

    await this.sendMessage(message);
  }

  /**
   * إرسال إشعار بخطأ في النظام
   */
  async notifySystemError(errorData: {
    errorType: string;
    errorMessage: string;
    userId?: string;
    userEmail?: string;
    stackTrace?: string;
  }): Promise<void> {
    const message = `
🚨 <b>خطأ في النظام</b>

⚠️ النوع: ${errorData.errorType}
📝 الرسالة: ${errorData.errorMessage}
${errorData.userId ? `👤 المستخدم: ${errorData.userEmail} (${errorData.userId})` : ''}

⏰ ${new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
    `.trim();

    await this.sendMessage(message);
  }

  /**
   * إرسال تقرير يومي
   */
  async sendDailyReport(reportData: {
    newUsers: number;
    newSubscriptions: number;
    totalRevenue: number;
    currency: string;
    activeUsers: number;
    newReferrals: number;
  }): Promise<void> {
    const message = `
📊 <b>التقرير اليومي</b>

👥 مستخدمون جدد: ${reportData.newUsers}
💰 اشتراكات جديدة: ${reportData.newSubscriptions}
💵 الإيرادات: ${reportData.totalRevenue} ${reportData.currency}
✅ مستخدمون نشطون: ${reportData.activeUsers}
🎁 إحالات جديدة: ${reportData.newReferrals}

📅 ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
    `.trim();

    await this.sendMessage(message);
  }

  /**
   * إرسال رسالة مخصصة مع تنسيق HTML
   */
  async sendFormattedMessage(
    title: string,
    content: Record<string, string | number>,
    emoji: string = '📢'
  ): Promise<void> {
    const contentLines = Object.entries(content)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const message = `
${emoji} <b>${title}</b>

${contentLines}

⏰ ${new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
    `.trim();

    await this.sendMessage(message);
  }

  /**
   * إرسال توصية Binary Options دقيقة
   */
  async sendBinaryRecommendation(recommendation: {
    symbol: string;
    symbolName: string;
    direction: 'CALL' | 'PUT';
    confidence: number;
    timeframe: string;
    expiryMinutes: number;
    entryTime: Date;
    expiryTime: Date;
    currentPrice: number;
    successProbability: number;
    riskLevel: string;
    reasoning: string;
  }): Promise<void> {
    // ألوان مميزة للشراء والبيع
    const isCall = recommendation.direction === 'CALL';
    const directionEmoji = isCall ? '🟢' : '🔴';
    const arrowEmoji = isCall ? '⬆️' : '⬇️';
    const directionText = isCall ? 'BUY | شراء 🟢' : 'SELL | بيع 🔴';
    
    // تنسيق الوقت بالطريقة اللاتينية
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    };

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    };

    // تحديد لون مستوى المخاطر
    const getRiskEmoji = (risk: string) => {
      if (risk.includes('منخفض') || risk.toLowerCase().includes('low')) return '🟢';
      if (risk.includes('متوسط') || risk.toLowerCase().includes('medium')) return '🟡';
      return '🔴';
    };

    // تحديد لون الثقة
    const getConfidenceEmoji = (confidence: number) => {
      if (confidence >= 80) return '🟢';
      if (confidence >= 70) return '🟡';
      return '🟠';
    };

    // تنسيق اسم الزوج بشكل أوضح
    const formatPairName = (symbol: string) => {
      // إزالة _OTC و _otc
      let cleanSymbol = symbol.replace(/_OTC|_otc/gi, '');
      
      // إضافة شرطة بين العملات (مثال: EURUSD → EUR/USD)
      if (cleanSymbol.length === 6) {
        return `${cleanSymbol.substring(0, 3)}/${cleanSymbol.substring(3, 6)}`;
      }
      return cleanSymbol;
    };

    const formattedPair = formatPairName(recommendation.symbolName);
    const now = new Date();
    
    // رسالة مختصرة بالإنجليزية فقط
    const message = `
${directionEmoji} <b>${formattedPair}</b> ${arrowEmoji} <b>${directionText}</b>

💰 <b>Price:</b> <code>${recommendation.currentPrice.toFixed(5)}</code>
⏱️ <b>Time:</b> ${recommendation.expiryMinutes}min

${getConfidenceEmoji(recommendation.confidence)} <b>Confidence:</b> ${recommendation.confidence}% | <b>Success:</b> ${recommendation.successProbability}%
${getRiskEmoji(recommendation.riskLevel)} <b>Risk:</b> ${recommendation.riskLevel}

🕐 <b>Entry:</b> ${formatTime(recommendation.entryTime)}
🕑 <b>Expiry:</b> ${formatTime(recommendation.expiryTime)}

📝 ${recommendation.reasoning}

🤖 ${formatDate(now)} ${formatTime(now)}
    `.trim();

    await this.sendMessage(message);
  }

  /**
   * إرسال مجموعة توصيات دقيقة (ملخص)
   */
  async sendBinaryRecommendationsSummary(recommendations: Array<{
    symbol: string;
    direction: 'CALL' | 'PUT';
    confidence: number;
    expiryMinutes: number;
    successProbability: number;
  }>): Promise<void> {
    if (recommendations.length === 0) {
      return;
    }

    const callCount = recommendations.filter(r => r.direction === 'CALL').length;
    const putCount = recommendations.filter(r => r.direction === 'PUT').length;
    const avgConfidence = Math.round(
      recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length
    );

    // تنسيق التاريخ والوقت بالطريقة اللاتينية
    const now = new Date();
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    };

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    };

    // تنسيق اسم الزوج
    const formatPairName = (symbol: string) => {
      let cleanSymbol = symbol.replace(/_OTC|_otc/gi, '');
      if (cleanSymbol.length === 6) {
        return `${cleanSymbol.substring(0, 3)}/${cleanSymbol.substring(3, 6)}`;
      }
      return cleanSymbol;
    };

    const topRecommendations = recommendations
      .slice(0, 5)
      .map((r, index) => {
        const emoji = r.direction === 'CALL' ? '🟢⬆️' : '🔴⬇️';
        const direction = r.direction === 'CALL' ? 'BUY' : 'SELL';
        const confidenceEmoji = r.confidence >= 80 ? '🟢' : r.confidence >= 70 ? '🟡' : '🟠';
        const formattedPair = formatPairName(r.symbol);
        return `${index + 1}. ${emoji} <b>${formattedPair}</b> - ${direction} ${confidenceEmoji} <code>${r.confidence}%</code>`;
      })
      .join('\n');

    const message = `
━━━━━━━━━━━━━━━━━━━━
🎯 <b>SIGNALS SUMMARY</b> 🎯
━━━━━━━━━━━━━━━━━━━━

📊 <b>STATISTICS</b>

🟢 <b>BUY Signals:</b> ${callCount}
🔴 <b>SELL Signals:</b> ${putCount}
🎯 <b>Average Confidence:</b> ${avgConfidence}%
📋 <b>Total Signals:</b> ${recommendations.length}

━━━━━━━━━━━━━━━━━━━━
🔝 <b>TOP 5 SIGNALS</b>
━━━━━━━━━━━━━━━━━━━━

${topRecommendations}

━━━━━━━━━━━━━━━━━━━━
🤖 <b>Generated:</b> ${formatDate(now)} ${formatTime(now)}
━━━━━━━━━━━━━━━━━━━━
    `.trim();

    await this.sendMessage(message);
  }
}

// تصدير instance واحد
export const telegramService = new TelegramService();

// تصدير الـ class للاستخدام المتقدم
export default TelegramService;
