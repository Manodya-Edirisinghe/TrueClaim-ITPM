'use client';

import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { ChevronDown, Upload, Sparkles } from 'lucide-react';

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
    <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-r from-cyan-500/[0.07] to-blue-500/[0.07] p-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-white transition hover:bg-white/5"
      >
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span>Advanced Filtering</span>
          <span className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
            AI Powered
          </span>
        </div>
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
            <p className="text-sm text-white/80">
              Upload a reference image to match items visually using AI.
            </p>

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
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : 'border-white/20 bg-white/5 hover:border-cyan-400/70 hover:bg-white/10'
              }`}
            >
              <Upload className="h-5 w-5 text-cyan-300" />
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
              <div className="overflow-hidden rounded-lg border border-cyan-400/30 bg-black/40">
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
