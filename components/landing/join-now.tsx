'use client';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '../ui/button';

export default function JoinNow() {
  return (
    <div className="relative flex h-[30rem] sm:h-[35rem] md:h-[40rem] w-full items-center justify-center bg-white dark:bg-black overflow-hidden">
      <div
        className={cn(
          'absolute inset-[-30%]',
          '[background-size:40px_40px]',
          '[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]',
          'dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]',
          '[transform:perspective(1200px)_rotateX(70deg)_scale(1.2)]',
          'origin-center opacity-100'
        )}
      />

      <div className="pointer-events-none absolute inset-0 bg-white [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)] dark:bg-black" />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 sm:h-40 md:h-50"
        style={{
          background:
            'radial-gradient(ellipse at bottom, rgba(211, 251, 32, 0.5) 0%, rgba(0, 255, 128, 0) 80%)',
          zIndex: 10,
        }}
      />

      <div className="relative z-20 flex flex-col gap-6 sm:gap-8 items-center justify-center px-4 text-center">
        <img src={'/images/logo.png'} className="w-40 sm:w-52 md:w-60" />
        <p className="font-bold text-3xl sm:text-4xl md:text-6xl">
          Join now and get 2 months free!
        </p>
        <div className="flex flex-col items-center justify-center px-2">
          <p className="text-[#B3B3B3] mb-6 sm:mb-10 max-w-md sm:max-w-3xl text-center text-sm sm:text-base md:text-lg">
            Contact Advanced Physical and Technical Training today at 732-575-9300 for more
            information about any of our classes, events, or clubs. Our friendly team will be happy
            to answer any questions you have.
          </p>
          <Link href={'/portal/auth?p=signup'}>
            <Button
              style={{
                background:
                  'radial-gradient(circle, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0) 100%)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
              }}
              className="text-white w-36 sm:w-40 h-10 hover:opacity-70 border rounded-full"
            >
              Book Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
