import Link from 'next/link';
import { Button } from '../ui/button';

export default function RegisterNow() {
  return (
    <section className="relative isolate flex h-[30rem] w-full items-center justify-center overflow-hidden bg-[#0a0a0a] px-4 sm:h-[35rem] sm:px-6 md:h-[40rem]">
      {/* Two perspective tile grids meet softly behind the content. */}
      <div className="pointer-events-none absolute -inset-x-[30%] -top-[48%] h-[90%] origin-bottom [background-image:linear-gradient(to_right,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)] [transform:perspective(1100px)_rotateX(-67deg)_scale(1.22)]" />
      <div className="pointer-events-none absolute -inset-x-[30%] -bottom-[48%] h-[90%] origin-top [background-image:linear-gradient(to_right,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_top,black,transparent_82%)] [transform:perspective(1100px)_rotateX(67deg)_scale(1.22)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(ellipse_at_top,rgba(211,251,32,0.25),transparent_68%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-[radial-gradient(ellipse_at_bottom,rgba(211,251,32,0.2),transparent_68%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0a0a0a_20%,rgba(10,10,10,0.86)_48%,transparent_75%)]" />

      <div className="relative z-10 flex flex-col items-center justify-center gap-6 px-4 text-center sm:gap-8">
        <p className="text-3xl font-bold text-white sm:text-4xl md:text-6xl">Visit Our Facility</p>
        <div className="flex flex-col items-center justify-center px-2">
          <p className="mb-2 max-w-md text-center text-sm text-[#b3b3b3] sm:max-w-3xl">
            Interested in seeing our facility in person? Schedule a tour or come watch a training
            session.
          </p>
          <p className="mb-2 max-w-md text-center text-sm text-[#b3b3b3] sm:max-w-3xl">
            Address: <span className="text-white">302 High St, Metuchen, NJ 08840</span>
          </p>
          <p className="mb-2 max-w-md text-center text-sm text-[#b3b3b3] sm:max-w-3xl">
            Phone:{' '}
            <a className="cursor-pointer text-white underline" href="tel:7325159300">
              732-515-9300
            </a>
          </p>
          <Button
            style={{
              background:
                'radial-gradient(circle, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0) 100%)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
            className="text-white w-36 sm:w-40 h-10 mt-5"
          >
            <Link href={'portal/auth'}>Register Now</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
