'use client';

import { useState, useEffect } from 'react';
import { Navigation, CheckCircle2, AlertCircle, MapPin, Wifi, WifiOff, Save } from 'lucide-react';

export default function PwaFieldPage() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [clientName] = useState('سوبرماركت البركة'); // من قاعدة البيانات
  const [clientLat] = useState(31.9539); // من قاعدة البيانات
  const [clientLng] = useState(35.9106); // من قاعدة البيانات
  const [clientRadius] = useState(70); // الـ 70 متر

  // مراقبة الاتصال بالإنترنت
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ===== دالة حساب المسافة (Haversine Formula) =====
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // نصف قطر الأرض بالمتر
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // المسافة بالمتر
  };

  // ===== دالة حفظ البصمة محلياً (Offline) =====
  const saveOfflineCheckIn = (checkInData: any) => {
    try {
      const queue = JSON.parse(localStorage.getItem('offline_check_ins') || '[]');
      queue.push({
        ...checkInData,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('offline_check_ins', JSON.stringify(queue));
      return true;
    } catch (error) {
      console.error('Failed to save offline:', error);
      return false;
    }
  };

  // ===== دالة التحقق من ربط الجهاز (Device Binding) =====
  const verifyDeviceBinding = (): boolean => {
    const userId = 'user-123'; // من Session أو Auth
    const stored = localStorage.getItem(`device_${userId}`);
    const currentDevice = navigator.userAgent.substring(0, 50) + screen.width + screen.height;

    if (!stored) {
      localStorage.setItem(`device_${userId}`, currentDevice);
      return true;
    }

    return stored === currentDevice;
  };

  // ===== دالة البصمة الرئيسية =====
  const handleCheckIn = async () => {
    setLoading(true);

    // التحقق من ربط الجهاز
    if (!verifyDeviceBinding()) {
      setStatusMsg('❌ خطأ: هذا الحساب مربوط بجهاز آخر فقط!');
      setLoading(false);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const userLat = latitude;
          const userLng = longitude;

          // حساب المسافة بين الموظف والعميل
          const distance = calculateDistance(userLat, userLng, clientLat, clientLng);

          // التحقق من الـ 70 متر
          if (distance <= clientRadius) {
            // البيانات الصحيحة
            const checkInData = {
              user_id: 'user-123',
              company_id: 'company-1',
              client_id: 'client-1',
              latitude: userLat,
              longitude: userLng,
              distance_from_target: Math.round(distance),
              is_valid: true,
              is_mock_location: false,
              check_in_time: new Date().toISOString(),
            };

            // محاولة الحفظ في قاعدة البيانات إذا كان الاتصال موجود
            if (isOnline) {
              try {
                // هنا سيكون fetch لـ Supabase API (سنضيفه في الخطوة التالية)
                console.log('Saving to database:', checkInData);
                setStatusMsg(`✅ تمت البصمة بنجاح! (المسافة: ${Math.round(distance)} متر)`);
                setCheckedIn(true);
              } catch (error) {
                // إذا فشل الاتصال، احفظها محلياً
                saveOfflineCheckIn(checkInData);
                setStatusMsg(`⚠️ تم حفظ البصمة محلياً (بدون إنترنت)`);
                setCheckedIn(true);
              }
            } else {
              // لا يوجد إنترنت - احفظها محلياً
              saveOfflineCheckIn(checkInData);
              setStatusMsg(`⚠️ تم حفظ البصمة محلياً (بدون إنترنت)`);
              setCheckedIn(true);
            }
          } else {
            // المسافة أكثر من 70 متر
            setStatusMsg(`❌ فشلت البصمة: أنت تبعد ${Math.round(distance)} متر (المسموح 70 متر فقط)`);
          }

          setLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setStatusMsg('❌ خطأ: فعّل خدمة الـ GPS على الهاتف');
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setStatusMsg('❌ متصفحك لا يدعم تتبع الموقع الجغرافي');
      setLoading(false);
    }
  };

  // ===== دالة إعادة محاولة البصمة =====
  const handleRetry = () => {
    setCheckedIn(false);
    setStatusMsg('');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-900 text-white p-6 flex flex-col justify-between font-sans">
      {/* الرأس مع مؤشر الاتصال */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-emerald-400">كادر الميدان</h2>
            <p className="text-xs text-slate-400">تطبيق المنسق الميداني</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 rounded-lg">
            {isOnline ? (
              <>
                <Wifi size={14} className="text-emerald-400" />
                <span className="text-xs text-emerald-400">متصل</span>
              </>
            ) : (
              <>
                <WifiOff size={14} className="text-amber-400" />
                <span className="text-xs text-amber-400">بدون نت</span>
              </>
            )}
          </div>
        </div>

        {/* بطاقة العميل المجدول */}
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-3">
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full font-medium inline-block">
            مطلوب زيارته اليوم
          </span>
          <h3 className="text-lg font-bold text-white">{clientName}</h3>
          <p className="text-xs text-slate-300 flex items-center gap-1.5">
            <MapPin size={14} className="text-emerald-400" />
            شارع مكة، عمان الغربية
          </p>
          <div className="text-xs text-slate-400 pt-2 border-t border-slate-700">
            <p>📍 المسافة المسموحة: <span className="text-emerald-400 font-bold">70 متر</span></p>
            <p>⏰ الفترة الزمنية: <span className="text-emerald-400 font-bold">09:00 ص - 11:00 ص</span></p>
          </div>
        </div>

        {/* رسالة الحالة */}
        {statusMsg && (
          <div
            className={`p-4 rounded-xl text-xs flex items-start gap-3 ${
              checkedIn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{statusMsg}</span>
          </div>
        )}
      </div>

      {/* الزر الرئيسي والملخص */}
      <div className="py-6 space-y-4">
        {!checkedIn ? (
          <>
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-slate-950 font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-base disabled:cursor-wait"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>جاري الفحص...</span>
                </>
              ) : (
                <>
                  <Navigation size={20} />
                  <span>تسجيل البصمة الجغرافية</span>
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-500">
              ✓ يتم التحقق تلقائياً من GPS والمسافة والجهاز
            </p>
          </>
        ) : (
          <>
            <div className="w-full bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-bold py-4 rounded-2xl text-center flex items-center justify-center gap-2">
              <CheckCircle2 size={20} />
              <span>تم إثبات الزيارة بنجاح</span>
            </div>
            <button
              onClick={handleRetry}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Save size={16} />
              <span>البصمة التالية</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
