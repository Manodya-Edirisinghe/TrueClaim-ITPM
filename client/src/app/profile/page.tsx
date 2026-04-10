'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProfileTabs from '@/components/profile/ProfileTabs';
import UserInfoSection from '@/components/profile/UserInfoSection';
import ListingsSection from '@/components/profile/ListingsSection';

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'info' | 'listings'>('info');

  useEffect(() => {
    setActiveTab(searchParams.get('tab') === 'listings' ? 'listings' : 'info');
  }, [searchParams]);

  return (
    <main className="mx-auto max-w-6xl px-4 pt-24 py-6">
      <h1 className="text-3xl font-semibold text-white">Profile</h1>
      <p className="mt-1 text-sm text-white/65">Manage your account details and item listings.</p>

      <div className="mt-5">
        <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'info' ? <UserInfoSection /> : null}
        {activeTab === 'listings' ? <ListingsSection compact /> : null}
      </div>
    </main>
  );
}
