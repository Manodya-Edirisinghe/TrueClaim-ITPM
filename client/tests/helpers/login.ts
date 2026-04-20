import { expect, type Page } from '@playwright/test';

export type LoginCredentials = {
  email: string;
  password: string;
};

export const TEST_USERS = {
  manod: {
    email: 'manod@uni.com',
    password: 'abd',
  },
  osanda: {
    email: 'osanda@uni.com',
    password: 'abe',
  },
} as const;

const TEST_USER_PROFILES: Record<
  string,
  {
    fullName: string;
    studentId: string;
    phoneNumber: string;
    faculty: string;
    academicYear: string;
  }
> = {
  'manod@uni.com': {
    fullName: 'Manod QA',
    studentId: 'IT20261001',
    phoneNumber: '0771234567',
    faculty: 'Computing',
    academicYear: '3rd Year',
  },
  'osanda@uni.com': {
    fullName: 'Osanda QA',
    studentId: 'IT20261002',
    phoneNumber: '0771234568',
    faculty: 'Computing',
    academicYear: '3rd Year',
  },
};

type LoginApiResponse = {
  token?: string;
  user?: {
    _id?: string;
  };
};

export type AuthSession = {
  token: string;
  userId: string;
};

async function loginViaApi(page: Page, credentials: LoginCredentials): Promise<LoginApiResponse | null> {
  const response = await page.request.post('/server-api/auth/login', {
    data: {
      universityEmail: credentials.email,
      password: credentials.password,
    },
  });

  if (response.status() === 200) {
    return (await response.json()) as LoginApiResponse;
  }

  if (response.status() === 400) {
    return null;
  }

  const bodyText = await response.text();
  throw new Error(`Login API failed with status ${response.status()}: ${bodyText}`);
}

async function registerTestUserIfNeeded(page: Page, credentials: LoginCredentials): Promise<void> {
  const profile = TEST_USER_PROFILES[credentials.email];
  if (!profile) {
    throw new Error(`No registration profile configured for ${credentials.email}`);
  }

  const response = await page.request.post('/server-api/auth/register', {
    data: {
      ...profile,
      universityEmail: credentials.email,
      password: credentials.password,
    },
  });

  if (response.status() === 201 || response.status() === 400) {
    return;
  }

  const bodyText = await response.text();
  throw new Error(`Register API failed with status ${response.status()}: ${bodyText}`);
}

export async function getAuthSession(
  page: Page,
  credentials: LoginCredentials
): Promise<AuthSession> {
  let loginResult = await loginViaApi(page, credentials);

  if (!loginResult?.token || !loginResult.user?._id) {
    await registerTestUserIfNeeded(page, credentials);
    loginResult = await loginViaApi(page, credentials);
  }

  if (!loginResult?.token || !loginResult.user?._id) {
    throw new Error(`Could not authenticate test user ${credentials.email}`);
  }

  return {
    token: loginResult.token,
    userId: loginResult.user._id,
  };
}

export async function login(
  page: Page,
  emailOrCredentials: string | LoginCredentials,
  passwordArg?: string
): Promise<void> {
  const credentials: LoginCredentials =
    typeof emailOrCredentials === 'string'
      ? {
          email: emailOrCredentials,
          password: passwordArg ?? '',
        }
      : emailOrCredentials;

  // Ensure the test user exists before the UI login flow.
  await getAuthSession(page, credentials);

  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();

  await page.waitForURL(/\/(landing|verification|matching|messages)/, { timeout: 20000 });

  await expect
    .poll(
      async () => page.evaluate(() => window.localStorage.getItem('token')),
      { timeout: 10000 }
    )
    .not.toBeNull();
}
