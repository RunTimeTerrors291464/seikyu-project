/**
 * Tạo product units rồi products qua API Gateway (role MANAGER).
 * Cần platform + api-gateway đang chạy.
 *
 * 1) Điền object CONFIG bên dưới (URL, tài khoản hoặc token).
 * 2) Chạy từ thư mục gốc repo:
 *    npx ts-node scripts/seed-products-via-gateway.ts
 */

// ─── Điền trước khi chạy ─────────────────────────────────────────────────────
const CONFIG = {
  /** Base URL gateway, không có / ở cuối (vd: http://localhost:4000) */
  apiBaseUrl: 'http://localhost:4000',

  /**
   * JWT access token (MANAGER). Nếu để trống thì script sẽ gọi login bằng username/password.
   */
  accessToken: '',

  /** Bắt buộc khi accessToken để trống */
  username: '',
  password: '',

  productUnitCount: 10,
  productCount: 1000,
  /** Số request tạo product chạy song song */
  productCreateConcurrency: 5,
};
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = CONFIG.apiBaseUrl.replace(/\/$/, '');

const LOGIN_PATH = '/api/v1/auth/login';
const PRODUCT_UNITS_PATH = '/api/v1/product-units';
const PRODUCTS_PATH = '/api/v1/products';

function skuForIndex(oneBasedIndex: number): string {
  const n = String(oneBasedIndex).padStart(12, '0');
  return `S${n}`.slice(0, 13);
}

async function parseJsonResponse(res: Response): Promise<Record<string, unknown> | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { _raw: text };
  }
}

async function login(username: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}${LOGIN_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(`Login failed ${res.status}: ${JSON.stringify(body)}`);
  }
  const token = body?.accessToken;
  if (typeof token !== 'string' || !token) {
    throw new Error(`Login response missing accessToken: ${JSON.stringify(body)}`);
  }
  return token;
}

async function apiPost(token: string, pathname: string, jsonBody: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE_URL}${pathname}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(jsonBody),
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(`POST ${pathname} failed ${res.status}: ${JSON.stringify(body)}`);
  }
  return body ?? {};
}

async function runPool<T>(items: T[], concurrency: number, worker: (item: T, index: number) => Promise<void>): Promise<void> {
  let next = 0;

  async function runOne(): Promise<void> {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      await worker(items[i], i);
    }
  }

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () => runOne());
  await Promise.all(runners);
}

async function main(): Promise<void> {
  let token = CONFIG.accessToken.trim();
  if (!token) {
    if (!CONFIG.username || !CONFIG.password) {
      console.error(
        'Trong CONFIG: điền accessToken, hoặc điền cả username và password (tài khoản MANAGER).',
      );
      process.exit(1);
    }
    console.log(`Đang đăng nhập: ${CONFIG.username}...`);
    token = await login(CONFIG.username, CONFIG.password);
  }

  const numUnits = Math.max(1, CONFIG.productUnitCount);
  const numProducts = Math.max(1, CONFIG.productCount);
  const concurrency = Math.max(1, CONFIG.productCreateConcurrency);

  console.log(`Tạo ${numUnits} product units → ${BASE_URL}${PRODUCT_UNITS_PATH}`);
  const unitIds: string[] = [];
  for (let i = 0; i < numUnits; i++) {
    const created = await apiPost(token, PRODUCT_UNITS_PATH, {
      unitName: `Seed Unit ${i + 1} ${Date.now()}-${i}`,
      unitDescription: `Auto-seeded unit #${i + 1}`,
    });
    const id = created.id;
    const name = created.unitName;
    if (typeof id !== 'string') {
      throw new Error(`Thiếu id trong response tạo unit: ${JSON.stringify(created)}`);
    }
    unitIds.push(id);
    console.log(`  [${i + 1}/${numUnits}] ${name ?? '?'} → ${id}`);
  }

  console.log(`Tạo ${numProducts} products (song song tối đa ${concurrency})...`);
  const indices = Array.from({ length: numProducts }, (_, i) => i);
  let done = 0;
  const errors: { i: number; sku: string; message: string }[] = [];

  await runPool(indices, concurrency, async (i) => {
    const productUnitId = unitIds[i % unitIds.length];
    const sku = skuForIndex(i + 1);
    try {
      await apiPost(token, PRODUCTS_PATH, {
        sku,
        productNames: [`Seed Product ${i + 1}`, `SP ${sku}`],
        productUnitId,
        productDescription: `Seeded product index ${i + 1}`,
        importPrice: 10 + (i % 100),
        sellingPrice: 15 + (i % 100),
        reorderThreshold: 5,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      errors.push({ i: i + 1, sku, message });
    } finally {
      done++;
      if (done % 100 === 0 || done === numProducts) {
        console.log(`  Tiến độ: ${done}/${numProducts}`);
      }
    }
  });

  if (errors.length > 0) {
    console.error(`Xong nhưng có ${errors.length} lỗi (hiện tối đa 5):`);
    console.error(errors.slice(0, 5));
    process.exit(1);
  }

  console.log(`Hoàn tất: ${numUnits} đơn vị, ${numProducts} sản phẩm.`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
