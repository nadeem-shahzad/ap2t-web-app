import { Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

export default function PricingSection() {
  return (
    <div className="w-full">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-semibold">Path to Peak Performance</h1>
        <p className="text-sm text-[#A3A3A3] mt-3 max-w-xl mx-auto">
          Customizable at-home programs. Access detailed high-level training programs designed to be
          completed remotely
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        <div
          className="relative rounded-2xl p-8 overflow-hidden"
          style={{
            background:
              'linear-gradient(180deg, rgba(58,71,0,0.5) 5%, rgba(0,0,0,0) 100%), rgba(17,17,17,1)',
            border: '1px solid',
            borderColor: '#6D6D6D',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
        linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
      `,
              backgroundSize: '60px 60px',
              zIndex: 0,
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,1) 100%)',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskSize: '100% 100%',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,1) 100%)',
              maskRepeat: 'no-repeat',
              maskSize: '100% 100%',
            }}
          />

          <div className="relative z-10">
            <h2 className="text-lg">General Plan</h2>
            <p className="text-xs text-muted mt-1">Monthly</p>

            <p className="text-3xl font-semibold mt-4">
              $400 <span className="text-sm font-normal">/month</span>
            </p>

            <p className="text-sm text-[#D1D5DC] mt-4">
              Perfect for beginners or those looking to establish a solid foundation at home.
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              {[
                '4-week structured program',
                'Daily workout routines',
                'Downloadable PDF guide',
                'Video demonstrations',
                'Progress tracking sheets',
                'Nutrition guidelines',
              ].map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full flex items-center justify-center bg-primary">
                    <Check className="text-black" size={12} />
                  </div>
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </ul>

            <Link href={'/portal/auth?p=signup'}>
              <Button className="bg-black text-primary mt-8 w-full rounded-full border border-white/20 py-3 text-sm ">
                Choose Plan
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative rounded-2xl p-8 overflow-hidden">
          <div className="absolute inset-0 bg-primary rounded-2xl z-0" />

          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              backgroundImage: `
      linear-gradient(to right, rgba(196,196,196,0.5) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(196,196,196,0.5) 1px, transparent 1px)
    `,
              backgroundSize: '60px 60px',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,1) 100%)',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskSize: '100% 100%',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,1) 100%)',
              maskRepeat: 'no-repeat',
              maskSize: '100% 100%',
            }}
          />

          {/* Content */}
          <div className="relative z-20 text-black">
            <span className="inline-block text-xs px-3 py-1 rounded-full bg-black text-primary mb-3">
              Most Popular
            </span>

            <h2 className="text-lg">Quarterly Plan</h2>
            <p className="text-xs opacity-70 mt-1">3 Months</p>

            <p className="text-3xl font-semibold mt-4">
              $375 <span className="text-sm font-normal">/month · 3 months upfront</span>
            </p>

            <p className="text-sm opacity-80 mt-4">
              A structured three-month program with check-ins available when you need them.
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              {[
                '12-week structured program',
                '1x a week check-ins upon request',
                'Daily workout routines',
                'Video demonstrations',
                'Progress tracking sheets',
                'Nutrition guidelines',
              ].map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full flex items-center justify-center bg-black">
                    <Check className="text-primary" size={12} />
                  </div>
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </ul>
            <Link href={'/portal/auth?p=signup'}>
              <Button className="mt-8 w-full rounded-full bg-black text-white py-3 text-sm hover:text-black hover:bg-black/50">
                Purchase
              </Button>
            </Link>
          </div>
        </div>

        <div
          className="relative rounded-2xl p-8"
          style={{
            background:
              'linear-gradient(180deg, rgba(58,71,0,0.5) 5%, rgba(0,0,0,0) 80%), rgba(17,17,17,1)',
            border: '1px solid',
            borderColor: '#6D6D6D',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
        linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
      `,
              backgroundSize: '60px 60px',
              zIndex: 0,
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,1) 100%)',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskSize: '100% 100%',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,1) 100%)',
              maskRepeat: 'no-repeat',
              maskSize: '100% 100%',
            }}
          />

          <div className="relative z-10">
            <h2 className="text-lg">Elite Plan</h2>
            <p className="text-xs text-muted mt-1">12 Months</p>

            <p className="text-3xl font-semibold mt-4">
              $350 <span className="text-sm font-normal">/month</span>
            </p>

            <p className="text-sm text-muted mt-4">
              Long-term coaching support built around your year-long performance goals.
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              {[
                '12-month subscription',
                '12-month structured program',
                '1x a week check-ins upon request',
                'Priority email support',
                'Progress assessments',
                'Seasonal periodization',
              ].map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full flex items-center justify-center bg-primary">
                    <Check className="text-black" size={12} />
                  </div>
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </ul>
            <Link href={'/portal/auth?p=signup'}>
              <Button className="bg-black text-primary mt-8 w-full rounded-full border border-white/20 py-3 text-sm ">
                Choose Plan
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
