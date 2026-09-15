'use client';

import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { team } from '@/components/landing/constants';
import Image from 'next/image';

export default function CoreTeam() {
  return (
    <div className="container mx-auto">
      <div className="flex justify-between flex-wrap gap-4 items-center mb-4 sm:mb-4">
        <p className="font-bold text-2xl sm:text-3xl mb-2">
          <span>Our Core </span>
          <span className="text-primary">Team</span>
        </p>
        <Link href={'/about/coreteam'}>
          <Button>View All Coaches</Button>
        </Link>
      </div>

      <p className="text-[#A3A3A3] text-sm sm:text-base mb-6 sm:mb-8">
        Meet the dedicated professionals who make AP2T exceptional
      </p>

      <Carousel className="w-full mt-4">
        <CarouselContent>
          {team.map((item, index) => (
            <CarouselItem key={index} className="basis-full sm:basis-1/2 lg:basis-1/3 px-2">
              <div className="bg-[#141414] flex flex-col h-[420px] sm:h-[480px] md:h-[530px] rounded-t-lg overflow-hidden">
                {/* Image */}
                <div className="relative w-full h-2/3 overflow-hidden rounded-t-lg">
                  <Image src={item.img} alt={item.title} fill className="object-cover" />
                </div>

                {/* Name & Designation */}
                <div className="flex flex-col p-4 mt-auto space-y-1">
                  <p className="text-white text-lg sm:text-xl font-semibold">{item.title}</p>
                  <p className="text-[#A3A3A3] text-xs sm:text-sm">{item.designation}</p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
