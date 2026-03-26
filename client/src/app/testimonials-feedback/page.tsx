'use client';

import React, { useEffect, useState } from 'react';
import { TestimonialSlider } from '@/components/ui/testimonial-slider-1';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Review = {
  id: string | number;
  name: string;
  affiliation: string;
  quote: string;
  imageSrc: string;
  thumbnailSrc: string;
};

type FeedbackData = {
  _id: string;
  caseNumber: string;
  interactionType: string;
  outcome: string;
  itemCategory: string;
  easeOfReporting: number;
  speedOfResponse: number;
  platformNavigation: number;
  staffHelpfulness: number;
  overallSatisfaction: number;
  improvementSuggestions: string;
  wouldRecommend: string;
  additionalComments: string;
  createdAt?: string;
};

interface RatingConfig {
  [key: number]: {
    color: string;
    emoji: string;
    text: string;
  };
}

const ratingConfig: RatingConfig = {
  1: { color: 'text-red-500', emoji: '😞', text: 'Poor' },
  2: { color: 'text-orange-500', emoji: '😕', text: 'Fair' },
  3: { color: 'text-yellow-500', emoji: '😐', text: 'Good' },
  4: { color: 'text-lime-500', emoji: '😊', text: 'Very Good' },
  5: { color: 'text-green-500', emoji: '🤩', text: 'Excellent' },
};

const recommendationMap: { [key: string]: string } = {
  'definitely-yes': '✨ Highly Recommended',
  'probably-yes': '👍 Would Recommend',
  'neutral': '😐 Neutral',
  'probably-no': '👎 Not Recommended',
  'definitely-no': '❌ Not Recommended',
};

const imagesByRating: { [key: number]: string } = {
  1: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop&q=80',
  2: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&q=80',
  3: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&q=80',
  4: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&q=80',
  5: 'https://images.unsplash.com/photo-1507876466836-bc5cdc1b64f9?w=400&h=600&fit=crop&q=80',
};

export default function FeedbackTestimonialsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/feedback');
        if (!response.ok) {
          throw new Error('Failed to fetch feedback');
        }
        const data: FeedbackData[] = await response.json();

        // Transform feedback data into testimonial format
        const transformedReviews: Review[] = data
          .filter((f) => f.overallSatisfaction > 0 && f.wouldRecommend)
          .map((feedback, index) => {
            const rating = feedback.overallSatisfaction;
            const ratingInfo = ratingConfig[rating] || ratingConfig[3];
            const recommendationText = recommendationMap[feedback.wouldRecommend] || 'Feedback';
            const imageUrl = imagesByRating[rating];

            return {
              id: feedback._id,
              name: `User #${feedback.caseNumber || index + 1}`,
              affiliation: `${feedback.itemCategory || 'Item'} - ${feedback.outcome === 'yes' ? '✅ Recovered' : '⏳ ' + feedback.outcome}`,
              quote: `${ratingInfo.emoji} "${feedback.improvementSuggestions || 'Great experience with the system!'}" - ${recommendationText}`,
              imageSrc: imageUrl,
              thumbnailSrc: imageUrl.replace('w=400&h=600', 'w=100&h=120'),
            };
          });

        setReviews(transformedReviews);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching feedback:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  return (
    <div className="w-full min-h-screen bg-black">
      {/* Header */}
      <div className="pt-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/landing">
            <Button variant="ghost" className="mb-8 text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>

          <div className="mb-12">
            <h1 className="text-5xl font-bold text-white mb-3">User Testimonials</h1>
            <p className="text-gray-400 text-lg">
              Real feedback from users about their lost and found experiences
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="flex justify-center items-center h-96">
          <p className="text-gray-400 text-lg">Loading testimonials...</p>
        </div>
      )}

      {error && (
        <div className="flex justify-center items-center h-96">
          <p className="text-red-400 text-lg">Error: {error}</p>
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <div className="flex justify-center items-center h-96">
          <p className="text-gray-400 text-lg">No testimonials yet. Be the first to share your feedback!</p>
        </div>
      )}

      {!loading && reviews.length > 0 && <TestimonialSlider reviews={reviews} />}
    </div>
  );
}
