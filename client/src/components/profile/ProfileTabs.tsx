'use client';

type ProfileTab = 'info' | 'listings';

type ProfileTabsProps = {
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
};

export default function ProfileTabs({ activeTab, onChange }: ProfileTabsProps) {
  return (
    <div className="mb-6 inline-flex rounded-xl border border-white/15 bg-white/5 p-1">
      <button
        type="button"
        onClick={() => onChange('info')}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
          activeTab === 'info'
            ? 'bg-[#0A66C2] text-white shadow-md shadow-blue-900/35'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        }`}
      >
        My Info
      </button>
      <button
        type="button"
        onClick={() => onChange('listings')}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
          activeTab === 'listings'
            ? 'bg-[#0A66C2] text-white shadow-md shadow-blue-900/35'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        }`}
      >
        My Listings
      </button>
    </div>
  );
}
