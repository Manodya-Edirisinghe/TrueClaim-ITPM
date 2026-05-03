import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import { login, TEST_USERS } from './helpers/login';

test.describe.configure({ timeout: 180000 });

const SCREENSHOT_DIR = 'test-results/screenshots/hashini-qa';
const IMAGE_PATH = path.resolve(__dirname, 'images', 'Toyota car key.jpeg');
let titleCounter = 0;

function uniqueTitle(prefix: string): string {
  titleCounter += 1;
  return `${prefix} ${Date.now()}-${titleCounter}`;
}

async function runWithVisualSession(run: (page: import('@playwright/test').Page) => Promise<void>) {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await login(page, TEST_USERS.manod);
    await run(page);
  } finally {
    await context.close();
    await browser.close();
  }
}

async function openLostAndFound(page: import('@playwright/test').Page) {
  await page.goto('http://localhost:3000/lostandfound');
  await expect(page).toHaveURL(/\/lostandfound/);
}

async function openLostForm(page: import('@playwright/test').Page) {
  await openLostAndFound(page);
  await page.getByRole('button', { name: 'Lost Item', exact: true }).click();
  await expect(page.getByTestId('lost-item-form')).toBeVisible();
}

async function openFoundForm(page: import('@playwright/test').Page) {
  await openLostAndFound(page);
  await page.getByRole('button', { name: 'Found Item', exact: true }).click();
  await expect(page.getByTestId('found-item-form')).toBeVisible();
}

async function fillItemForm(
  page: import('@playwright/test').Page,
  item: {
    title: string;
    category: string;
    description: string;
    date: string;
    location: string;
    contactNumber: string;
    imagePath?: string;
    type: 'lost' | 'found';
  }
) {
  const form = page.getByTestId(`${item.type}-item-form`);
  await form.locator('input[name="itemTitle"]').fill(item.title);
  await form.locator('select[name="itemCategory"]').selectOption(item.category);
  await form.locator('textarea[name="description"]').fill(item.description);
  await form.locator('input[name="time"]').fill(item.date);
  await form.locator('input[name="location"]').fill(item.location);
  await form.locator('input[name="contactNumber"]').fill(item.contactNumber);
  if (item.imagePath) {
    await form.locator('input[name="image"]').setInputFiles(item.imagePath);
  }
}

async function submitAndOpenListings(page: import('@playwright/test').Page) {
  const createItemResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && response.url().includes('/items'),
    { timeout: 30000 }
  );

  await page.getByTestId('submit-item-button').click();

  const createItemResponse = await createItemResponsePromise;
  expect(createItemResponse.ok()).toBeTruthy();

  const createBody = (await createItemResponse.json()) as { item?: { _id?: string } };
  const createdId = createBody.item?._id;

  if (createdId) {
    await page.evaluate((id) => {
      const key = 'trueclaim_my_listing_ids';
      try {
        const raw = window.localStorage.getItem(key);
        const existing = raw ? (JSON.parse(raw) as string[]) : [];
        if (!existing.includes(id)) {
          window.localStorage.setItem(key, JSON.stringify([id, ...existing]));
        }
      } catch {
        // Ignore localStorage failures in test helper.
      }
    }, createdId);
  }

  await page.waitForURL(/\/profile(\?|$)/, { timeout: 15000 }).catch(() => {});

  if (!/\/profile(\?|$)/.test(page.url())) {
    await page
      .locator('text=/submitted successfully|uploaded successfully/i')
      .first()
      .waitFor({ timeout: 10000 })
      .catch(() => {});
  }

  if (!/\/profile(\?|$)/.test(page.url())) {
    await page.goto('http://localhost:3000/profile?tab=listings');
  }

  await expect(page).toHaveURL(/\/profile/);
  const listingsTab = page.getByRole('button', { name: 'Your Listings', exact: true });
  if (await listingsTab.isVisible()) {
    await listingsTab.click();
  }
}

function listingCardByTitle(page: import('@playwright/test').Page, itemTitle: string) {
  return page
    .getByTestId('listing-card')
    .filter({ has: page.getByRole('heading', { name: itemTitle, exact: true }) })
    .first();
}

async function deleteItemByTitleAndVerifyGone(
  page: import('@playwright/test').Page,
  itemTitle: string
) {
  const deleteResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'DELETE' && response.url().includes('/items/'),
    { timeout: 30000 }
  );

  await listingCardByTitle(page, itemTitle).getByTestId('delete-button').click();

  const deleteResponse = await deleteResponsePromise;
  expect(deleteResponse.ok()).toBeTruthy();

  const targetCards = page
    .getByTestId('listing-card')
    .filter({ has: page.getByRole('heading', { name: itemTitle, exact: true }) });

  await expect(targetCards)
    .toHaveCount(0, { timeout: 15000 })
    .catch(async () => {
      await page.reload();
      await expect(targetCards).toHaveCount(0, { timeout: 15000 });
    });
}

async function createLostItemAndOpenListings(
  page: import('@playwright/test').Page,
  itemTitle: string,
  location = 'Main Building'
) {
  await openLostForm(page);
  await fillItemForm(page, {
    type: 'lost',
    title: itemTitle,
    category: 'Keys',
    description: 'Lost Toyota key with black keychain',
    date: '2026-04-20',
    location,
    contactNumber: '0771234567',
    imagePath: IMAGE_PATH,
  });
  await submitAndOpenListings(page);
  const card = listingCardByTitle(page, itemTitle);
  await expect(card).toBeVisible({ timeout: 30000 });
  return card;
}

test('0. Full journey preserved: create, verify, update, delete', async () => {
  await runWithVisualSession(async (page) => {
    const itemTitle = uniqueTitle('Toyota Car Key Full Journey');
    const updatedLocation = 'Library Entrance';

    const listingCard = await createLostItemAndOpenListings(page, itemTitle);

    await expect(listingCard.locator('img')).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/full-journey-created.png`,
      fullPage: true,
    });

    await expect(listingCard.getByTestId('update-button')).toBeVisible();
    await expect(listingCard.getByTestId('delete-button')).toBeVisible();

    await listingCard.getByTestId('update-button').click();
    const locationInput = page.getByTestId('location-input');
    await expect(locationInput).toBeVisible();
    await locationInput.fill(updatedLocation);
    await page.getByRole('button', { name: /Save changes/i }).click();

    await expect(listingCardByTitle(page, itemTitle)).toContainText(updatedLocation);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/full-journey-updated.png`,
      fullPage: true,
    });

    await deleteItemByTitleAndVerifyGone(page, itemTitle);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/full-journey-deleted.png`,
      fullPage: true,
    });
  });
});

test('1. Lost form loads correctly', async () => {
  await runWithVisualSession(async (page) => {
    await openLostAndFound(page);

    await expect(page.getByRole('button', { name: 'Lost Item', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Found Item', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Lost Item', exact: true }).click();
    const form = page.getByTestId('lost-item-form');
    await expect(form).toBeVisible();

    await expect(form.getByLabel('Item title')).toBeVisible();
    await expect(form.getByLabel('Item category')).toBeVisible();
    await expect(form.getByLabel('Description')).toBeVisible();
    await expect(form.getByLabel('Date')).toBeVisible();
    await expect(form.getByLabel('Location')).toBeVisible();
    await expect(form.getByLabel('Contact number')).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-lost-form-loads.png`,
      fullPage: true,
    });
  });
});

test('2. Required field validation works', async () => {
  await runWithVisualSession(async (page) => {
    await openLostForm(page);
    await page.getByTestId('submit-item-button').click();

    await expect(page.getByText('Item title is required.')).toBeVisible();
    await expect(page.getByText('Please select an item category.')).toBeVisible();
    await expect(page.getByText('Description is required.')).toBeVisible();
    await expect(page.getByText('Date and time are required.')).toBeVisible();
    await expect(page.getByText('Location is required.')).toBeVisible();
    await expect(page.getByText('Contact number is required.')).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-required-field-validation.png`,
      fullPage: true,
    });
  });
});

test('3. Create Lost Item successfully', async () => {
  await runWithVisualSession(async (page) => {
    const itemTitle = uniqueTitle('Toyota Car Key Create');
    await openLostForm(page);

    await fillItemForm(page, {
      type: 'lost',
      title: itemTitle,
      category: 'Keys',
      description: 'Lost Toyota key with black keychain',
      date: '2026-04-20',
      location: 'Main Building',
      contactNumber: '0771234567',
      imagePath: IMAGE_PATH,
    });

    await submitAndOpenListings(page);

    await expect(listingCardByTitle(page, itemTitle)).toBeVisible({ timeout: 30000 });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-item-created.png`,
      fullPage: true,
    });
  });
});

test('4. Uploaded image appears in listing', async () => {
  await runWithVisualSession(async (page) => {
    const itemTitle = uniqueTitle('Toyota Car Key Image');
    const location = 'Main Building';
    const card = await createLostItemAndOpenListings(page, itemTitle, location);

    await expect(card.locator('img')).toBeVisible();
    await expect(card).toContainText(itemTitle);
    await expect(card).toContainText('Keys');
    await expect(card).toContainText(location);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-image-visible-in-listing.png`,
      fullPage: true,
    });
  });
});

test('5. Update existing item', async () => {
  await runWithVisualSession(async (page) => {
    const itemTitle = uniqueTitle('Toyota Car Key Update');
    const card = await createLostItemAndOpenListings(page, itemTitle, 'Main Building');

    await card.getByTestId('update-button').click();

    const locationInput = page.getByTestId('location-input');
    await expect(locationInput).toBeVisible();
    await locationInput.fill('Library Entrance');

    await page.getByRole('button', { name: /Save changes/i }).click();

    await expect(listingCardByTitle(page, itemTitle)).toContainText('Library Entrance');

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-item-updated.png`,
      fullPage: true,
    });
  });
});

test('6. Delete existing item', async () => {
  await runWithVisualSession(async (page) => {
    const itemTitle = uniqueTitle('Toyota Car Key Delete');
    const card = await createLostItemAndOpenListings(page, itemTitle);

    await deleteItemByTitleAndVerifyGone(page, itemTitle);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-item-deleted.png`,
      fullPage: true,
    });
  });
});

test('7. Filter and sorting work in My Listings', async () => {
  await runWithVisualSession(async (page) => {
    const lostOlder = uniqueTitle('Lost Sort A');
    const lostNewer = uniqueTitle('Lost Sort B');
    const foundTitle = uniqueTitle('Found Sort C');

    await createLostItemAndOpenListings(page, lostOlder, 'Main Building');
    await createLostItemAndOpenListings(page, lostNewer, 'Main Building');

    await openFoundForm(page);
    await fillItemForm(page, {
      type: 'found',
      title: foundTitle,
      category: 'Keys',
      description: 'Found Toyota key with black keychain',
      date: '2026-04-20',
      location: 'Main Building',
      contactNumber: '0771234567',
      imagePath: IMAGE_PATH,
    });
    await submitAndOpenListings(page);

    const filterSelect = page.getByTestId('listings-filter-select');
    const sortSelect = page.getByTestId('listings-sort-select');

    await filterSelect.selectOption('lost');
    await expect(listingCardByTitle(page, lostNewer)).toBeVisible({ timeout: 30000 });
    await expect(
      page
        .getByTestId('listing-card')
        .filter({ has: page.getByRole('heading', { name: foundTitle, exact: true }) })
    ).toHaveCount(0);

    await filterSelect.selectOption('found');
    await expect(listingCardByTitle(page, foundTitle)).toBeVisible();

    await filterSelect.selectOption('all');
    await sortSelect.selectOption('newest');
    const newestFirstTitle = (await page.getByTestId('listing-card').first().getByRole('heading').first().textContent())?.trim();

    await sortSelect.selectOption('oldest');
    const oldestFirstTitle = (await page.getByTestId('listing-card').first().getByRole('heading').first().textContent())?.trim();

    expect(newestFirstTitle).not.toBe(oldestFirstTitle);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-filter-and-sort.png`,
      fullPage: true,
    });
  });
});

test('8. Found Item form submission', async () => {
  await runWithVisualSession(async (page) => {
    const foundTitle = uniqueTitle('Found Item Submit');

    await openFoundForm(page);
    await fillItemForm(page, {
      type: 'found',
      title: foundTitle,
      category: 'Keys',
      description: 'Found Toyota key with black keychain',
      date: '2026-04-20',
      location: 'Main Building',
      contactNumber: '0771234567',
      imagePath: IMAGE_PATH,
    });
    await submitAndOpenListings(page);

    await page.getByTestId('listings-filter-select').selectOption('found');
    await expect(listingCardByTitle(page, foundTitle)).toBeVisible({ timeout: 30000 });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-found-item-submission.png`,
      fullPage: true,
    });
  });
});
