import { Injectable, Logger, type OnApplicationShutdown } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';

/**
 * پورت حداقلی Redis برای شمارش Rate Limit — Storage فقط به این وابسته است.
 * پیش‌فرض (createIoredisClient) با درایور `ioredis` ساخته می‌شود؛ تست‌ها نمونهٔ
 * ساختگی تزریق می‌کنند (بدون Redis واقعی) — همان الگوی ErpSqlClient.
 */
export interface RedisEvalClient {
  eval(script: string, numKeys: number, ...args: (string | number)[]): Promise<unknown>;
  quit(): Promise<unknown>;
}

export type RedisEvalClientFactory = () => RedisEvalClient;

/**
 * اسکریپت Lua اتمی شمارش (اقتباس از throttler-storage-redis رسمی):
 * INCR + تثبیت TTL پنجره + مدیریت کلید Block — همه در یک رفت‌وبرگشت، بدون Race
 * بین چند Instance از API (دلیل جایگزینی حافظهٔ محلی در فاز ۷، بخش ۱۳ PRD).
 */
const INCREMENT_SCRIPT = `
local totalHits = redis.call('INCR', KEYS[1])
local timeToExpire = redis.call('PTTL', KEYS[1])
if timeToExpire <= 0 then
  redis.call('PEXPIRE', KEYS[1], tonumber(ARGV[1]))
  timeToExpire = tonumber(ARGV[1])
end
local blocked = redis.call('GET', KEYS[2])
local timeToBlockExpire = 0
if blocked then
  timeToBlockExpire = redis.call('PTTL', KEYS[2])
elseif totalHits > tonumber(ARGV[3]) then
  redis.call('SET', KEYS[2], 1, 'PX', tonumber(ARGV[2]))
  timeToBlockExpire = tonumber(ARGV[2])
end
return { totalHits, timeToExpire, timeToBlockExpire }
`;

/**
 * ThrottlerStorage مبتنی بر Redis (فاز ۷ — بخش ۱۳ PRD).
 *
 * جایگزین Storage درون‌حافظه‌ای پیش‌فرض تا: (۱) سقف‌ها بین چند Instance مشترک
 * باشند، (۲) ری‌استارت API شمارنده‌ها را صفر نکند. اتصال از `REDIS_URL` env
 * می‌آید. اگر Redis در دسترس نباشد، خطای اتصال Log و درخواست «مجاز» شمرده
 * می‌شود (Fail-open): قطعی Redis نباید کل API را از دسترس خارج کند —
 * محافظت سیل‌بند لایهٔ Edge سر جای خود می‌ماند.
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage, OnApplicationShutdown {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private readonly clientFactory: RedisEvalClientFactory;
  private client: RedisEvalClient | null = null;

  constructor(
    private readonly config: ConfigService,
    clientFactory?: RedisEvalClientFactory,
  ) {
    this.clientFactory = clientFactory ?? ((): RedisEvalClient => this.createIoredisClient());
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const hitKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `${hitKey}:blocked`;
    try {
      const raw = (await this.getClient().eval(
        INCREMENT_SCRIPT,
        2,
        hitKey,
        blockKey,
        ttl,
        blockDuration,
        limit,
      )) as [number, number, number];
      const totalHits = raw[0];
      const timeToExpire = Math.ceil(raw[1] / 1000);
      const timeToBlockExpire = Math.ceil(raw[2] / 1000);
      return {
        totalHits,
        timeToExpire,
        isBlocked: raw[2] > 0,
        timeToBlockExpire,
      };
    } catch (error) {
      // Fail-open (توضیح در JSDoc کلاس): قطعی Redis ترافیک عادی را نمی‌بندد.
      this.logger.error(
        `شمارش Rate Limit در Redis شکست خورد (${(error as Error).message}) — درخواست مجاز شمرده شد`,
      );
      return { totalHits: 1, timeToExpire: Math.ceil(ttl / 1000), isBlocked: false, timeToBlockExpire: 0 };
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
      this.client = null;
    }
  }

  private getClient(): RedisEvalClient {
    if (!this.client) {
      this.client = this.clientFactory();
    }
    return this.client;
  }

  /**
   * Client پیش‌فرض مبتنی بر `ioredis` — بار تنبل تا در تست/محیط بدون Redis،
   * وابستگی لازم نباشد. `lazyConnect: false` پیش‌فرض ioredis اتصال را خودش
   * مدیریت می‌کند (retry داخلی).
   */
  private createIoredisClient(): RedisEvalClient {
    let RedisCtor: new (url: string, opts?: Record<string, unknown>) => RedisEvalClient;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      RedisCtor = require('ioredis');
    } catch {
      throw new Error(
        'درایور «ioredis» نصب نیست. برای Rate Limiting مبتنی بر Redis ابتدا `pnpm add ioredis` را اجرا کنید.',
      );
    }
    const url = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    return new RedisCtor(url, {
      // اگر Redis در دسترس نباشد، فرمان‌ها سریع شکست بخورند تا Fail-open عمل کند
      // (به‌جای صف طولانی و تاخیر پاسخ API).
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
  }
}
