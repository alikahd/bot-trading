# 🤖 دليل إعداد Telegram Bot

دليل شامل لإنشاء وإعداد Telegram Bot للتطبيق.

---

## 📋 الخطوات:

### 1️⃣ إنشاء Bot جديد

1. افتح Telegram وابحث عن: **@BotFather**
2. ابدأ محادثة واضغط `/start`
3. اكتب الأمر: `/newbot`
4. أدخل اسم البوت (مثال: `My Trading Bot`)
5. أدخل username للبوت (يجب أن ينتهي بـ `bot`)
   - مثال: `my_trading_bot` أو `MyTradingBot`

6. **ستحصل على Token** مثل:
   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
   ```
   ⚠️ **احتفظ به بشكل آمن!**

---

### 2️⃣ الحصول على Chat ID

#### الطريقة الأولى (للمحادثات الشخصية):

1. ابحث عن بوتك في Telegram
2. اضغط `/start` لبدء المحادثة
3. افتح الرابط التالي في المتصفح (استبدل `YOUR_BOT_TOKEN`):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
4. ابحث عن `"chat":{"id":` في النتيجة
5. الرقم بجانبها هو Chat ID الخاص بك

#### الطريقة الثانية (للقنوات/المجموعات):

1. أضف البوت إلى القناة/المجموعة كـ Admin
2. أرسل رسالة في القناة/المجموعة
3. افتح نفس الرابط السابق
4. ستجد Chat ID (سيكون رقم سالب للمجموعات)

#### الطريقة الثالثة (استخدام @userinfobot):

1. ابحث عن **@userinfobot** في Telegram
2. ابدأ محادثة معه
3. سيرسل لك معلوماتك بما فيها Chat ID

---

### 3️⃣ إعداد ملف .env

1. انسخ ملف `.env.example` إلى `.env`:
   ```bash
   cp .env.example .env
   ```

2. افتح ملف `.env` وأضف:
   ```env
   VITE_TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
   VITE_TELEGRAM_CHAT_ID=123456789
   ```

---

### 4️⃣ اختبار الاتصال

#### في الكود:

```typescript
import { telegramService } from './services/telegramService';

// اختبار الاتصال
const testBot = async () => {
  const isConnected = await telegramService.testConnection();
  
  if (isConnected) {
    // إرسال رسالة تجريبية
    await telegramService.sendMessage('✅ البوت يعمل بنجاح!');
  }
};

testBot();
```

#### من المتصفح (Console):

```javascript
// افتح Console في المتصفح واكتب:
fetch('https://api.telegram.org/botYOUR_BOT_TOKEN/sendMessage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: 'YOUR_CHAT_ID',
    text: 'اختبار البوت!'
  })
}).then(r => r.json()).then(console.log);
```

---

## 🎯 الاستخدامات المتاحة:

### 1. إشعار بمستخدم جديد:
```typescript
await telegramService.notifyNewUser({
  email: 'user@example.com',
  fullName: 'أحمد محمد',
  country: 'السعودية',
  registrationMethod: 'email'
});
```

### 2. إشعار باشتراك جديد:
```typescript
await telegramService.notifyNewSubscription({
  userName: 'أحمد محمد',
  userEmail: 'user@example.com',
  planName: 'الباقة الذهبية',
  amount: 99,
  currency: 'USD',
  duration: 'شهري'
});
```

### 3. إشعار بإحالة جديدة:
```typescript
await telegramService.notifyNewReferral({
  referrerName: 'علي أحمد',
  referrerEmail: 'ali@example.com',
  newUserName: 'محمد خالد',
  newUserEmail: 'mohamed@example.com',
  commission: 10,
  currency: 'USD'
});
```

### 4. إشعار بدفع عمولة:
```typescript
await telegramService.notifyCommissionPaid({
  userName: 'علي أحمد',
  userEmail: 'ali@example.com',
  amount: 50,
  currency: 'USD',
  referralsCount: 5
});
```

### 5. إشعار بخطأ في النظام:
```typescript
await telegramService.notifySystemError({
  errorType: 'Database Connection',
  errorMessage: 'Failed to connect to database',
  userId: 'user123',
  userEmail: 'user@example.com'
});
```

### 6. تقرير يومي:
```typescript
await telegramService.sendDailyReport({
  newUsers: 15,
  newSubscriptions: 8,
  totalRevenue: 720,
  currency: 'USD',
  activeUsers: 150,
  newReferrals: 12
});
```

### 7. رسالة مخصصة:
```typescript
await telegramService.sendFormattedMessage(
  'إشعار مهم',
  {
    'المستخدم': 'أحمد محمد',
    'الإجراء': 'تحديث الملف الشخصي',
    'الحالة': 'نجح'
  },
  '🔔'
);
```

### 8. إرسال توصية Binary Options دقيقة:
```typescript
await telegramService.sendBinaryRecommendation({
  symbol: 'EURUSD_otc',
  symbolName: 'EURUSD',
  direction: 'CALL',
  confidence: 85,
  timeframe: '5m',
  expiryMinutes: 5,
  entryTime: new Date(Date.now() + 120000),
  expiryTime: new Date(Date.now() + 420000),
  currentPrice: 1.08550,
  successProbability: 78,
  riskLevel: 'منخفض',
  reasoning: 'RSI في منطقة ذروة البيع • EMA12 عبر EMA26 صعوداً • زخم إيجابي'
});
```

### 9. إرسال ملخص التوصيات:
```typescript
await telegramService.sendBinaryRecommendationsSummary([
  { symbol: 'EURUSD', direction: 'CALL', confidence: 85, expiryMinutes: 5, successProbability: 78 },
  { symbol: 'GBPUSD', direction: 'PUT', confidence: 82, expiryMinutes: 3, successProbability: 75 },
  { symbol: 'USDJPY', direction: 'CALL', confidence: 80, expiryMinutes: 5, successProbability: 73 }
]);
```

---

## 🔧 التكامل مع التطبيق:

### في simpleAuthService.ts (عند التسجيل):

```typescript
// بعد نجاح التسجيل
await telegramService.notifyNewUser({
  email: formData.email,
  fullName: formData.fullName,
  country: formData.country,
  registrationMethod: 'email'
});
```

### في subscriptionService.ts (عند الاشتراك):

```typescript
// بعد نجاح الدفع
await telegramService.notifyNewSubscription({
  userName: user.full_name,
  userEmail: user.email,
  planName: selectedPlan.name,
  amount: finalAmount,
  currency: 'USD',
  duration: selectedPlan.duration
});
```

### في CommissionManagement.tsx (عند دفع العمولة):

```typescript
// بعد دفع العمولة
await telegramService.notifyCommissionPaid({
  userName: commission.user_name,
  userEmail: commission.user_email,
  amount: commission.commission_amount,
  currency: 'USD',
  referralsCount: commission.referrals_count
});
```

### في PreciseBinaryRecommendations.tsx (إرسال التوصيات تلقائياً):

```typescript
// يتم إرسال التوصيات تلقائياً كل 15 ثانية عند توفرها
// 1. إرسال ملخص جميع التوصيات
await telegramService.sendBinaryRecommendationsSummary(recommendations);

// 2. إرسال أفضل 3 توصيات بالتفصيل
const topRecommendations = recommendations
  .sort((a, b) => b.confidence - a.confidence)
  .slice(0, 3);

for (const rec of topRecommendations) {
  await telegramService.sendBinaryRecommendation(rec);
}
```

---

## 🛡️ الأمان:

### ✅ أفضل الممارسات:

1. **لا تشارك Token أبداً** - احتفظ به في `.env` فقط
2. **أضف `.env` إلى `.gitignore`** - لا ترفعه لـ Git
3. **استخدم HTTPS فقط** - Telegram API يدعم HTTPS فقط
4. **راقب الرسائل** - تأكد من عدم إرسال معلومات حساسة
5. **حدد الصلاحيات** - البوت لا يحتاج صلاحيات Admin في معظم الحالات

### ⚠️ تحذيرات:

- **لا ترسل كلمات مرور** في الرسائل
- **لا ترسل معلومات بطاقات ائتمان**
- **لا ترسل API Keys أخرى**
- **راجع الرسائل قبل الإرسال**

---

## 📊 مراقبة البوت:

### الأوامر المفيدة في BotFather:

- `/mybots` - عرض جميع بوتاتك
- `/setname` - تغيير اسم البوت
- `/setdescription` - إضافة وصف
- `/setabouttext` - إضافة نص "حول"
- `/setuserpic` - تغيير صورة البوت
- `/deletebot` - حذف البوت

### معلومات البوت:

```bash
# الحصول على معلومات البوت
curl https://api.telegram.org/botYOUR_BOT_TOKEN/getMe

# عرض آخر الرسائل
curl https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
```

---

## 🔗 روابط مفيدة:

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [BotFather Commands](https://core.telegram.org/bots#6-botfather)
- [Telegram Bot Examples](https://core.telegram.org/bots/samples)
- [HTML Formatting Guide](https://core.telegram.org/bots/api#html-style)

---

## 🆘 استكشاف الأخطاء:

### خطأ: "Unauthorized"
- تأكد من صحة Bot Token
- تأكد من عدم وجود مسافات في Token

### خطأ: "Bad Request: chat not found"
- تأكد من صحة Chat ID
- تأكد من أنك بدأت محادثة مع البوت

### خطأ: "Forbidden: bot was blocked by the user"
- المستخدم حظر البوت
- اطلب من المستخدم إلغاء الحظر

### لا تصل الرسائل:
- تأكد من أن البوت ليس محظوراً
- تأكد من صحة Chat ID
- تحقق من Console للأخطاء

---

## ✅ قائمة التحقق:

- [ ] إنشاء Bot في BotFather
- [ ] الحصول على Bot Token
- [ ] الحصول على Chat ID
- [ ] إضافة المتغيرات في `.env`
- [ ] اختبار الاتصال
- [ ] إرسال رسالة تجريبية
- [ ] التكامل مع التطبيق
- [ ] اختبار جميع الإشعارات

---

🎉 **تم! البوت جاهز للاستخدام**
