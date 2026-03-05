'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { FormInput, FormSelect, FormTextarea } from '@/components/form';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ITEM_CATEGORIES = [
  'Wallet / Purse',
  'Keys',
  'Phone',
  'Bag / Backpack',
  'Documents',
  'Jewelry',
  'Electronics',
  'Clothing',
  'Other',
];

type FormData = {
  itemTitle: string;
  itemCategory: string;
  description: string;
  time: string;
  location: string;
  contactNumber: string;
  image: File | null;
};

const initialFormData: FormData = {
  itemTitle: '',
  itemCategory: '',
  description: '',
  time: '',
  location: '',
  contactNumber: '',
  image: null,
};

function ItemForm({
  type,
  title,
  onSubmit,
}: {
  type: 'lost' | 'found';
  title: string;
  onSubmit: (data: FormData) => void;
}) {
  const [data, setData] = useState<FormData>(initialFormData);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setData((prev) => ({ ...prev, image: file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  const formId = `${type}-item-form`;

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold text-[hsl(var(--foreground))]">
        {title}
      </h2>
      <form
        id={formId}
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5"
      >
        <div className="space-y-2">
          <Label htmlFor={`${formId}-title`}>Item title</Label>
          <FormInput
            id={`${formId}-title`}
            name="itemTitle"
            value={data.itemTitle}
            onChange={handleChange}
            placeholder="e.g. Black leather wallet"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-category`}>Item category</Label>
          <FormSelect
            id={`${formId}-category`}
            name="itemCategory"
            value={data.itemCategory}
            onChange={handleChange}
            required
          >
            <option value="">Select category</option>
            {ITEM_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </FormSelect>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${formId}-description`}>Description</Label>
          <FormTextarea
            id={`${formId}-description`}
            name="description"
            value={data.description}
            onChange={handleChange}
            placeholder="Describe the item (color, brand, distinguishing features...)"
            required
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-time`}>Date & time</Label>
          <FormInput
            id={`${formId}-time`}
            name="time"
            type="datetime-local"
            value={data.time}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-location`}>Location</Label>
          <FormInput
            id={`${formId}-location`}
            name="location"
            value={data.location}
            onChange={handleChange}
            placeholder="Where was it lost/found?"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-contact`}>Contact number</Label>
          <FormInput
            id={`${formId}-contact`}
            name="contactNumber"
            type="tel"
            value={data.contactNumber}
            onChange={handleChange}
            placeholder="e.g. +94 77 123 4567"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-image`}>Image</Label>
          <FormInput
            id={`${formId}-image`}
            name="image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        <div className="pt-1 sm:col-span-2">
          <Button
            type="submit"
            className="w-full bg-[#0A66C2] hover:bg-[#0958a8] text-white sm:w-auto"
          >
            Submit {type === 'lost' ? 'Lost' : 'Found'} Item
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function LostAndFoundPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost');

  useEffect(() => {
    if (tabParam === 'found') setActiveTab('found');
    else setActiveTab('lost');
  }, [tabParam]);

  const handleLostSubmit = (data: FormData) => {
    console.log('Lost item submitted:', data);
    // TODO: send to API
  };

  const handleFoundSubmit = (data: FormData) => {
    console.log('Found item submitted:', data);
    // TODO: send to API
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/landing"
        className="inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))] hover:text-[#0A66C2] transition-colors mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
      <div className="flex border-b border-[hsl(var(--border))] mb-6">
        <button
          type="button"
          className={cn(
            'px-4 py-2.5 text-sm font-medium transition-colors',
            activeTab === 'lost'
              ? 'border-b-2 border-[#0A66C2] text-[#0A66C2]'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('lost')}
        >
          Lost Item
        </button>
        <button
          type="button"
          className={cn(
            'px-4 py-2.5 text-sm font-medium transition-colors',
            activeTab === 'found'
              ? 'border-b-2 border-[#0A66C2] text-[#0A66C2]'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('found')}
        >
          Found Item
        </button>
      </div>

      <div>
        {activeTab === 'lost' && (
          <ItemForm
            type="lost"
            title="Lost Item Form"
            onSubmit={handleLostSubmit}
          />
        )}
        {activeTab === 'found' && (
          <ItemForm
            type="found"
            title="Found Item Form"
            onSubmit={handleFoundSubmit}
          />
        )}
      </div>
    </div>
  );
}