'use client';

import { useEffect } from 'react';
import { restoreUserSession } from '@/lib/auth';

export default function SessionBootstrap() {
  useEffect(() => {
    void restoreUserSession();
  }, []);

  return null;
}
