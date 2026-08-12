// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// ===== HELPER FUNCTIONS =====

// 1. جلب خطط السير لموظف اليوم
export async function getTodayJourneyPlans(userId: string) {
  const today = new Date().getDay(); // 0 = الأحد، 1 = الإثنين... 6 = السبت
  // لكن في التقويم الإسلامي: 1 = السبت... 7 = الجمعة
  // فنحول: الأحد (0) = 2، الإثنين (1) = 3... السبت (6) = 1
  
  const arabicDay = today === 0 ? 1 : today; // تحويل سريع
  
  const { data, error } = await supabase
    .from('journey_plans')
    .select('*, clients(*)')
    .eq('user_id', userId)
    .eq('scheduled_day', arabicDay);
  
  return { data, error };
}

// 2. حفظ بصمة جديدة
export async function saveCheckIn(
  companyId: string,
  userId: string,
  clientId: string,
  lat: number,
  lng: number,
  distance: number,
  isValid: boolean
) {
  const { data, error } = await supabase
    .from('check_ins')
    .insert([
      {
        company_id: companyId,
        user_id: userId,
        client_id: clientId,
        latitude: lat,
        longitude: lng,
        distance_from_target: distance,
        is_valid: isValid,
        is_mock_location: false,
      },
    ]);
  
  return { data, error };
}

// 3. حساب المسافة (Haversine Formula)
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
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
}

// 4. التحقق من الموقع الصحيح (ضمن 70 متر)
export function isWithinGeofence(
  userLat: number,
  userLng: number,
  clientLat: number,
  clientLng: number,
  radius: number = 70
): boolean {
  const distance = calculateDistance(userLat, userLng, clientLat, clientLng);
  return distance <= radius;
}

// 5. حفظ البيانات محلياً عند انقطاع الإنترنت
export function saveToLocalQueue(actionType: string, payload: any) {
  try {
    const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
    queue.push({
      actionType,
      payload,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('offline_queue', JSON.stringify(queue));
    return true;
  } catch (error) {
    console.error('Failed to save offline:', error);
    return false;
  }
}

// 6. مزامنة البيانات المحفوظة محلياً
export async function syncOfflineData(userId: string) {
  try {
    const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
    if (queue.length === 0) return;

    for (const item of queue) {
      if (item.actionType === 'check_in') {
        await saveCheckIn(
          item.payload.companyId,
          userId,
          item.payload.clientId,
          item.payload.lat,
          item.payload.lng,
          item.payload.distance,
          item.payload.isValid
        );
      }
    }

    // تفريغ الطابور بعد النجاح
    localStorage.removeItem('offline_queue');
    return true;
  } catch (error) {
    console.error('Sync failed:', error);
    return false;
  }
}

// 7. ربط الجهاز (Device Binding)
export function getDeviceToken(): string {
  return navigator.userAgent + screen.width + screen.height;
}

export function verifyDeviceBinding(userId: string): boolean {
  const stored = localStorage.getItem(`device_${userId}`);
  const current = getDeviceToken();

  if (!stored) {
    localStorage.setItem(`device_${userId}`, current);
    return true;
  }

  return stored === current;
}

// 8. جلب جميع الموظفين (للإدارة)
export async function getEmployees(companyId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('company_id', companyId);

  return { data, error };
}

// 9. جلب جميع العملاء (للإدارة)
export async function getClients(companyId: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('company_id', companyId);

  return { data, error };
}

// 10. جلب إحصائيات البصمات اليوم
export async function getTodayCheckInsStats(companyId: string) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('company_id', companyId)
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);

  if (error) return { stats: null, error };

  const stats = {
    total: data?.length || 0,
    valid: data?.filter((c) => c.is_valid).length || 0,
    invalid: data?.filter((c) => !c.is_valid).length || 0,
    mockDetected: data?.filter((c) => c.is_mock_location).length || 0,
  };

  return { stats, error: null };
}
