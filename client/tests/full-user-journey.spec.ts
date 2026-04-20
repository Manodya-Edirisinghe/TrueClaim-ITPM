import { test, expect, chromium } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';
import { getAuthSession, login } from './helpers/login';

const MANO_EMAIL = 'manod@uni.com';
const MANO_PASSWORD = 'abd';
const OSANDA_EMAIL = 'osanda@uni.com';
const OSANDA_PASSWORD = 'abe';
const TOYOTA_TITLE = 'Toyota car key e2e';

async function resolveToyotaImagePath(): Promise<string> {
  const candidates = [
    path.resolve(process.cwd(), 'tests', 'images', 'Toyota car key.jpg'),
    path.resolve(process.cwd(), 'tests', 'images', 'Toyota car key.jpeg'),
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try next candidate.
    }
  }

  throw new Error('Toyota fixture image not found. Expected tests/images/Toyota car key.jpg or .jpeg');
}

async function ensureToyotaItemExists(): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const osandaSession = await getAuthSession(page, {
    email: OSANDA_EMAIL,
    password: OSANDA_PASSWORD,
  });

  const listResponse = await page.request.get('/server-api/items');
  if (listResponse.status() !== 200) {
    const body = await listResponse.text();
    await browser.close();
    throw new Error(`Failed to load items: ${listResponse.status()} ${body}`);
  }

  const listData = (await listResponse.json()) as {
    items?: Array<{ itemTitle?: string }>;
  };

  const hasToyota = (listData.items ?? []).some((item) =>
    item.itemTitle?.toLowerCase() === TOYOTA_TITLE.toLowerCase()
  );

  if (!hasToyota) {
    const createResponse = await page.request.post('/server-api/items', {
      headers: {
        Authorization: `Bearer ${osandaSession.token}`,
      },
      data: {
        itemType: 'found',
        itemTitle: TOYOTA_TITLE,
        itemCategory: 'Keys',
        description: 'Found Toyota car key near parking area with a black keychain.',
        time: new Date().toISOString(),
        location: 'Parking Area',
        contactNumber: '0771234568',
      },
    });

    if (createResponse.status() !== 201) {
      const body = await createResponse.text();
      await browser.close();
      throw new Error(`Failed to seed Toyota item: ${createResponse.status()} ${body}`);
    }
  }

  await browser.close();
}

test('Full user journey: matching to messaging', async () => {
  test.setTimeout(180000);

  await fs.mkdir(path.resolve(process.cwd(), 'test-results', 'screenshots'), { recursive: true });
  await ensureToyotaItemExists();
  const toyotaImagePath = await resolveToyotaImagePath();

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
  });

  const manoContext = await browser.newContext();
  const osandaContext = await browser.newContext();

  const manoPage = await manoContext.newPage();
  const osandaPage = await osandaContext.newPage();

  try {
    await login(manoPage, MANO_EMAIL, MANO_PASSWORD);
    await login(osandaPage, OSANDA_EMAIL, OSANDA_PASSWORD);

    await manoPage.goto('http://localhost:3000/matching');
    await expect(manoPage.getByTestId('item-card').first()).toBeVisible({ timeout: 15000 });

    await manoPage.fill('input[type="text"]', 'Toyota car key');
    await manoPage.setInputFiles('input[type="file"]', toyotaImagePath);
    await manoPage.getByRole('button', { name: /search/i }).click();

    await expect(manoPage.getByText(/Toyota car key/i).first()).toBeVisible();
    await manoPage.screenshot({
      path: 'test-results/screenshots/matching-result.png',
    });

    await manoPage.getByText(/Toyota car key e2e/i).first().click();
    await manoPage.screenshot({
      path: 'test-results/screenshots/opened-popup.png',
    });

    await manoPage.getByRole('button', { name: /message owner/i }).click();
    await expect(manoPage.getByRole('heading', { name: 'Messages' })).toBeVisible();

    await manoPage.getByTestId('message-input').fill('Hi, I think this is my Toyota car key.');
    await manoPage.getByTestId('send-button').click();

    await expect(
      manoPage.locator('[data-testid="chat-message-text"]', {
        hasText: 'Hi, I think this is my Toyota car key.',
      }).last()
    ).toBeVisible();

    await manoPage.screenshot({
      path: 'test-results/screenshots/message-sent.png',
    });

    await osandaPage.goto('http://localhost:3000/messages');
    await expect(osandaPage.getByText(/Toyota car key e2e/i)).toBeVisible();
    await osandaPage.getByText(/Toyota car key e2e/i).first().click();

    await expect(
      osandaPage.locator('[data-testid="chat-message-text"]', {
        hasText: 'Hi, I think this is my Toyota car key.',
      }).last()
    ).toBeVisible();

    await osandaPage.screenshot({
      path: 'test-results/screenshots/second-user-received.png',
    });

    await osandaPage.getByTestId('message-input').fill('Yes, can you describe the keychain?');
    await osandaPage.getByTestId('send-button').click();

    await expect(
      manoPage.locator('[data-testid="chat-message-text"]', {
        hasText: 'Yes, can you describe the keychain?',
      }).last()
    ).toBeVisible();

    await manoPage.getByTestId('message-input').click();
    await manoPage.getByTestId('message-input').type('Typing for indicator check', { delay: 80 });

    await expect(osandaPage.getByTestId('typing-indicator')).toBeVisible();
  } finally {
    await manoContext.close();
    await osandaContext.close();
    await browser.close();
  }
});
