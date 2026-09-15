'use server';
import { ServerError } from '@/components/server-error';
import Testimonials from './testimonials.client';

export async function TestimonialServer() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/testimonials/landing`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      throw new Error('Failed to fetch testimonials');
    }

    const data = await res.json();
    return <Testimonials data={data} />;
  } catch (error: any) {
    return <ServerError error={error} />;
  }
}
