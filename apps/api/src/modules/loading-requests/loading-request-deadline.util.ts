/**
 * منطق مهلت ثبت درخواست اعلام بار (BR-04).
 *
 * قوانین:
 *  - درخواست فقط برای «فردا» ثبت می‌شود (Requested Delivery Date = فردا).
 *  - ثبت فقط تا ساعت ۱۵:۰۰ «امروز» به وقت ایران مجاز است؛ پس از آن مهلت تمام است.
 *
 * همه محاسبات به وقت ایران (`Asia/Tehran`) انجام می‌شود، مستقل از TZ سرور،
 * تا رفتار در Container/Production یکسان بماند. برای تست‌پذیری، «اکنون» تزریق می‌شود
 * (بخش ۱۸: تست BR-04 باید ساعت را Mock کند، نه منتظر ساعت واقعی بماند).
 */

const IRAN_TIME_ZONE = 'Asia/Tehran';

/** آخرین ساعت مجاز ثبت (۱۵:۰۰). پس از این ساعت، مهلت فردا بسته است. */
export const REQUEST_CUTOFF_HOUR = 15;

interface IranDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/** اجزای تاریخ/ساعت یک لحظه به وقت ایران. */
function toIranParts(instant: Date): IranDateParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: IRAN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(instant);
  const get = (type: string): number =>
    Number(parts.find((p) => p.type === type)?.value ?? '0');
  // Intl گاهی ساعت ۲۴ برمی‌گرداند برای نیمه‌شب؛ به ۰ نرمال می‌کنیم.
  const hour = get('hour') % 24;
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour,
    minute: get('minute'),
  };
}

/**
 * آیا در لحظه `now` هنوز مهلت ثبت درخواست برای فردا باز است؟
 * true اگر ساعت ایران < ۱۵:۰۰ باشد.
 */
export function isWithinRequestWindow(now: Date): boolean {
  return toIranParts(now).hour < REQUEST_CUTOFF_HOUR;
}

/**
 * تاریخ درخواستی معتبر (= فردا به وقت ایران) را به‌صورت نیمه‌شب ایران برمی‌گرداند.
 * Backend همیشه این مقدار را ست می‌کند (نه ورودی کاربر) تا BR-04 نقض نشود.
 */
export function computeRequestDate(now: Date): Date {
  const today = toIranParts(now);
  // نیمه‌شب فردا به وقت ایران: از نیمه‌شب امروز ایران شروع و ۲۴ ساعت جلو می‌رویم.
  // نیمه‌شب امروز ایران بر حسب UTC: امروزِ ایران در ساعت ۰۰:۰۰، با offset ایران (+03:30).
  const iranMidnightUtc = Date.UTC(today.year, today.month - 1, today.day, 0, 0, 0);
  // offset ایران ثابت +۳:۳۰ است (بدون ساعت تابستانی از ۲۰۲۲). نیمه‌شب ایران = UTC - 3:30.
  const IRAN_OFFSET_MS = (3 * 60 + 30) * 60 * 1000;
  const todayMidnightIran = new Date(iranMidnightUtc - IRAN_OFFSET_MS);
  const DAY_MS = 24 * 60 * 60 * 1000;
  return new Date(todayMidnightIran.getTime() + DAY_MS);
}
