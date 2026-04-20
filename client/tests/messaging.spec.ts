import { expect, test, type Page } from '@playwright/test';
import { getAuthSession, login, TEST_USERS } from './helpers/login';

const SEEDED_ITEM_ID = 'e2e-shared-item-thread';

async function ensureSeedConversation(page: Page): Promise<void> {
  const [{ token: senderToken, userId: senderId }, receiver] = await Promise.all([
    getAuthSession(page, TEST_USERS.manod),
    getAuthSession(page, TEST_USERS.osanda),
  ]);

  if (senderId === receiver.userId) {
    throw new Error('Seed users must be distinct for messaging tests.');
  }

  const response = await page.request.post('/server-api/messages/send', {
    headers: {
      Authorization: `Bearer ${senderToken}`,
    },
    data: {
      itemId: SEEDED_ITEM_ID,
      receiverId: receiver.userId,
      text: `Seed message ${Date.now()}`,
    },
  });

  if (response.status() !== 201) {
    const bodyText = await response.text();
    throw new Error(`Failed to seed conversation (${response.status()}): ${bodyText}`);
  }
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function openSharedConversation(userOnePage: Page, userTwoPage: Page): Promise<void> {
  const firstConversation = userOnePage.getByTestId('conversation-item').first();
  await expect(firstConversation).toBeVisible();

  const firstConversationText = (await firstConversation.innerText()).trim();
  const itemPartRaw = firstConversationText.split('|')[1] ?? '';
  const itemTitle = itemPartRaw.split('\n')[0]?.trim();

  await firstConversation.click();

  if (!itemTitle) {
    throw new Error('Could not extract item title from the first conversation.');
  }

  const userTwoTarget = userTwoPage
    .getByTestId('conversation-item')
    .filter({ hasText: new RegExp(escapeRegex(itemTitle), 'i') })
    .first();

  await expect(userTwoTarget).toBeVisible({ timeout: 15000 });
  await userTwoTarget.click();

  await expect(userOnePage.getByTestId('message-input')).toBeEnabled();
  await expect(userTwoPage.getByTestId('message-input')).toBeEnabled();
}

test.describe('Messaging', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.manod);
    await ensureSeedConversation(page);
    await page.goto('/messages');
    await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
  });

  test('Test A: Messages page loads', async ({ page }) => {
    const conversationItems = page.getByTestId('conversation-item');
    await expect(conversationItems.first()).toBeVisible();

    const firstText = await conversationItems.first().innerText();
    expect(firstText).toContain('|');
  });

  test('Test B: Send message', async ({ page }) => {
    await page.getByTestId('conversation-item').first().click();

    const messageText = `Hello, is this item still available? ${Date.now()}`;
    await page.getByTestId('message-input').fill(messageText);
    await page.getByTestId('send-button').click();

    await expect(
      page.locator('[data-testid="chat-message-text"]', {
        hasText: messageText,
      }).last()
    ).toBeVisible();
  });

  test('Test C: Real-time messaging between two users', async ({ browser }) => {
    const userOneContext = await browser.newContext();
    const userTwoContext = await browser.newContext();

    const userOnePage = await userOneContext.newPage();
    const userTwoPage = await userTwoContext.newPage();

    await login(userOnePage, TEST_USERS.manod);
    await login(userTwoPage, TEST_USERS.osanda);

    await userOnePage.goto('/messages');
    await userTwoPage.goto('/messages');

    await openSharedConversation(userOnePage, userTwoPage);

    const liveMessage = `Realtime check ${Date.now()}`;
    await userOnePage.getByTestId('message-input').fill(liveMessage);
    await userOnePage.getByTestId('send-button').click();

    await expect(userTwoPage.getByText(liveMessage)).toBeVisible({ timeout: 15000 });

    await userOneContext.close();
    await userTwoContext.close();
  });

  test('Test D: Typing indicator', async ({ browser }) => {
    const userOneContext = await browser.newContext();
    const userTwoContext = await browser.newContext();

    const userOnePage = await userOneContext.newPage();
    const userTwoPage = await userTwoContext.newPage();

    await login(userOnePage, TEST_USERS.manod);
    await login(userTwoPage, TEST_USERS.osanda);

    await userOnePage.goto('/messages');
    await userTwoPage.goto('/messages');

    await openSharedConversation(userOnePage, userTwoPage);

    await userOnePage.getByTestId('message-input').click();
    await userOnePage.getByTestId('message-input').type('Typing indicator check', { delay: 80 });

    await expect(userTwoPage.getByTestId('typing-indicator')).toBeVisible({ timeout: 10000 });

    await userOneContext.close();
    await userTwoContext.close();
  });

  test('Test E: Unsend message', async ({ page }) => {
    await page.getByTestId('conversation-item').first().click();

    const messageText = `Unsend check ${Date.now()}`;
    await page.getByTestId('message-input').fill(messageText);
    await page.getByTestId('send-button').click();

    await expect(
      page.locator('[data-testid="chat-message-text"]', {
        hasText: messageText,
      }).last()
    ).toBeVisible();

    await page.getByRole('button', { name: 'Message options' }).last().click();
    await page.getByTestId('unsend-button').click();

    await expect(
      page.locator('[data-testid="chat-message-text"]', {
        hasText: 'This message was deleted',
      }).last()
    ).toBeVisible();
  });
});
