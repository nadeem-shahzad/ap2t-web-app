import Image from 'next/image';

export default function AnimatingLoader() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4">
      <div
        className="relative w-[60vw] max-w-[320px] aspect-square animate-diagonal 
                drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]"
      >
        <Image
          src="/favicon.png"
          alt="logo"
          fill
          priority
          sizes="(max-width: 640px) 60vw, 320px"
          className="object-contain rounded-[22px]"
        />
      </div>
    </div>
  );
}
