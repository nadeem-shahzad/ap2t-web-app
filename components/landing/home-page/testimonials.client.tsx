'use client';

import TestimonialSlider, { ReviewLanding } from '@/components/landing/reviewslider';
import { EmblaOptionsType } from 'embla-carousel';

export default function Testimonials({ data }: { data: ReviewLanding[] }) {
  const OPTIONS: EmblaOptionsType = { align: 'start' };

  return (
    <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
      <div className="w-full space-y-8">
        <TestimonialSlider slides={data} options={OPTIONS}>
          <div className="w-full h-24 space-y-1">
            <h1 className="text-primary font-semibold text-5xl">Testimonial</h1>
            <p className="text-[#A3A3A3]">
              Hear from our members who have transformed their fitness, performance, and lifestyle
              with us!
            </p>
          </div>
        </TestimonialSlider>
      </div>
    </section>
  );
}
