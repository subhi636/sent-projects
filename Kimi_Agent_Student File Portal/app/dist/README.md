# Sent Projects - مرقع

نظام إدارة ملفات الطلاب

## المتطلبات

- Node.js 18+
- npm أو yarn

## التثبيت والتشغيل

### 1. تثبيت اعتماديات الخادم

```bash
cd server
npm install
cd ..
```

### 2. تشغيل الخادم

```bash
npm run server
```

سيعمل الخادم على المنفذ 3001

### 3. تشغيل واجهة المستخدم (في Terminal آخر)

```bash
npm run dev
```

سيعمل الموقع على المنفذ 5173

## بيانات تسجيل الدخول

- **البريد الإلكتروني**: `subhi20102005@gmail.com`
- **كلمة المرور**: `Qw07750783066w2005/4/15S`

## المميزات

- ✅ رفع ملفات PDF و ZIP (حد أقصى 50MB)
- ✅ إدخال اسم الطالب واختيار المادة
- ✅ لوحة تحكم للمشرف محمية بكلمة مرور
- ✅ عرض PDF مباشر في المتصفح
- ✅ عرض محتويات ملف ZIP
- ✅ خاصية البحث والتصفية
- ✅ تصنيف الملفات حسب المادة
- ✅ إشعارات عند استلام ملف جديد
- ✅ إمكانية استبدال الملف
- ✅ دعم اللغتين العربية والإنجليزية

## المواد الدراسية المدعومة

- Professional Ethics
- Artificial Intelligence
- Artificial Intelligence LAB
- Networks Programming
- Networks Programming LAB
- Modern Networks Technologies
- Arabic Language III
- Digital Signal Processing
- Digital Signal Processing LAB
- Operating Systems
- Operating Systems LAB

## API Endpoints

- `POST /api/upload` - رفع ملف جديد
- `POST /api/login` - تسجيل دخول المشرف
- `GET /api/files` - جلب قائمة الملفات
- `GET /api/files/:id` - جلب ملف محدد
- `GET /api/files/:id/content` - جلب محتوى الملف (PDF/ZIP)
- `GET /api/files/:id/download` - تحميل الملف
- `DELETE /api/files/:id` - حذف ملف
- `GET /api/stats` - إحصائيات الملفات
- `GET /api/subjects` - قائمة المواد
- `GET /api/check-new` - التحقق من ملفات جديدة

## هيكل المشروع

```
.
├── dist/               # ملفات البناء
│   ├── assets/         # ملفات CSS و JS
│   ├── server/         # ملفات الخادم
│   └── index.html      # الصفحة الرئيسية
├── server/             # كود الخادم
│   ├── database/       # قاعدة البيانات
│   ├── uploads/        # الملفات المرفوعة
│   └── server.js       # ملف الخادم الرئيسي
└── src/                # كود الواجهة
    ├── sections/       # أقسام الموقع
    ├── lib/            # المكتبات المساعدة
    └── types/          # أنواع TypeScript
```

## ملاحظات الأمان

- يتم تشفير كلمات المرور باستخدام bcrypt
- حد حجم الملف: 50 ميجابايت
- فقط ملفات PDF و ZIP مسموح بها
- حماية من هجمات CSRF و rate limiting

## الترخيص

جميع الحقوق محفوظة © 2025
