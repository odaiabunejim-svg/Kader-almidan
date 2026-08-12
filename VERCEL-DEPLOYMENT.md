# 🚀 رفع كادر الميدان على Vercel (خطوة بخطوة)

---

## **الخطوة 1: أنشئ Repository على GitHub (مجاني)**

### 1. اذهب إلى: https://github.com/new
### 2. اسم الـ Repository: `kader-almidan`
### 3. اختر: **Public** (للبساطة)
### 4. اضغط: **Create repository**

---

## **الخطوة 2: رفع الأكواد إلى GitHub**

### في Terminal (على جهازك):

```bash
# انتقل لمجلد المشروع
cd Desktop/kader-almidan

# ابدأ Repository محلي
git init
git add .
git commit -m "Initial commit - Kader Al-Medan"

# ربط بـ GitHub (استبدل USERNAME بحسابك)
git remote add origin https://github.com/USERNAME/kader-almidan.git
git branch -M main
git push -u origin main
```

---

## **الخطوة 3: ربط Vercel بـ GitHub**

### 1. اذهب إلى: https://vercel.com/
### 2. اضغط: **Sign up** (اختر GitHub)
### 3. سيطلب منك ربط حسابك - وافق على الأذونات
### 4. بعد التسجيل، اختر: **Import Project**
### 5. اختر: **kader-almidan** (المشروع اللي رفعته)
### 6. اضغط: **Import**

---

## **الخطوة 4: أضف متغيرات البيئة (Environment Variables)**

### في صفحة Vercel، قبل Deploy:

1. اضغط: **Environment Variables**
2. أضف:

```
NEXT_PUBLIC_SUPABASE_URL = https://dehpydbvqlopmlvumnyk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_MBzgBNGkU73B6gZLqNQPYA_sxloatIX
```

3. اضغط: **Add**

---

## **الخطوة 5: Deploy!**

### 1. اضغط: **Deploy** (الزر الأزرق)
### 2. انتظر 2-3 دقائق
### 3. ستحصل على رابط: `https://kader-almidan-xxx.vercel.app`

---

## ✅ **خلصت! تطبيقك حي الآن!**

---

## 📱 **كيف تختبره:**

### من الهاتف أو الكمبيوتر:
1. افتح الرابط: `https://kader-almidan-xxx.vercel.app/pwa-field`
2. اضغط: **"تسجيل البصمة الجغرافية"**
3. **GPS راح يطلب إذن** - وافق
4. البصمة تنجح إذا كنت ضمن 70 متر من الموقع المتخيل

---

## 🔄 **كل مرة تعدل الكود:**

```bash
git add .
git commit -m "تحديث البصمة"
git push
# Vercel بيرفع تلقائياً خلال دقيقة!
```

---

## ⚠️ **ملاحظات مهمة:**

1. **GPS** بيشتغل بـ HTTPS فقط (Vercel توفره تلقائياً)
2. **الموقع** بدون GPS في Browser قد يعطي موقع تقريبي
3. **Offline Mode** يشتغل تلقائياً - لما ترجع للنت، البيانات تتزامن

---

## 🎯 **التالي:**

بعد ما تتأكد من البصمة تشتغل، ننتقل لـ **لوحة الإدارة** (إدارة الموظفين والعملاء)
