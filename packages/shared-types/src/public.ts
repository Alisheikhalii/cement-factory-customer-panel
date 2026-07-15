/**
 * Type های بخش عمومی/لندینگ پیج (بخش ۹.۱۰ PRD).
 * فقط فرم تماس یک Endpoint سبک دارد؛ بقیه محتوای عمومی از فایل‌های Markdown خوانده
 * می‌شود و اصلاً به Backend/DB وصل نیست (instruction.md §2 و بخش ۹.۱۰.۱).
 */

/** ورودی فرم «تماس با ما» (بخش ۹.۱۰.۴). بدون Auth، بدون ذخیره در DB. */
export interface ContactMessageInput {
  /** نام فرستنده */
  name: string;
  /** موبایل یا ایمیل تماس */
  phoneOrEmail: string;
  /** متن پیام */
  message: string;
}

/** پاسخ ارسال موفق پیام تماس. */
export interface ContactMessageResponse {
  /** همیشه true در صورت موفقیت (خطاها از طریق کاتالوگ خطا برمی‌گردند). */
  sent: boolean;
}
