import type { ConfigService } from '@nestjs/config';
import { RedisThrottlerStorage, type RedisEvalClient } from './redis-throttler.storage';

/**
 * تست RedisThrottlerStorage با Client ساختگی (فاز ۷ — بخش ۱۳ PRD) — بدون Redis
 * واقعی. اثبات می‌کند: کلیدها/آرگومان‌های اسکریپت Lua درست ساخته می‌شوند، خروجی
 * به قرارداد ThrottlerStorageRecord نگاشت می‌شود و قطعی Redis رفتار Fail-open دارد.
 */

function fakeConfig(): ConfigService {
  return { get: (_key: string, def?: unknown): unknown => def } as unknown as ConfigService;
}

interface EvalCall {
  numKeys: number;
  args: (string | number)[];
}

function makeStorage(result: [number, number, number] | Error): {
  storage: RedisThrottlerStorage;
  calls: EvalCall[];
  quits: number[];
} {
  const calls: EvalCall[] = [];
  const quits: number[] = [];
  const client: RedisEvalClient = {
    eval: (_script, numKeys, ...args): Promise<unknown> => {
      calls.push({ numKeys, args });
      return result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
    },
    quit: (): Promise<unknown> => {
      quits.push(1);
      return Promise.resolve('OK');
    },
  };
  const storage = new RedisThrottlerStorage(fakeConfig(), () => client);
  return { storage, calls, quits };
}

describe('RedisThrottlerStorage', () => {
  it('increment: کلیدها با نام Throttler و کلید درخواست ساخته می‌شوند', async () => {
    const { storage, calls } = makeStorage([1, 60_000, 0]);
    await storage.increment('ip-1', 60_000, 120, 0, 'default');
    expect(calls[0]?.numKeys).toBe(2);
    expect(calls[0]?.args.slice(0, 2)).toEqual([
      'throttle:default:ip-1',
      'throttle:default:ip-1:blocked',
    ]);
    expect(calls[0]?.args.slice(2)).toEqual([60_000, 0, 120]);
  });

  it('زیر سقف → isBlocked=false و شمارش برگردانده می‌شود', async () => {
    const { storage } = makeStorage([5, 42_000, 0]);
    const record = await storage.increment('k', 60_000, 120, 0, 'default');
    expect(record).toEqual({
      totalHits: 5,
      timeToExpire: 42,
      isBlocked: false,
      timeToBlockExpire: 0,
    });
  });

  it('عبور از سقف → isBlocked=true با زمان انقضای Block', async () => {
    const { storage } = makeStorage([121, 30_000, 15_000]);
    const record = await storage.increment('k', 60_000, 120, 15_000, 'default');
    expect(record.isBlocked).toBe(true);
    expect(record.timeToBlockExpire).toBe(15);
  });

  it('قطعی Redis → Fail-open (درخواست مجاز، بدون پرتاب خطا)', async () => {
    const { storage } = makeStorage(new Error('ECONNREFUSED'));
    const record = await storage.increment('k', 60_000, 120, 0, 'default');
    expect(record.isBlocked).toBe(false);
    expect(record.totalHits).toBe(1);
  });

  it('onApplicationShutdown اتصال باز را می‌بندد (و بدون اتصال، بی‌اثر است)', async () => {
    const { storage, quits } = makeStorage([1, 1_000, 0]);
    await storage.onApplicationShutdown(); // هنوز Client ساخته نشده
    expect(quits).toHaveLength(0);
    await storage.increment('k', 60_000, 120, 0, 'default');
    await storage.onApplicationShutdown();
    expect(quits).toHaveLength(1);
  });
});
