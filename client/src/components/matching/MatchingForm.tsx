'use client';

import { FormEvent, useMemo, useState } from 'react';
import AdvancedFilters from './AdvancedFilters';

export type MatchSearchFilters = {
  title: string;
  category: string;
  location: string;
  fromDate: string;
  toDate: string;
};

type MatchingFormProps = {
  categories: string[];
  imagePreviewUrl: string | null;
  onImageSelect: (file: File | null) => void;
  initialFilters?: Partial<MatchSearchFilters>;
  onSearch: (filters: MatchSearchFilters) => void;
};

export default function MatchingForm({
  categories,
  imagePreviewUrl,
  onImageSelect,
  initialFilters,
  onSearch,
}: MatchingFormProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [title, setTitle] = useState(initialFilters?.title ?? '');
  const [category, setCategory] = useState(initialFilters?.category || 'All');
  const [location, setLocation] = useState(initialFilters?.location ?? '');
  const [fromDate, setFromDate] = useState(initialFilters?.fromDate ?? '');
  const [toDate, setToDate] = useState(initialFilters?.toDate ?? '');

  const normalizedCategories = useMemo(() => ['All', ...categories], [categories]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch({
      title,
      category,
      location,
      fromDate,
      toDate,
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-white/90">Item Title</label>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g., Black Wallet"
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-blue-400"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-white/90">Category</label>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-400"
        >
          {normalizedCategories.map((entry) => (
            <option key={entry} value={entry} className="text-black">
              {entry}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-white/90">Location</label>
        <input
          type="text"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="e.g., Engineering Building"
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-blue-400"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-white/90">Date Range (Optional)</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-400"
          />
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-400"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
      >
        Search
      </button>

      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onToggle={() => setShowAdvancedFilters((prev) => !prev)}
        imagePreviewUrl={imagePreviewUrl}
        onImageSelect={onImageSelect}
      />
    </form>
  );
}
