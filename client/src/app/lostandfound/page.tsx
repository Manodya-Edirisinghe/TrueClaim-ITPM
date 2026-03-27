'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { FormInput, FormSelect, FormTextarea } from '@/components/form';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { getCurrentUserId } from '@/lib/auth';

const MY_LISTING_IDS_KEY = 'trueclaim_my_listing_ids';

function rememberListingId(id: string): void {
  if (typeof window === 'undefined') return;

  try {
    const raw = window.localStorage.getItem(MY_LISTING_IDS_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    if (!ids.includes(id)) {
      window.localStorage.setItem(MY_LISTING_IDS_KEY, JSON.stringify([id, ...ids]));
    }
  } catch {
    // Ignore localStorage failures.
  }
}

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

type ValidatedField =
  | 'itemTitle'
  | 'itemCategory'
  | 'description'
  | 'time'
  | 'location'
  | 'contactNumber';

type FieldErrors = Partial<Record<ValidatedField, string>>;

function formatDateOnly(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function validateItemForm(data: FormData): FieldErrors {
  const errors: FieldErrors = {};

  if (!data.itemTitle.trim()) {
    errors.itemTitle = 'Item title is required.';
  }
  if (!data.itemCategory) {
    errors.itemCategory = 'Please select an item category.';
  }
  if (!data.description.trim()) {
    errors.description = 'Description is required.';
  }
  if (!data.time) {
    errors.time = 'Date and time are required.';
  } else {
    const selected = new Date(data.time);
    if (Number.isNaN(selected.getTime())) {
      errors.time = 'Please enter a valid date and time.';
    } else if (selected.getTime() > Date.now()) {
      errors.time = 'Date and time cannot be in the future.';
    }
  }
  if (!data.location.trim()) {
    errors.location = 'Location is required.';
  }

  const phone = data.contactNumber.trim();
  if (!phone) {
    errors.contactNumber = 'Contact number is required.';
  } else if (!/^\d{10}$/.test(phone)) {
    errors.contactNumber =
      'Contact number must be exactly 10 digits.';
  }

  return errors;
}

const fieldErrorInputClass =
  'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500';

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="text-sm text-red-600" role="alert">
      {message}
    </p>
  );
}

function ItemForm({
  type,
  title,
  onSubmit,
}: {
  type: 'lost' | 'found';
  title: string;
  onSubmit: (data: FormData) => Promise<void>;
}) {
  const [data, setData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateMax = formatDateOnly(new Date());

  const clearFieldError = (field: ValidatedField) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'contactNumber') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setData((prev) => ({ ...prev, contactNumber: digits }));
      clearFieldError('contactNumber');
      return;
    }
    setData((prev) => ({ ...prev, [name]: value }));
    if (name in initialFormData && name !== 'image') {
      clearFieldError(name as ValidatedField);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setData((prev) => ({ ...prev, image: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validateItemForm(data);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      toast.success(
        type === 'lost'
          ? 'Your lost item report was submitted successfully.'
          : 'Your found item report was submitted successfully.'
      );
      setData(initialFormData);
    } catch {
      toast.error('Failed to submit item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formId = `${type}-item-form`;

  const errId = (field: ValidatedField) => `${formId}-${field}-error`;

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold text-[hsl(var(--foreground))]">
        {title}
      </h2>
      <form
        id={formId}
        onSubmit={handleSubmit}
        noValidate
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
            aria-invalid={!!errors.itemTitle}
            aria-describedby={errors.itemTitle ? errId('itemTitle') : undefined}
            className={cn(errors.itemTitle && fieldErrorInputClass)}
          />
          {errors.itemTitle && (
            <FieldError id={errId('itemTitle')} message={errors.itemTitle} />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-category`}>Item category</Label>
          <FormSelect
            id={`${formId}-category`}
            name="itemCategory"
            value={data.itemCategory}
            onChange={handleChange}
            aria-invalid={!!errors.itemCategory}
            aria-describedby={
              errors.itemCategory ? errId('itemCategory') : undefined
            }
            className={cn(errors.itemCategory && fieldErrorInputClass)}
          >
            <option value="">Select category</option>
            {ITEM_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </FormSelect>
          {errors.itemCategory && (
            <FieldError
              id={errId('itemCategory')}
              message={errors.itemCategory}
            />
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${formId}-description`}>Description</Label>
          <FormTextarea
            id={`${formId}-description`}
            name="description"
            value={data.description}
            onChange={handleChange}
            placeholder="Describe the item (color, brand, distinguishing features...)"
            rows={3}
            aria-invalid={!!errors.description}
            aria-describedby={
              errors.description ? errId('description') : undefined
            }
            className={cn(errors.description && fieldErrorInputClass)}
          />
          {errors.description && (
            <FieldError
              id={errId('description')}
              message={errors.description}
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-time`}>Date</Label>
          <FormInput
            id={`${formId}-time`}
            name="time"
            type="date"
            value={data.time}
            onChange={handleChange}
            max={dateMax}
            aria-invalid={!!errors.time}
            aria-describedby={errors.time ? errId('time') : undefined}
            className={cn(errors.time && fieldErrorInputClass)}
          />
          {errors.time && (
            <FieldError id={errId('time')} message={errors.time} />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-location`}>Location</Label>
          <FormInput
            id={`${formId}-location`}
            name="location"
            value={data.location}
            onChange={handleChange}
            placeholder="Where was it lost/found?"
            aria-invalid={!!errors.location}
            aria-describedby={errors.location ? errId('location') : undefined}
            className={cn(errors.location && fieldErrorInputClass)}
          />
          {errors.location && (
            <FieldError id={errId('location')} message={errors.location} />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-contact`}>Contact number</Label>
          <FormInput
            id={`${formId}-contact`}
            name="contactNumber"
            type="tel"
            inputMode="numeric"
            pattern="\d*"
            autoComplete="tel"
            value={data.contactNumber}
            onChange={handleChange}
            placeholder="e.g. 0771234567"
            maxLength={10}
            aria-invalid={!!errors.contactNumber}
            aria-describedby={
              errors.contactNumber ? errId('contactNumber') : undefined
            }
            className={cn(errors.contactNumber && fieldErrorInputClass)}
          />
          {errors.contactNumber && (
            <FieldError
              id={errId('contactNumber')}
              message={errors.contactNumber}
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-image`}>Image (optional)</Label>
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
            disabled={isSubmitting}
            className="w-full bg-[#0A66C2] hover:bg-[#0958a8] text-white sm:w-auto"
          >
            {isSubmitting
              ? 'Submitting...'
              : `Submit ${type === 'lost' ? 'Lost' : 'Found'} Item`}
          </Button>
        </div>
      </form>
    </div>
  );
}

function LostAndFoundPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost');

  // Ensure a user ID exists in localStorage before any item is created.
  // The axios interceptor will attach it as x-user-id on the POST request.
  useEffect(() => {
    getCurrentUserId();
  }, []);

  useEffect(() => {
    if (tabParam === 'found') setActiveTab('found');
    else setActiveTab('lost');
  }, [tabParam]);

  const submitItem = async (itemType: 'lost' | 'found', data: FormData) => {
    const payload = new window.FormData();
    payload.append('itemType', itemType);
    payload.append('itemTitle', data.itemTitle);
    payload.append('itemCategory', data.itemCategory);
    payload.append('description', data.description);
    payload.append('time', data.time);
    payload.append('location', data.location);
    payload.append('contactNumber', data.contactNumber);
    if (data.image) {
      payload.append('image', data.image);
    }

    const response = await api.post('/items', payload);

    const createdId = response.data?.item?._id;
    if (createdId) rememberListingId(createdId);

    router.push('/my-listings');
  };

  const handleLostSubmit = async (data: FormData) => {
    await submitItem('lost', data);
  };

  const handleFoundSubmit = async (data: FormData) => {
    await submitItem('found', data);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-24 py-6">
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

export default function LostAndFoundPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-6 text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <LostAndFoundPageContent />
    </Suspense>
  );
}
