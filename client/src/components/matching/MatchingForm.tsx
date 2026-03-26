'use client';

import { FormEvent, useMemo, useState } from 'react';
import AdvancedFilters from './AdvancedFilters';

export type MatchSearchFilters = {
  title: string;
  keywords: string;
  category: string;
  location: string;
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
  const [keywords, setKeywords] = useState(initialFilters?.keywords ?? '');
  const [category, setCategory] = useState(initialFilters?.category || 'All');
  const [location, setLocation] = useState(initialFilters?.location ?? '');
  const [titleError, setTitleError] = useState('');

  const normalizedCategories = useMemo(() => ['All', ...categories], [categories]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      setTitleError('Item title is required.');
      return;
    }
    setTitleError('');
    onSearch({ title, keywords, category, location });
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      {/* Main filters — horizontal row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/70">
            Item Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError('');
            }}
            placeholder="e.g., Black Wallet"
            className={`w-full rounded-lg border bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-blue-400 ${
              titleError ? 'border-red-500' : 'border-white/15'
            }`}
          />
          {titleError && (
            <p className="mt-1 text-xs text-red-400">{titleError}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/70">Keywords</label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g., black leather library"
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-blue-400"
          />
          <p className="mt-1 text-[10px] text-white/40">Matches across title, description, category & location</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/70">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-400"
          >
            {normalizedCategories.map((entry) => (
              <option key={entry} value={entry} className="text-black">
                {entry}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-rows-[auto_1fr] gap-1.5">
          <label className="block text-xs font-medium text-white/70">Location</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Library"
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-blue-400"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Advanced / AI section */}
      <div className="mt-4">
        <AdvancedFilters
          isOpen={showAdvancedFilters}
          onToggle={() => setShowAdvancedFilters((prev) => !prev)}
          imagePreviewUrl={imagePreviewUrl}
          onImageSelect={onImageSelect}
        />
      </div>
    </form>
  );
}
