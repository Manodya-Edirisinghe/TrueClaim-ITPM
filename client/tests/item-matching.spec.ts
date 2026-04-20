import { expect, test } from '@playwright/test';
import { existsSync } from 'fs';
import path from 'path';
import { getAuthSession, login, TEST_USERS } from './helpers/login';

function resolveImageFixturePath(): string {
  const candidates = [
    'Samsung phone 1.jpg',
    'Airpods Pro 1.jpg',
    'Toyota car key.jpg',
    'Toyota car key.jpeg',
  ].map((name) => path.resolve(__dirname, 'images', name));

  const match = candidates.find((filePath) => existsSync(filePath));
  if (!match) {
    throw new Error(
      `No matching fixture image found. Tried: ${candidates.map((entry) => path.basename(entry)).join(', ')}`
    );
  }

  return match;
}

const MATCHING_IMAGE_PATH = resolveImageFixturePath();
const SEEDED_IPHONE_TITLE = 'E2E iPhone 14 Pro';
const SEEDED_WALLET_TITLE = 'E2E Leather Wallet';

async function ensureMatchingSeedData(page: import('@playwright/test').Page): Promise<void> {
  const owner = await getAuthSession(page, TEST_USERS.osanda);

  const listResponse = await page.request.get('/server-api/items');
  if (listResponse.status() !== 200) {
    const bodyText = await listResponse.text();
    throw new Error(`Failed to list items for seeding (${listResponse.status()}): ${bodyText}`);
  }

  const listData = (await listResponse.json()) as {
    items?: Array<{ itemTitle?: string }>;
  };
  const items = Array.isArray(listData.items) ? listData.items : [];
  const hasIphone = items.some((item) => item.itemTitle === SEEDED_IPHONE_TITLE);
  const hasWallet = items.some((item) => item.itemTitle === SEEDED_WALLET_TITLE);

  const createItem = async (payload: {
    itemTitle: string;
    itemCategory: string;
    description: string;
  }) => {
    const createResponse = await page.request.post('/server-api/items', {
      headers: {
        Authorization: `Bearer ${owner.token}`,
      },
      data: {
        itemType: 'found',
        itemTitle: payload.itemTitle,
        itemCategory: payload.itemCategory,
        description: payload.description,
        time: new Date().toISOString(),
        location: 'Main Library',
        contactNumber: '0770000000',
      },
    });

    if (createResponse.status() !== 201) {
      const bodyText = await createResponse.text();
      throw new Error(`Failed to create seed item (${createResponse.status()}): ${bodyText}`);
    }
  };

  if (!hasIphone) {
    await createItem({
      itemTitle: SEEDED_IPHONE_TITLE,
      itemCategory: 'Electronics',
      description: 'Found iPhone near cafeteria with blue case',
    });
  }

  if (!hasWallet) {
    await createItem({
      itemTitle: SEEDED_WALLET_TITLE,
      itemCategory: 'Wallet / Purse',
      description: 'Brown wallet found near auditorium',
    });
  }
}

test.describe('Item Matching', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.manod);
    await ensureMatchingSeedData(page);
    await page.goto('/matching');
    await expect(page.getByRole('heading', { name: 'Item Matching' })).toBeVisible();
  });

  test('Test A: Matching page loads', async ({ page }) => {
    await expect(page.getByTestId('search-section')).toBeVisible();
    await expect(page.getByTestId('results-section')).toBeVisible();
    await expect(page.getByTestId('item-card').first()).toBeVisible();

    const itemCount = await page.getByTestId('item-card').count();
    expect(itemCount).toBeGreaterThan(0);
  });

  test('Test B: Keyword search works', async ({ page }) => {
    const unrelatedBeforeCount = await page
      .getByTestId('item-card')
      .filter({ hasText: /wallet|purse|keys/i })
      .count();

    await page.getByTestId('keyword-input').fill('iPhone');
    await page.getByTestId('search-button').click();

    await expect(page.getByTestId('item-card').first()).toBeVisible();
    await expect(page.getByTestId('item-card').filter({ hasText: /iphone/i }).first()).toBeVisible();

    if (unrelatedBeforeCount > 0) {
      await expect(
        page.getByTestId('item-card').filter({ hasText: /wallet|purse|keys/i })
      ).toHaveCount(0);
    }
  });

  test('Test C: Category filter works', async ({ page }) => {
    await page.getByTestId('category-select').selectOption({ label: 'Electronics' });
    await page.getByTestId('search-button').click();

    const cards = page.getByTestId('item-card');
    await expect(cards.first()).toBeVisible();

    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i += 1) {
      await expect(cards.nth(i)).toHaveAttribute('data-category', /electronics/i);
    }
  });

  test('Test D: Image matching works', async ({ page }) => {
    await expect(page.getByTestId('item-card').first()).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Advanced Filters' }).click();
    await page.getByTestId('image-upload').setInputFiles(MATCHING_IMAGE_PATH);
    await page.getByTestId('search-button').click();

    await expect(page.getByTestId('item-card').first()).toBeVisible();
    await expect(page.getByTestId('confidence-score').first()).toBeVisible();
    await expect(page.getByTestId('powered-by-ai')).toBeVisible();
  });

  test('Test E: Item popup works', async ({ page }) => {
    await page.getByTestId('item-card').first().click();

    await expect(page.getByRole('button', { name: 'Claim Item' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Message Owner' })).toBeVisible();
  });
});
