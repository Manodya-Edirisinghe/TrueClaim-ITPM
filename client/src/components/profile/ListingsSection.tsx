'use client';

import MyListingsSection from './MyListingsSection';

type ListingsSectionProps = {
  compact?: boolean;
};

export default function ListingsSection({ compact = false }: ListingsSectionProps) {
  return <MyListingsSection compact={compact} />;
}
