"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
/**
 * اسکریپت Seed کامل — بخش ۱۹ PRD.
 *
 * پوشش می‌دهد: ۱۰۰ مشتری (+چند غیرفعال)، ۳ ادمین، محصولات پایه + ۲ محصول آینده،
 * ۲۵۰ سفارش، اعلام‌بارها با هر ۵ وضعیت، تحویل‌های زنجیره‌ای، ۶۰۰ تراکنش مالی در
 * ۴ منبع، ۸۰ شکایت، ۶ نظرسنجی، اعلانات، و فیش‌های واریزی.
 *
 * ⚠️ انحراف مستندشده از حجم بخش ۱۹.۱:
 *  در Schema (بخش ۵.۳) رابطه `Delivery.loadingRequestId` اجباری و `@unique` است؛
 *  بنابراین هیچ Delivery بدون یک LoadingRequest متناظر نمی‌تواند وجود داشته باشد.
 *  عدد «۹۰۰ تحویل» با «۳۰۰ اعلام‌بار» در همان دوره از نظر ساختاری ناسازگار است.
 *  لذا اولویت با قید Schema و صحت رابطه‌ای است: هر LoadingRequest با وضعیت LOADED
 *  دقیقاً یک Delivery می‌گیرد (تعداد تحویل = تعداد اعلام‌بار LOADED). این در گزارش
 *  فاز ۲ صریحاً اعلام شده است.
 *
 * Idempotent: در ابتدای اجرا داده‌های تولیدی قبلی پاک و از نو ساخته می‌شوند
 * (Reset فقط در اسکریپت Seed؛ قانون Soft-Delete مربوط به زمان اجرای برنامه است، نه Seed).
 *
 * قطعیت (Determinism): از یک PRNG با Seed ثابت استفاده می‌شود تا هر اجرا داده یکسان
 * بسازد و شناسه‌ها پایدار بمانند.
 *
 * ⚠️ رمزهای پیش‌فرض فقط برای توسعه‌اند و باید در استقرار واقعی تغییر کنند.
 */
const prisma = new client_1.PrismaClient();
// ==================== PRNG قطعی ====================
let rngState = 987654321;
function rng() {
    rngState = (rngState * 1103515245 + 12345) & 0x7fffffff;
    return rngState / 0x7fffffff;
}
function randInt(min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
}
function pick(arr) {
    return arr[randInt(0, arr.length - 1)];
}
function chance(p) {
    return rng() < p;
}
function money(n) {
    return Math.round(n);
}
// ==================== داده‌های ثابت فارسی ====================
const FIRST_NAMES = [
    'علی', 'محمد', 'حسین', 'رضا', 'مهدی', 'امیر', 'سعید', 'حسن', 'مجید', 'کاظم',
    'فاطمه', 'زهرا', 'مریم', 'سمیرا', 'نرگس', 'اکرم', 'لیلا', 'الهام', 'سارا', 'نازنین',
];
const LAST_NAMES = [
    'محمدی', 'حسینی', 'رضایی', 'کریمی', 'موسوی', 'احمدی', 'صادقی', 'قاسمی', 'نوری', 'کاظمی',
    'جعفری', 'یوسفی', 'شریفی', 'اکبری', 'رحیمی', 'زارع', 'فرهادی', 'مرادی', 'عباسی', 'سلطانی',
];
const COMPANY_SUFFIX = ['بازرگانی', 'ساختمانی', 'عمران', 'پخش', 'تجارت', 'گروه صنعتی'];
const CITIES = [
    'نی‌ریز', 'شیراز', 'استهبان', 'فسا', 'داراب', 'جهرم', 'آباده', 'مرودشت', 'زرین‌دشت', 'اقلید',
];
const CARRIER_NAMES = [
    'باربری آسیا ترابر', 'حمل و نقل پارس بار', 'باربری زاگرس', 'ترابری فارس',
    'باربری امید', 'حمل و نقل نی‌ریز بار',
];
const OPERATION_TYPES = ['واریز نقدی', 'چک', 'حواله بانکی', 'تسویه فاکتور', 'کارمزد', 'اصلاحیه'];
const BANKS = ['ملت', 'ملی', 'صادرات', 'تجارت', 'سپه', 'پاسارگاد'];
const VEHICLE_TYPES = ['TRAILER', 'FLATBED', 'DUMP', 'TEN_WHEEL'];
const LOAD_TYPES = ['FIXED', 'NON_FIXED'];
const PRODUCTS = [
    { erpCode: '2001240001', name: 'سیمان پاکتی تیپ ۲ داخلی', type: 'BAGGED' },
    { erpCode: '2001240002', name: 'سیمان پاکتی تیپ ۲-۴۲۵ داخلی', type: 'BAGGED' },
    { erpCode: '2001240004', name: 'سیمان فله تیپ ۲-۴۲۵ داخلی', type: 'BULK' },
    { erpCode: '2001240005', name: 'سیمان فله پوزولانی داخلی', type: 'BULK' },
    // ۲ محصول آینده برای تست BR-17 (بخش ۱۹.۱)
    { erpCode: '2001240006', name: 'سیمان پاکتی پوزولانی داخلی', type: 'BAGGED' },
    { erpCode: '2001240007', name: 'سیمان فله تیپ ۴۲.۵ داخلی', type: 'BULK' },
];
const TEST_CUSTOMER_NATIONAL_ID = '0013542419';
const ADMIN_USERNAME = 'admin';
const DEV_ADMIN_PASSWORD = 'Admin@12345';
const DEV_CUSTOMER_PASSWORD = 'Customer@12345';
const DAY = 24 * 60 * 60 * 1000;
// ==================== کمکی تاریخ (نسبت به «اکنون») ====================
const NOW = new Date();
function daysAgo(n) {
    return new Date(NOW.getTime() - n * DAY);
}
function daysFromNow(n) {
    return new Date(NOW.getTime() + n * DAY);
}
// ==================== کمکی شناسه/کد ملی ====================
function nationalIdFor(idx) {
    const base = 100000000 + idx * 137; // ۹ رقم یکتا
    const d9 = String(base).padStart(9, '0').slice(0, 9);
    const digits = d9.split('').map((c) => Number.parseInt(c, 10));
    let sum = 0;
    for (let i = 0; i < 9; i += 1) {
        sum += (digits[i] ?? 0) * (10 - i);
    }
    const r = sum % 11;
    const check = r < 2 ? r : 11 - r;
    return d9 + String(check);
}
async function chunkedCreate(rows, create, size = 500) {
    for (let i = 0; i < rows.length; i += size) {
        await create(rows.slice(i, i + size));
    }
}
// ==================== Reset ====================
async function reset() {
    // ترتیب FK-safe: فرزند → والد
    await prisma.surveyAnswerDetail.deleteMany();
    await prisma.surveyAnswer.deleteMany();
    await prisma.surveyOption.deleteMany();
    await prisma.surveyQuestion.deleteMany();
    await prisma.survey.deleteMany();
    await prisma.delivery.deleteMany();
    await prisma.loadingRequest.deleteMany();
    await prisma.order.deleteMany();
    await prisma.financialTransaction.deleteMany();
    await prisma.paymentReceipt.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.carrier.deleteMany();
    await prisma.product.deleteMany();
}
async function seedProductsAndCarriers() {
    for (const p of PRODUCTS) {
        await prisma.product.create({ data: p });
    }
    const products = (await prisma.product.findMany()).map((p) => ({
        id: p.id,
        erpCode: p.erpCode,
        name: p.name,
        type: p.type,
    }));
    const carrierIds = [];
    for (const name of CARRIER_NAMES) {
        const c = await prisma.carrier.create({ data: { name } });
        carrierIds.push(c.id);
    }
    return { products, carrierIds };
}
async function seedAdmins() {
    const passwordHash = await bcrypt.hash(DEV_ADMIN_PASSWORD, 10);
    for (const [username, fullName] of [
        [ADMIN_USERNAME, 'مدیر فروش (ادمین توسعه)'],
        ['admin2', 'کارشناس فروش دو'],
        ['admin3', 'کارشناس فروش سه'],
    ]) {
        await prisma.user.create({
            data: {
                username: username,
                fullName: fullName,
                passwordHash,
                role: client_1.Role.ADMIN,
                customerId: null,
            },
        });
    }
}
async function seedCustomers() {
    const customerPasswordHash = await bcrypt.hash(DEV_CUSTOMER_PASSWORD, 10);
    const result = [];
    for (let i = 0; i < 100; i += 1) {
        const isTest = i === 0;
        // ~۸٪ غیرفعال (به‌جز مشتری تستی) برای تست فیلتر
        const isActive = isTest ? true : !chance(0.08);
        const personName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
        const name = isTest
            ? 'مشتری تستی نی‌ریز'
            : chance(0.5)
                ? personName
                : `${pick(COMPANY_SUFFIX)} ${pick(LAST_NAMES)}`;
        const nationalId = isTest ? TEST_CUSTOMER_NATIONAL_ID : nationalIdFor(i + 5);
        const mobile = isTest ? '09120000000' : `0912${String(1000000 + i).slice(-7)}`;
        const customerCode = isTest ? 'TEST-0001' : `CUS-${String(i).padStart(4, '0')}`;
        const creditLimit = money(randInt(500, 5000) * 1_000_000);
        const creditBalance = money(creditLimit * (0.1 + rng() * 0.8));
        const customer = await prisma.customer.create({
            data: {
                customerCode,
                erpCustomerId: `ERP-${customerCode}`,
                nationalId,
                economicCode: String(randInt(10000000000, 99999999999)),
                name,
                address: `${pick(CITIES)} — [آدرس نمونه Placeholder]`,
                postalCode: String(randInt(1000000000, 9999999999)),
                mobile,
                creditLimit,
                creditBalance,
                isActive,
            },
        });
        await prisma.user.create({
            data: {
                username: nationalId,
                fullName: name,
                passwordHash: customerPasswordHash,
                role: client_1.Role.CUSTOMER,
                customerId: customer.id,
                isActive,
                // مشتری تستی برای راحتی، بقیه طبق BR-26 باید در ورود اول رمز عوض کنند
                mustResetPassword: isTest ? false : chance(0.3),
                lastActivityAt: isActive && chance(0.4) ? daysAgo(rng() * 0.01) : null,
            },
        });
        result.push({ id: customer.id, isActive, mobile, name });
    }
    return result;
}
let orderCounter = 0;
let lrCounter = 0;
let deliveryCounter = 0;
function makeOrder(customerId, product, opts = {}) {
    orderCounter += 1;
    const totalQty = randInt(50, 1000);
    const basePrice = money(randInt(2000, 4000) * 1000);
    const priceWithFactors = money(basePrice * (1.03 + rng() * 0.08));
    return {
        id: `seed_ord_${String(orderCounter).padStart(5, '0')}`,
        orderNumber: `ORD-${String(orderCounter).padStart(6, '0')}`,
        customerId,
        productId: product.id,
        orderDate: daysAgo(randInt(5, 400)),
        totalQty,
        basePrice,
        priceWithFactors,
        delivered: 0,
        forceNoLR: opts.noLR ?? false,
        forceCompleted: opts.completed ?? false,
    };
}
function makeLr(order, status, requestedQty, carrierIds, recipientMobile) {
    lrCounter += 1;
    const submittedAt = new Date(order.orderDate.getTime() + randInt(1, 30) * DAY);
    const hasCarrier = chance(0.6);
    const isLoaded = status === 'LOADED';
    const isRejected = status === 'REJECTED';
    const isCanceled = status === 'CANCELED';
    return {
        id: `seed_lr_${String(lrCounter).padStart(5, '0')}`,
        requestNumber: `LR-${String(lrCounter).padStart(6, '0')}`,
        orderId: order.id,
        customerId: order.customerId,
        productId: order.productId,
        requestedQty,
        vehicleType: pick(VEHICLE_TYPES),
        loadType: pick(LOAD_TYPES),
        requestDate: new Date(submittedAt.getTime() + DAY),
        submittedAt,
        destinationCity: pick(CITIES),
        recipientMobile,
        carrierId: hasCarrier ? pick(carrierIds) : null,
        carrierSetBy: hasCarrier ? 'CUSTOMER' : 'FACTORY',
        status,
        reviewedAt: status === 'APPROVED' || isLoaded || isRejected
            ? new Date(submittedAt.getTime() + randInt(1, 3) * DAY)
            : null,
        reviewedByNote: isRejected ? 'موجودی/اعتبار کافی نیست — لطفاً پس از تسویه اقدام کنید' : null,
        canceledAt: isCanceled ? new Date(submittedAt.getTime() + randInt(1, 2) * DAY) : null,
        loadedAt: isLoaded ? new Date(submittedAt.getTime() + randInt(2, 5) * DAY) : null,
        deliveredQty: isLoaded ? requestedQty : 0,
    };
}
async function seedOrdersChain(customers, products, carrierIds) {
    const orders = [];
    const lrs = [];
    const testCustomer = customers[0];
    // --- سناریوهای تضمینی روی مشتری تستی (بخش ۱۹.۲) ---
    // ۱) سفارش تکمیل‌شده (remaining=0)
    const completedOrder = makeOrder(testCustomer.id, products[0], {
        completed: true,
    });
    orders.push(completedOrder);
    lrs.push(makeLr(completedOrder, 'LOADED', completedOrder.totalQty, carrierIds, testCustomer.mobile));
    // ۲) سفارش نیمه‌تحویل + وضعیت‌های متنوع اعلام‌بار
    const halfOrder = makeOrder(testCustomer.id, products[2]);
    orders.push(halfOrder);
    lrs.push(makeLr(halfOrder, 'LOADED', Math.floor(halfOrder.totalQty * 0.4), carrierIds, testCustomer.mobile));
    lrs.push(makeLr(halfOrder, 'SUBMITTED', randInt(10, 40), carrierIds, testCustomer.mobile));
    lrs.push(makeLr(halfOrder, 'REJECTED', randInt(10, 40), carrierIds, testCustomer.mobile));
    // ۳) سفارش بدون هیچ اعلام‌بار (تست Empty State)
    orders.push(makeOrder(testCustomer.id, products[1], { noLR: true }));
    // ۴) سفارش با لغو از SUBMITTED و لغو از APPROVED
    const cancelOrder = makeOrder(testCustomer.id, products[3]);
    orders.push(cancelOrder);
    const canceledFromSubmitted = makeLr(cancelOrder, 'CANCELED', randInt(10, 30), carrierIds, testCustomer.mobile);
    const canceledFromApproved = makeLr(cancelOrder, 'CANCELED', randInt(10, 30), carrierIds, testCustomer.mobile);
    canceledFromApproved.reviewedAt = new Date(canceledFromApproved.submittedAt.getTime() + DAY);
    lrs.push(canceledFromSubmitted, canceledFromApproved);
    // یک APPROVED باز هم برای تست
    lrs.push(makeLr(cancelOrder, 'APPROVED', randInt(10, 30), carrierIds, testCustomer.mobile));
    // --- بقیه سفارش‌ها تا رسیدن به ۲۵۰ ---
    const statusPool = ['SUBMITTED', 'APPROVED', 'REJECTED', 'LOADED', 'LOADED', 'CANCELED'];
    while (orders.length < 250) {
        // توزیع: مشتریان اول وزن بیشتری دارند (دمو غنی‌تر)
        const cIdx = chance(0.3) ? randInt(0, 9) : randInt(0, customers.length - 1);
        const customer = customers[cIdx];
        const product = pick(products);
        const order = makeOrder(customer.id, product);
        orders.push(order);
        if (chance(0.12)) {
            // ~۱۲٪ سفارش بدون اعلام‌بار
            order.forceNoLR = true;
            continue;
        }
        const lrCount = randInt(0, 3);
        let allocated = 0;
        for (let k = 0; k < lrCount; k += 1) {
            const status = pick(statusPool);
            const remainingRoom = order.totalQty - allocated;
            if (remainingRoom <= 5) {
                break;
            }
            const qty = randInt(5, Math.max(6, Math.floor(remainingRoom * 0.5)));
            const lr = makeLr(order, status, qty, carrierIds, customer.mobile);
            if (status === 'LOADED') {
                allocated += qty;
            }
            lrs.push(lr);
        }
    }
    // --- محاسبه delivered/remaining هر سفارش از تحویل‌های LOADED ---
    const deliveredByOrder = new Map();
    for (const lr of lrs) {
        if (lr.status === 'LOADED') {
            deliveredByOrder.set(lr.orderId, (deliveredByOrder.get(lr.orderId) ?? 0) + lr.deliveredQty);
        }
    }
    for (const order of orders) {
        if (order.forceCompleted) {
            order.delivered = order.totalQty;
        }
        else {
            order.delivered = Math.min(deliveredByOrder.get(order.id) ?? 0, order.totalQty);
        }
    }
    // --- درج سفارش‌ها ---
    const orderRows = orders.map((o) => {
        const remaining = Math.max(o.totalQty - o.delivered, 0);
        const baseAmount = money(o.totalQty * o.basePrice);
        const vatAmount = money(baseAmount * 0.09);
        const amountWithFactors = money(o.totalQty * o.priceWithFactors + vatAmount);
        const deliveredAmount = money(o.delivered * o.priceWithFactors);
        const remainingAmount = Math.max(amountWithFactors - deliveredAmount, 0);
        const status = remaining <= 0 ? 'COMPLETED' : o.orderDate < daysAgo(365) && chance(0.1) ? 'EXPIRED' : 'IN_USE';
        return {
            id: o.id,
            orderNumber: o.orderNumber,
            customerId: o.customerId,
            productId: o.productId,
            orderDate: o.orderDate,
            totalQty: o.totalQty,
            deliveredQty: o.delivered,
            remainingQty: remaining,
            basePrice: o.basePrice,
            baseAmount,
            deliveredAmount,
            vatAmount,
            priceWithFactors: o.priceWithFactors,
            amountWithFactors,
            remainingAmount,
            status: status,
        };
    });
    await chunkedCreate(orderRows, (batch) => prisma.order.createMany({ data: batch }));
    // --- درج اعلام‌بارها ---
    const lrRows = lrs.map((lr) => ({
        id: lr.id,
        requestNumber: lr.requestNumber,
        orderId: lr.orderId,
        customerId: lr.customerId,
        productId: lr.productId,
        requestedQty: lr.requestedQty,
        vehicleType: lr.vehicleType,
        loadType: lr.loadType,
        requestDate: lr.requestDate,
        destinationCity: lr.destinationCity,
        recipientMobile: lr.recipientMobile,
        carrierId: lr.carrierId,
        carrierSetBy: (lr.carrierSetBy ?? undefined),
        status: lr.status,
        submittedAt: lr.submittedAt,
        reviewedAt: lr.reviewedAt,
        reviewedByNote: lr.reviewedByNote,
        canceledAt: lr.canceledAt,
        loadedAt: lr.loadedAt,
    }));
    await chunkedCreate(lrRows, (batch) => prisma.loadingRequest.createMany({ data: batch }));
    return { orders, lrs };
}
async function seedDeliveries(lrs, products, carrierIds) {
    const productMap = new Map(products.map((p) => [p.id, p]));
    const rows = lrs
        .filter((lr) => lr.status === 'LOADED')
        .map((lr) => {
        deliveryCounter += 1;
        const qty = lr.deliveredQty;
        const basePrice = money(randInt(2000, 4000) * 1000);
        const baseAmount = money(qty * basePrice);
        const vatAmount = money(baseAmount * 0.09);
        const deductions = chance(0.2) ? money(baseAmount * 0.01) : 0;
        const amountWithFactors = money(baseAmount + vatAmount - deductions);
        return {
            id: `seed_del_${String(deliveryCounter).padStart(5, '0')}`,
            weighingNumber: `W-${String(deliveryCounter).padStart(6, '0')}`,
            loadingRequestId: lr.id,
            deliveryDate: lr.loadedAt ?? new Date(lr.submittedAt.getTime() + 3 * DAY),
            carrierId: lr.carrierId ?? pick(carrierIds),
            vehicleNumber: `${randInt(11, 99)}ع${randInt(100, 999)}-${randInt(11, 99)}`,
            driverName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
            productId: lr.productId,
            deliveredQty: qty,
            basePrice,
            baseAmount,
            vatAmount,
            deductions,
            amountWithFactors,
            status: (chance(0.05) ? 'DISPUTED' : 'FINALIZED'),
        };
    });
    await chunkedCreate(rows, (batch) => prisma.delivery.createMany({ data: batch }));
    return rows.length;
}
async function seedFinance(customers) {
    const sources = ['TRANSACTION', 'STATEMENT', 'ASSET_REPORT', 'STATUS_STATEMENT'];
    const rows = [];
    const balanceByCustomer = new Map();
    let docCounter = 0;
    for (let i = 0; i < 600; i += 1) {
        docCounter += 1;
        // وزن بیشتر به مشتری تستی و ۱۰ مشتری اول
        const cIdx = chance(0.35) ? randInt(0, 9) : randInt(0, customers.length - 1);
        const customer = customers[cIdx];
        const source = i < 4 ? sources[i] : pick(sources); // تضمین حضور هر ۴ منبع
        const amount = money(randInt(5, 500) * 1_000_000);
        const isDebit = chance(0.5);
        const prevBalance = balanceByCustomer.get(customer.id) ?? 0;
        const newBalance = prevBalance + (isDebit ? -amount : amount);
        balanceByCustomer.set(customer.id, newBalance);
        rows.push({
            id: `seed_fin_${String(docCounter).padStart(6, '0')}`,
            customerId: customer.id,
            docNumber: `DOC-${String(docCounter).padStart(6, '0')}`,
            date: daysAgo(randInt(1, 400)),
            operationType: pick(OPERATION_TYPES),
            bankName: source === 'TRANSACTION' ? pick(BANKS) : null,
            accountNumber: source === 'TRANSACTION' ? String(randInt(1000000000, 9999999999)) : null,
            amount,
            description: chance(0.5) ? 'بابت خرید سیمان' : null,
            dueDate: chance(0.3) ? daysFromNow(randInt(5, 60)) : null,
            debit: source === 'STATUS_STATEMENT' && isDebit ? amount : null,
            credit: source === 'STATUS_STATEMENT' && !isDebit ? amount : null,
            balance: source === 'STATUS_STATEMENT' || source === 'TRANSACTION' ? newBalance : null,
            status: source === 'ASSET_REPORT' ? 'ثبت‌شده' : chance(0.8) ? 'تسویه' : 'باز',
            source: source,
        });
    }
    await chunkedCreate(rows, (batch) => prisma.financialTransaction.createMany({ data: batch }));
}
async function seedComplaints(customers) {
    const subjects = [
        'تاخیر در بارگیری',
        'مغایرت وزن توزین',
        'کیفیت پاکت',
        'مشکل در صدور فاکتور',
        'برخورد پرسنل باربری',
    ];
    const rows = [];
    // تضمین: حداقل یک شکایت پاسخ‌داده و یک باز روی مشتری تستی
    const forced = [
        { status: 'ANSWERED', reply: 'موضوع بررسی و رفع شد. از صبوری شما سپاسگزاریم.' },
        { status: 'PENDING', reply: null },
    ];
    for (let i = 0; i < 80; i += 1) {
        const customer = i < 2 ? customers[0] : customers[randInt(0, customers.length - 1)];
        const answered = i < 2 ? forced[i]?.status === 'ANSWERED' : chance(0.6);
        const submittedAt = daysAgo(randInt(1, 200));
        rows.push({
            customerId: customer.id,
            subject: (i < 2 ? subjects[i] : pick(subjects)) ?? pick(subjects),
            description: 'شرح کامل موضوع شکایت مشتری جهت پیگیری واحد مربوطه.',
            submittedAt,
            status: answered ? 'ANSWERED' : 'PENDING',
            reply: answered
                ? (i < 2 ? forced[i]?.reply : 'موضوع بررسی و اقدام لازم انجام شد.')
                : null,
            repliedAt: answered ? new Date(submittedAt.getTime() + randInt(1, 5) * DAY) : null,
        });
    }
    await chunkedCreate(rows, (batch) => prisma.complaint.createMany({ data: batch }));
}
async function seedSurveys(customers) {
    const titles = [
        'رضایت از فرآیند بارگیری',
        'کیفیت محصولات',
        'عملکرد واحد فروش',
        'سهولت کار با سامانه',
        'رضایت کلی سال گذشته',
        'نظرسنجی خدمات پشتیبانی',
    ];
    const optionTexts = ['خیلی خوب', 'خوب', 'متوسط', 'ضعیف'];
    for (let s = 0; s < 6; s += 1) {
        // نظرسنجی اول PUBLISHED (مشتری تستی هنوز پاسخ نداده)، بقیه CLOSED
        const status = s === 0 ? 'PUBLISHED' : 'CLOSED';
        const survey = await prisma.survey.create({
            data: {
                title: titles[s],
                description: 'لطفاً نظر خود را در مورد موارد زیر اعلام فرمایید.',
                status: status,
                startDate: daysAgo(60),
                endDate: status === 'CLOSED' ? daysAgo(randInt(5, 30)) : null,
                publishedAt: daysAgo(60),
                closedAt: status === 'CLOSED' ? daysAgo(randInt(5, 30)) : null,
            },
        });
        const questions = [];
        for (let q = 0; q < 3; q += 1) {
            const question = await prisma.surveyQuestion.create({
                data: { surveyId: survey.id, text: `سوال ${q + 1}: ${titles[s]}؟`, order: q },
            });
            const optionIds = [];
            for (let o = 0; o < optionTexts.length; o += 1) {
                const opt = await prisma.surveyOption.create({
                    data: { questionId: question.id, text: optionTexts[o], order: o },
                });
                optionIds.push(opt.id);
            }
            questions.push({ id: question.id, optionIds });
        }
        // پاسخ‌ها: برای CLOSED چند مشتری (شامل تستی) پاسخ می‌دهند؛ برای PUBLISHED،
        // مشتری تستی پاسخ نداده تا فرم پاسخ‌دهی قابل تست باشد.
        const responderIndices = new Set();
        const responderCount = status === 'CLOSED' ? randInt(20, 45) : randInt(5, 15);
        for (let r = 0; r < responderCount; r += 1) {
            responderIndices.add(randInt(status === 'PUBLISHED' ? 1 : 0, customers.length - 1));
        }
        for (const idx of responderIndices) {
            const customer = customers[idx];
            const answer = await prisma.surveyAnswer.create({
                data: { surveyId: survey.id, customerId: customer.id },
            });
            for (const question of questions) {
                await prisma.surveyAnswerDetail.create({
                    data: {
                        surveyAnswerId: answer.id,
                        questionId: question.id,
                        selectedOptionId: pick(question.optionIds),
                    },
                });
            }
        }
    }
}
async function seedNotificationsAndReceipts(customers) {
    const testCustomer = customers[0];
    const notifications = [];
    // Broadcast (customerId=null)
    for (let i = 0; i < 8; i += 1) {
        notifications.push({
            customerId: null,
            title: 'اطلاعیه عمومی',
            body: `اطلاعیه شماره ${i + 1}: تغییرات ساعت کاری واحد بارگیری.`,
            isRead: false,
            createdAt: daysAgo(randInt(1, 40)),
        });
    }
    // مشتری‌محور
    for (let i = 0; i < 40; i += 1) {
        const customer = i < 6 ? testCustomer : customers[randInt(0, customers.length - 1)];
        notifications.push({
            customerId: customer.id,
            title: pick(['تایید اعلام بار', 'بارگیری انجام شد', 'پاسخ به شکایت', 'نظرسنجی جدید']),
            body: 'جزئیات رویداد مرتبط با حساب شما.',
            isRead: chance(0.4),
            createdAt: daysAgo(randInt(0, 30)),
        });
    }
    await chunkedCreate(notifications, (batch) => prisma.notification.createMany({ data: batch }));
    // فیش واریزی: تضمین PENDING و REVIEWED روی مشتری تستی
    const receipts = [
        {
            customerId: testCustomer.id,
            fileUrl: 'pending-storage://receipts/demo/receipt-pending.jpg',
            amount: money(120 * 1_000_000),
            description: 'واریز بابت پیش‌پرداخت سفارش',
            status: 'PENDING',
        },
        {
            customerId: testCustomer.id,
            fileUrl: 'pending-storage://receipts/demo/receipt-reviewed.pdf',
            amount: money(80 * 1_000_000),
            description: 'تسویه فاکتور',
            status: 'REVIEWED',
            reviewedAt: daysAgo(2),
            reviewNote: 'تایید شد',
        },
    ];
    for (let i = 0; i < 20; i += 1) {
        const customer = customers[randInt(0, customers.length - 1)];
        receipts.push({
            customerId: customer.id,
            fileUrl: `pending-storage://receipts/seed/receipt-${i}.jpg`,
            amount: money(randInt(10, 300) * 1_000_000),
            description: chance(0.5) ? 'واریز نقدی' : null,
            status: pick(['PENDING', 'REVIEWED', 'REJECTED']),
        });
    }
    await chunkedCreate(receipts, (batch) => prisma.paymentReceipt.createMany({ data: batch }));
}
async function main() {
    await reset();
    const { products, carrierIds } = await seedProductsAndCarriers();
    await seedAdmins();
    const customers = await seedCustomers();
    const { lrs } = await seedOrdersChain(customers, products, carrierIds);
    const deliveryCount = await seedDeliveries(lrs, products, carrierIds);
    await seedFinance(customers);
    await seedComplaints(customers);
    await seedSurveys(customers);
    await seedNotificationsAndReceipts(customers);
    // eslint-disable-next-line no-console
    console.log([
        'Seed فاز ۲ کامل شد:',
        `  محصولات: ${products.length} | باربری: ${carrierIds.length}`,
        `  مشتری: ${customers.length} (+۳ ادمین)`,
        `  سفارش: ${orderCounter} | اعلام‌بار: ${lrCounter} | تحویل: ${deliveryCount}`,
        '  مالی: ۶۰۰ | شکایت: ۸۰ | نظرسنجی: ۶ | فیش/اعلان: seeded',
        '',
        `ورود تستی مشتری: کد ملی ${TEST_CUSTOMER_NATIONAL_ID} / ${DEV_CUSTOMER_PASSWORD}`,
        `ورود ادمین: ${ADMIN_USERNAME} / ${DEV_ADMIN_PASSWORD}`,
    ].join('\n'));
}
main()
    .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
})
    .finally(() => {
    void prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map