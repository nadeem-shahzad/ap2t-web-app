'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Hero() {
  const mobile = useIsMobile();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async () => {
    if (!videoRef.current) return;

    try {
      await videoRef.current.play();
      setIsPlaying(true);
    } catch (e) {
      console.error('Autoplay blocked');
    }
  };

  const handleStop = async () => {
    if (!videoRef.current) return;

    try {
      await videoRef.current.pause();
      setIsPlaying(false);
    } catch (e) {
      console.error('Autoplay blocked');
    }
  };

  const RenderVideo = useCallback(() => {
    useEffect(() => {
      videoRef.current
        ?.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.log(error);
        });
    }, []);

    return (
      <video
        ref={videoRef}
        className="w-full h-full object-cover opacity-30"
        src={mobile ? '/images/home/mobile.mp4' : '/images/home/desktop.mp4'}
        playsInline
        muted
        loop
      />
    );
  }, [mobile]);

  return (
    <section className="relative min-h-screen flex items-center">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <RenderVideo />
      </div>

      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col max-w-2xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-[2px] font-bold italic">
            Advanced Physical & Technical
          </h1>

          <h1 className="text-primary text-3xl sm:text-4xl md:text-[44px] tracking-[4px] font-bold leading-tight">
            TRAINING
          </h1>

          <p className="text-[#D1D5DC] mt-2 sm:mt-4 text-sm sm:text-base">
            Professional Soccer Training Facility In Matuchen, NJ
          </p>

          <div className="rounded-lg flex flex-col sm:flex-row bg-[#FFFFFF3D] p-4 sm:p-6 mt-4 gap-4 sm:gap-0 justify-between text-center">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold">5000+</h1>
              <h4 className="text-sm sm:text-base">Members</h4>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold">50+</h1>
              <h4 className="text-sm sm:text-base">Programs</h4>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold">15+</h1>
              <h4 className="text-sm sm:text-base">Years</h4>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row mt-4 gap-4 justify-center sm:justify-start">
            <Link href="/portal/auth">
              <Button
                size={'lg'}
                className="rounded-full bg-primary text-secondary font-bold w-full sm:w-auto"
              >
                BOOK SESSION
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size={'lg'}
                className="bg-transparent border-2 border-white rounded-full text-white w-full sm:w-auto hover:bg-white/10"
              >
                CALL US 732-515-9300
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <button
        onClick={() => (isPlaying ? handleStop() : handlePlay())}
        className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition cursor-pointer"
      >
        {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
      </button>
    </section>
  );
}
