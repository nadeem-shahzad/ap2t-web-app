'use client';
import { Check } from 'lucide-react';
import Image from 'next/image';

export default function Facilities() {
  return (
    <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
      <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-16">
        <div className="relative w-full lg:w-1/2 h-64 sm:h-80 md:h-96">
          <Image
            src="/images/home/sidepic1.JPG"
            alt="pic"
            fill
            className="rounded-lg object-cover"
            priority
          />
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <h1 className="font-bold text-2xl sm:text-4xl">
            Our <span className="text-primary">Facilities</span>
          </h1>
          <p className="text-[#99A1AF] text-sm sm:text-base">
            World-class training facilities designed for optimal player development
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-1 gap-2 mt-2">
            {[
              'Olympic-size indoor soccer field',
              'Convenient Location',
              'State-of-the-art lighting equipment',
              'Modern locker rooms',
              'Large Indoor Field Turf',
              'Strength And Conditioning Room',
              'Safe and secure facility',
            ].map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full flex items-center justify-center bg-primary">
                  <Check className="text-black" size={12} />
                </div>
                <p className="text-sm sm:text-base">{item}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-[#282828] mt-4 pt-2">
            <p className="text-[#99A1AF] text-sm sm:text-base">visit us at:</p>
            <h1 className="text-base sm:text-lg">Metuchen, NJ </h1>
          </div>
        </div>
      </div>
    </section>
  );
}
