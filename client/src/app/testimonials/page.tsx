'use client';

import * as React from "react";
import { TestimonialSlider } from "@/components/ui/testimonial-slider-1";

// Define the review data
const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    affiliation: "University of California",
    quote:
      "This lost and found system is incredibly intuitive. I found my lost laptop within hours of filing a report!",
    imageSrc:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop&q=80",
    thumbnailSrc:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=120&fit=crop&q=80",
  },
  {
    id: 2,
    name: "Michael Chen",
    affiliation: "MIT",
    quote:
      "The platform's search functionality is remarkable. Found my keys in less than 24 hours!",
    imageSrc:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&q=80",
    thumbnailSrc:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=120&fit=crop&q=80",
  },
  {
    id: 3,
    name: "Emma Wilson",
    affiliation: "Stanford University",
    quote:
      "As a student, losing my wallet was stressful. This system made the recovery process seamless and quick.",
    imageSrc:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&q=80",
    thumbnailSrc:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=120&fit=crop&q=80",
  },
  {
    id: 4,
    name: "James Rodriguez",
    affiliation: "Harvard University",
    quote:
      "Outstanding service! The staff was incredibly helpful in reuniting me with my lost documents.",
    imageSrc:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&q=80",
    thumbnailSrc:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=120&fit=crop&q=80",
  },
  {
    id: 5,
    name: "Lisa Anderson",
    affiliation: "Yale University",
    quote:
      "Best lost and found experience I've had. The notification system is super responsive and helpful.",
    imageSrc:
      "https://images.unsplash.com/photo-1507876466836-bc5cdc1b64f9?w=400&h=600&fit=crop&q=80",
    thumbnailSrc:
      "https://images.unsplash.com/photo-1507876466836-bc5cdc1b64f9?w=100&h=120&fit=crop&q=80",
  },
];

export default function TestimonialsPage() {
  return (
    <div className="w-full min-h-screen bg-black">
      <TestimonialSlider reviews={testimonials} />
    </div>
  );
}
