'use client';
import { useIsMobile } from '@/hooks/use-mobile';
import { CurvedImage } from './curved-image';
import CoreTeam from './home-page/core-team';
import { about, values } from './constants';

export default function AboutPage() {
  const mobile = useIsMobile();
  return (
    <div className="relative py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="space-y-8 sm:space-y-10 mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left */}
            <div className="lg:col-span-2 space-y-4">
              <p className="font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
                <span className="italic">Where </span>
                <span className="text-primary">Performance</span>
              </p>

              <p className="font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
                <span className="italic">Meets </span>
                <span className="text-primary">Community.</span>
              </p>
            </div>

            {/* Right */}
            <p className="max-w-lg text-muted-foreground text-sm sm:text-base md:text-lg">
              AP2T builds personalized, sport-specific training programs backed by elite
              research—developing strength, speed, endurance, flexibility, power, and injury
              resilience to help athletes reach peak performance.
            </p>
          </div>

          <CurvedImage
            src="/images/about/abouthero.JPG?height=400&width=800"
            alt="About hero"
            curveDepth={mobile ? 10 : 20}
            className="shadow-2xl"
          />
        </section>

        {/* Values Section */}
        <section className="py-16 sm:py-20 space-y-8">
          <div className="max-w-3xl space-y-3">
            <p className="font-bold text-2xl sm:text-3xl">
              <span>Our </span>
              <span className="text-primary">Values</span>
            </p>

            <p className="text-[#B3B3B3] text-sm sm:text-base">
              Shaping excellence through purpose, dedication, and professional growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {values.map((item, i) => (
              <div className="flex gap-4" key={i}>
                <div className="w-1 rounded-full bg-primary" />
                <div className="space-y-2">
                  <p className="text-primary font-semibold opacity-20 text-2xl sm:text-3xl md:text-4xl">
                    {item.title}
                  </p>
                  <p className="text-[#B3B3B3] text-sm sm:text-base leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* About Us Section */}
        <section className=" space-y-10">
          <p className="font-bold text-2xl sm:text-3xl">
            <span className="text-primary">About </span>
            <span className="text-primary">Us</span>
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            {/* Left */}
            <div className="space-y-5 max-w-xl">
              <p className="text-white text-2xl sm:text-3xl md:text-4xl leading-tight">
                We are athletes dedicated to <span className="font-bold">pushing limits</span> and{' '}
                <span className="font-bold">breaking records</span>
              </p>

              <p className="text-[#B3B3B3] text-sm sm:text-base md:text-lg leading-relaxed">
                Here at AP2T, we recognize that a sound athletic performance training program is
                nothing without a staff that best understands how to implement it — which is why we
                feature an exceptional team to instruct and motivate our athletes to unparalleled
                success.
              </p>
            </div>

            {/* Right Grid */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {about.map((item, i) => (
                <div key={i} className="flex flex-col justify-center bg-[#191919] p-6">
                  <p className="text-white text-2xl sm:text-3xl md:text-4xl font-bold mb-1">
                    {item.title}
                  </p>
                  <p className="text-[#A3A3A3] text-xs sm:text-sm md:text-base">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Team */}
        <section className="pt-16 sm:pt-20">
          <CoreTeam />
        </section>
      </div>
    </div>
  );
}
