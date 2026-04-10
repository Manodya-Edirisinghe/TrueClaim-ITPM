'use client';

import { ChevronDown } from 'lucide-react';

export type MatchingFilters = {
  keyword: string;
  category: string;
  location: string;
};

type MatchingFormProps = {
  filters: MatchingFilters;
  categories: string[];
  isSearching: boolean;
  showAdvanced: boolean;
  isImageSelected: boolean;
  imagePreviewUrl: string | null;
  onFiltersChange: (next: MatchingFilters) => void;
  onSearch: () => void;
  onClear: () => void;
  onToggleAdvanced: () => void;
  onImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
};

export default function MatchingForm({
  filters,
  categories,
  isSearching,
  showAdvanced,
  isImageSelected,
  imagePreviewUrl,
  onFiltersChange,
  onSearch,
  onClear,
  onToggleAdvanced,
  onImageSelect,
  onClearImage,
}: MatchingFormProps) {
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch();
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.18] via-white/[0.08] to-white/[0.03] p-4 shadow-[0_18px_60px_rgba(2,8,23,0.6),inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-2xl md:p-5"
    >
      <h2 className="mb-3 text-lg font-semibold text-white">Search Filters</h2>

      <div className="space-y-3.5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/80">Keyword</label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(event) => onFiltersChange({ ...filters, keyword: event.target.value })}
              placeholder="e.g., laptop bag"
              className="w-full rounded-lg border border-white/20 bg-black/35 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/80">Category</label>
            <select
              value={filters.category}
              onChange={(event) => onFiltersChange({ ...filters, category: event.target.value })}
              className="w-full rounded-lg border border-white/20 bg-black/35 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-400"
            >
              {categories.map((category) => (
                <option key={category} value={category} className="text-black">
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/80">Location</label>
            <input
              type="text"
              value={filters.location}
              onChange={(event) => onFiltersChange({ ...filters, location: event.target.value })}
              placeholder="e.g., main library"
              className="w-full rounded-lg border border-white/20 bg-black/35 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-blue-400"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:w-[240px]">
            <button
              type="submit"
              disabled={isSearching}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-white/15 bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
          <button
            type="button"
            onClick={onToggleAdvanced}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-semibold text-white">Advanced Filters</span>
            <ChevronDown
              className={`h-4 w-4 text-white/70 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            />
          </button>

          <div
            className={`overflow-hidden border-t border-white/10 transition-all duration-300 ${
              showAdvanced ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="space-y-3 px-4 py-3.5">
              <label className="block text-sm font-medium text-white/80">Upload Image</label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={onImageSelect}
                className="block w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm text-white/80 file:mr-3 file:rounded-md file:border-0 file:bg-blue-500/20 file:px-3 file:py-1 file:text-sm file:font-medium file:text-blue-200"
              />

              {imagePreviewUrl ? (
                <div className="space-y-2">
                  <img
                    src={imagePreviewUrl}
                    alt="Uploaded reference"
                    className="h-36 w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={onClearImage}
                    className="inline-flex rounded-md border border-red-300/40 bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-100 transition hover:bg-red-500/25"
                  >
                    Remove image
                  </button>
                </div>
              ) : null}

              {isImageSelected ? (
                <p className="text-xs text-cyan-200/80">Image selected for AI-assisted search.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
