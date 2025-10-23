# استخدام Python 3.9 الرسمي
FROM python:3.9-slim

# تعيين مجلد العمل
WORKDIR /app

# نسخ ملف المتطلبات
COPY requirements.txt .

# تثبيت المكتبات
RUN pip install --no-cache-dir -r requirements.txt

# نسخ باقي الملفات
COPY . .

# تعيين المنفذ
EXPOSE 5000

# تشغيل السيرفر
CMD ["python", "iqoption_unofficial_server.py"]
