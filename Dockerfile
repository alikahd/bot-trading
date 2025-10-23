# استخدام Python 3.9 الرسمي
FROM python:3.9-slim

# تثبيت Git وأدوات البناء المطلوبة
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

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
