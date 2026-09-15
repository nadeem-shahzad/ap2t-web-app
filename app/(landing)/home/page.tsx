import FlyerDialog from '@/components/landing/flyer-dialog';
import Booking from '@/components/landing/home-page/book.client';
import Facilities from '@/components/landing/home-page/facilities.client';
import Hero from '@/components/landing/home-page/hero.client';
import Partners from '@/components/landing/home-page/partner.client';
import Programs from '@/components/landing/home-page/programs.client';
import { TestimonialServer } from '@/components/landing/home-page/testimonals.server';
import PricingSection from '@/components/landing/pricing-section';
import RegisterNow from '@/components/landing/register-now';
export const metadata = {
  title: 'Home | AP2T',
  description:
    'AP2T is a modern platform for managing sports training sessions, coaches, and player development with ease.',
  keywords: [
    'sports training',
    'coaching platform',
    'player development',
    'AP2T',
    'training sessions',
  ],
};
export default function LandingPage() {
  return (
    <div>
      <FlyerDialog page="home" />
      <Hero />
      <Facilities />
      <Partners />
      <Programs />
      <Booking />
      <TestimonialServer />
      <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-20">
        <PricingSection />
      </section>
      <div className="pt-6 sm:pt-8 lg:pt-10">
        <RegisterNow />
      </div>
    </div>
  );
}
