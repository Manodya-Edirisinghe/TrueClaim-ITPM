'use client';

import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { ChevronDown, Upload } from 'lucide-react';

type AdvancedFiltersProps = {
  isOpen: boolean;
  onToggle: () => void;
  imagePreviewUrl: string | null;
  onImageSelect: (file: File | null) => void;
};

export default function AdvancedFilters({
  isOpen,
  onToggle,
  imagePreviewUrl,
  onImageSelect,
}: AdvancedFiltersProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onImageSelect(file);
  };

  const onDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    onImageSelect(file);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-left text-sm font-medium text-white transition hover:bg-white/10"
      >
        <span>Advanced Filters</span>
        <ChevronDown
          className={`h-4 w-4 text-white/70 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'mt-4 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/90">Upload reference image for AI-based matching</p>
              <span className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-2 py-1 text-xs font-semibold text-cyan-300">
                Powered by AI
              </span>
            </div>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition ${
                isDragging
                  ? 'border-blue-400 bg-blue-500/10'
                  : 'border-white/20 bg-white/5 hover:border-blue-400/70 hover:bg-white/10'
              }`}
            >
              <Upload className="h-5 w-5 text-white/80" />
              <p className="text-sm text-white/90">Drop an image here or click to browse</p>
              <p className="text-xs text-white/55">PNG, JPG, JPEG</p>
            </button>

            <input
              ref={inputRef}
              type="file"
              accept="image/png, image/jpg, image/jpeg"
              className="hidden"
              onChange={onFileChange}
            />

            {imagePreviewUrl ? (
              <div className="overflow-hidden rounded-lg border border-white/15 bg-black/40">
                <img
                  src={imagePreviewUrl}
                  alt="Reference preview"
                  className="h-44 w-full object-cover"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
