/**
 * ابزار تبدیل تاریخ میلادی ↔ جلالی (شمسی) — بدون وابستگی خارجی.
 * پیاده‌سازی الگوریتم مرجع jalaali-js (اثبات‌شده) برای محاسبه مرز ماه/روز جلالی
 * سمت Backend؛ لازم برای KPI «مجموع تحویل ماه جاری شمسی» (بخش ۹.۲) و
 * برچسب ماه در روند تحویل (بخش ۱۱.۲).
 */

const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

interface Jalaali {
  jy: number;
  jm: number;
  jd: number;
}

function div(a: number, b: number): number {
  return Math.trunc(a / b);
}

function mod(a: number, b: number): number {
  return a - div(a, b) * b;
}

const IRAN_TIME_ZONE = 'Asia/Tehran';
// offset ایران از ۲۰۲۲ ثابت +۳:۳۰ است (بدون ساعت تابستانی).
const IRAN_OFFSET_MS = (3 * 60 + 30) * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** اجزای تاریخ (سال/ماه/روز) یک لحظه به وقت ایران، مستقل از TZ سرور. */
function toIranYmd(instant: Date): { year: number; month: number; day: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: IRAN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(instant);
  const get = (type: string): number =>
    Number(parts.find((p) => p.type === type)?.value ?? '0');
  return { year: get('year'), month: get('month'), day: get('day') };
}

/** لحظهٔ UTC متناظر با نیمه‌شب ایرانِ روزی که `instant` در آن قرار دارد. */
function iranMidnightUtc(instant: Date): Date {
  const { year, month, day } = toIranYmd(instant);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - IRAN_OFFSET_MS);
}

/**
 * کلید یکتای «روز تقویمی ایران» به‌صورت `YYYY-MM-DD` میلادی (به وقت ایران، مستقل از
 * TZ سرور). برای هم‌تراز کردن محورِ نمودار (لحظه‌های نیمه‌شب ایران) با ردیف‌های
 * گروه‌بندی‌شدهٔ DB که به همین قالب برمی‌گردند استفاده می‌شود.
 */
export function iranDayKey(instant: Date): string {
  const { year, month, day } = toIranYmd(instant);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

/**
 * بازهٔ UTC یک تاریخِ میلادیِ ورودی (`YYYY-MM-DD…`) که به‌عنوان یک روز تقویمیِ ایران
 * تفسیر می‌شود: `start` = نیمه‌شب ایرانِ همان روز، `end` = نیمه‌شب ایرانِ روز بعد
 * (کرانِ بالا انحصاری). برای فیلتر بازهٔ تاریخ تا کل «روز پایان» پوشش داده شود.
 */
export function iranDayRangeUtc(iso: string): { start: Date; end: Date } {
  const parts = iso.slice(0, 10).split('-');
  const year = Number(parts[0] ?? '0');
  const month = Number(parts[1] ?? '1');
  const day = Number(parts[2] ?? '1');
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - IRAN_OFFSET_MS);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262,
    2324, 2394, 2456, 3178,
  ];
  const bl = breaks.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0] ?? 0;
  let jump = 0;
  for (let i = 1; i < bl; i += 1) {
    const jm = breaks[i] ?? 0;
    jump = jm - jp;
    if (jy < jm) {
      break;
    }
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) {
    leapJ += 1;
  }
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) {
    n = n - jump + div(jump + 4, 33) * 33;
  }
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) {
    leap = 4;
  }
  return { leap, gy, march };
}

function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function d2j(jdn: number): Jalaali {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) {
      return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) {
      k += 1;
    }
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}

/** تبدیل Date میلادی به {jy,jm,jd} جلالی.
 * ⚠️ لحظه به وقت ایران (`Asia/Tehran`) تفسیر می‌شود، مستقل از TZ سرور — تا مرز
 * ماه/روز شمسی در KPIها با تقویم واقعی مشتری یکی باشد (هم‌راستا با deadline util).
 */
export function toJalaali(date: Date): Jalaali {
  const { year, month, day } = toIranYmd(date);
  const jdn = g2d(year, month, day);
  return d2j(jdn);
}

/** برچسب کوتاه ماه/سال جلالی، مثلاً «مرداد ۱۴۰۳». */
export function jalaaliMonthLabel(date: Date): string {
  const { jy, jm } = toJalaali(date);
  return `${PERSIAN_MONTHS[jm - 1] ?? ''} ${jy}`;
}

/**
 * ابتدای ماه جلالیِ جاری به‌صورت لحظهٔ UTC متناظر با نیمه‌شب ایران (۰۰:۰۰ روز اول
 * همان ماه شمسی، به وقت ایران). برای فیلتر «تحویل ماه جاری» استفاده می‌شود.
 */
export function currentJalaaliMonthStart(now: Date): Date {
  const todayMidnight = iranMidnightUtc(now);
  const { jd } = toJalaali(now);
  // offset ایران ثابت است؛ کم‌کردن روزهای کامل، هم‌ترازیِ نیمه‌شب ایران را حفظ می‌کند.
  return new Date(todayMidnight.getTime() - (jd - 1) * DAY_MS);
}

/** ابتدای امروز (۰۰:۰۰ به وقت ایران، به‌صورت لحظهٔ UTC). */
export function startOfToday(now: Date): Date {
  return iranMidnightUtc(now);
}

/**
 * ابتدای هفته جاری شمسی (شنبه ۰۰:۰۰ به وقت ایران). در تقویم شمسی هفته از شنبه
 * شروع می‌شود. روزِ هفته به وقت ایران محاسبه می‌شود (نه TZ سرور).
 */
export function currentJalaaliWeekStart(now: Date): Date {
  const today = iranMidnightUtc(now);
  // getUTCDay روی لحظهٔ نیمه‌شب ایران: یکشنبه=0 ... شنبه=6 → فاصله تا شنبهٔ قبل.
  // نیمه‌شب ایران کمی پیش از نیمه‌شب UTC همان روز است، پس روزِ هفتهٔ UTC یکی عقب‌تر
  // می‌افتد؛ برای جبران، نیم‌روز جلو می‌بریم تا روزِ هفتهٔ ایران به‌درستی به‌دست آید.
  const iranNoon = new Date(today.getTime() + DAY_MS / 2);
  const daysSinceSaturday = (iranNoon.getUTCDay() + 1) % 7;
  return new Date(today.getTime() - daysSinceSaturday * DAY_MS);
}

/** برچسب کوتاه روز جلالی، مثلاً «۲۱ مرداد». */
export function jalaaliDayLabel(date: Date): string {
  const { jm, jd } = toJalaali(date);
  return `${jd} ${PERSIAN_MONTHS[jm - 1] ?? ''}`;
}

/**
 * ابتدای ماه جلالیِ N ماه قبل از now (برای بازه نمودار روند تحویل، بخش ۱۱.۲).
 * با کم‌کردن روزها و رسیدن به ابتدای ماه جلالی هدف محاسبه می‌شود.
 */
export function jalaaliMonthStartMonthsAgo(now: Date, monthsAgo: number): Date {
  let cursor = currentJalaaliMonthStart(now);
  for (let i = 0; i < monthsAgo; i += 1) {
    // یک روز به عقب → داخل ماه قبل، سپس ابتدای همان ماه
    const prevDay = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
    cursor = currentJalaaliMonthStart(prevDay);
  }
  return cursor;
}
