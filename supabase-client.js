(async()=>{
const T=window.TR;if(!T)return;const sb=T.sb;let session=(await sb.auth.getSession()).data.session;
if(!session){T.authUI('دخول العميل — BAYTNA',true);T.say('يرجى تسجيل دخول العميل');return}
T.logoutButton();let cities=[],services=[];
async function refresh(){try{const rows=await T.getBookings(),cm=new Map(cities.map(c=>[c.id,c.name_ar]));localStorage.setItem('baytna_royal_client_v9_orders',JSON.stringify(rows.map(r=>T.toClient(r,cm))));if(typeof render==='function')render();T.say('متصل بـ Supabase — الحجوزات محدثة')}catch(e){T.say('تعذر تحميل حجوزاتك: '+e.message)}}
try{[cities,services]=await Promise.all([T.getCities(),T.getServices()]);}catch(e){T.say('خطأ قراءة البيانات: '+e.message);return}
const form=document.getElementById('bookingForm');if(form){form.onsubmit=async e=>{e.preventDefault();if(!form.reportValidity())return;const d=Object.fromEntries(new FormData(form));const reg=T.regionMap[d.region];const city=cities.find(c=>c.region_id===reg&&c.name_ar===d.city);const svc=services.find(s=>s.name_ar===d.service)||services.find(s=>s.name_ar.includes('تنظيف'));
if(!reg||!city)return notify('خطأ','المنطقة أو المدينة غير موجودة بقاعدة البيانات');if(!svc)return notify('خطأ','لا توجد خدمة متاحة بقاعدة البيانات');
const time=d.time||'09:00';const at=new Date(`${d.date}T${time}:00+03:00`);if(isNaN(at.getTime())||at<=new Date())return notify('خطأ','اختر موعدًا مستقبليًا');
T.say('جاري حفظ الحجز على Supabase...');const {data,error}=await sb.rpc('tr_create_booking',{p_name:d.name,p_phone:d.phone,p_service_id:svc.id,p_region_id:reg,p_city_id:city.id,p_scheduled_at:at.toISOString(),p_district:d.district||null,p_address:d.address||null,p_package:d.package||null,p_notes:[d.notes||'',`الخدمة المطلوبة: ${d.service}`,`الساعات: ${d.hours||''}`,`عدد العاملات: ${d.workers||''}`].filter(Boolean).join(' | ')});
if(error){T.say('فشل الحجز: '+error.message);notify('لم يتم الحفظ',error.message);return}form.reset();if(typeof estimate==='function')estimate();await refresh();notify('تم تسجيل الحجز',`رقم الحجز ${data.booking_no} — محفوظ في قاعدة البيانات`)};}
await refresh();setInterval(refresh,12000);
})();