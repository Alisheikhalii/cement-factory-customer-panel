#!/usr/bin/env node
/**
 * تست بار پایه برای Endpointهای حیاتی (فاز ۷ — بخش ۱۸ PRD).
 *
 * بدون وابستگی خارجی (fetch داخلی Node ≥ 18). اجرا:
 *   node loadtest/loadtest.mjs [baseUrl]
 * پیش‌فرض baseUrl: http://localhost:3001/api/v1
 *
 * پیکربندی با env:
 *   LOADTEST_CONNECTIONS (پیش‌فرض 20)  — درخواست همزمان
 *   LOADTEST_DURATION_MS (پیش‌فرض 10000) — مدت هر سناریو
 *   LOADTEST_USERNAME / LOADTEST_PASSWORD — کاربر تست برای سناریوهای Auth دار
 *
 * ⚠️ فقط روی محیط توسعه/استیجینگ اجرا شود، نه Production.
 * نکته: Rate Limit عمومی (۱۲۰/دقیقه به‌ازای IP) در این تست به‌عمد لمس می‌شود؛
 * پاسخ‌های 429 جداگانه شمارش می‌شوند تا نتیجهٔ تست با Throttling قاطی نشود.
 */

const baseUrl = process.argv[2] ?? 'http://localhost:3001/api/v1';
const CONNECTIONS = Number(process.env.LOADTEST_CONNECTIONS ?? 20);
const DURATION_MS = Number(process.env.LOADTEST_DURATION_MS ?? 10_000);

/** درصدک از آرایهٔ مرتب. */
function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

/** اجرای یک سناریو با N اتصال همزمان برای مدت مشخص. */
async function runScenario(name, makeRequest) {
  const latencies = [];
  let ok = 0;
  let throttled = 0;
  let failed = 0;
  const deadline = Date.now() + DURATION_MS;

  async function worker() {
    while (Date.now() < deadline) {
      const started = performance.now();
      try {
        const res = await makeRequest();
        const ms = performance.now() - started;
        if (res.status === 429) {
          throttled += 1;
        } else if (res.ok) {
          ok += 1;
          latencies.push(ms);
        } else {
          failed += 1;
        }
        // بدنه باید مصرف شود تا سوکت آزاد بماند.
        await res.arrayBuffer().catch(() => undefined);
      } catch {
        failed += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: CONNECTIONS }, () => worker()));

  latencies.sort((a, b) => a - b);
  const total = ok + throttled + failed;
  const rps = (total / (DURATION_MS / 1000)).toFixed(1);
  console.log(`\n■ ${name}`);
  console.log(`  درخواست‌ها: ${total} (${rps} rps) — موفق: ${ok}، 429: ${throttled}، خطا: ${failed}`);
  if (latencies.length > 0) {
    console.log(
      `  تاخیر ms — p50: ${percentile(latencies, 50).toFixed(0)}، ` +
        `p95: ${percentile(latencies, 95).toFixed(0)}، ` +
        `p99: ${percentile(latencies, 99).toFixed(0)}، ` +
        `max: ${latencies[latencies.length - 1].toFixed(0)}`,
    );
  }
  return { name, total, ok, throttled, failed };
}

/** ورود و گرفتن Access Token برای سناریوهای Auth دار (اختیاری). */
async function login() {
  const username = process.env.LOADTEST_USERNAME;
  const password = process.env.LOADTEST_PASSWORD;
  if (!username || !password) return null;
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    console.warn(`ورود تست بار شکست خورد (HTTP ${res.status}) — سناریوهای Auth دار رد می‌شوند.`);
    return null;
  }
  const body = await res.json();
  return body?.data?.accessToken ?? body?.accessToken ?? null;
}

async function main() {
  console.log(`تست بار روی ${baseUrl} — ${CONNECTIONS} اتصال، ${DURATION_MS / 1000}s هر سناریو`);

  const results = [];
  // ۱) Health — مسیر بدون Auth و بدون DB (خط پایهٔ سربار HTTP/framework)
  results.push(await runScenario('GET /health', () => fetch(`${baseUrl.replace(/\/api\/v1$/, '')}/api/v1/health`)));

  const token = await login();
  if (token) {
    const authHeaders = { Authorization: `Bearer ${token}` };
    // ۲) لیست سفارشات (خواندنی DB + Data Scoping)
    results.push(
      await runScenario('GET /orders (Auth)', () =>
        fetch(`${baseUrl}/orders?page=1&pageSize=20`, { headers: authHeaders }),
      ),
    );
    // ۳) تراکنش‌های مالی (سنگین‌ترین خواندنی: aggregate + صفحه‌بندی)
    results.push(
      await runScenario('GET /finance/transactions (Auth)', () =>
        fetch(`${baseUrl}/finance/transactions?page=1&pageSize=20`, { headers: authHeaders }),
      ),
    );
  } else {
    console.log('\n(بدون LOADTEST_USERNAME/PASSWORD — فقط سناریوی Health اجرا شد)');
  }

  const anyErrors = results.some((r) => r.failed > 0);
  console.log(`\nنتیجه: ${anyErrors ? '⚠️ برخی درخواست‌ها خطا داشتند' : '✅ بدون خطای غیر-429'}`);
  process.exit(anyErrors ? 1 : 0);
}

main().catch((error) => {
  console.error('اجرای تست بار شکست خورد:', error);
  process.exit(1);
});
