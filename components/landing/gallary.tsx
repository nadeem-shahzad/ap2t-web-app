'use client';
import Image from 'next/image';
import RegisterNow from './register-now';

export default function GalleryPage() {
  return (
    <div className="py-16 sm:py-20 relative">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center px-4 sm:px-6 lg:px-0 mt-10">
          <p className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4">
            Our community is at the heart of everything we do.
          </p>
          <p className="text-[#B3B3B3] text-sm sm:text-base md:text-lg max-w-2xl">
            Explore images of our state-of-the-art facilities, high-performance training sessions,
            and exciting events.
          </p>
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-3 py-10 md:py-20 gap-4">
          {images.map((item, ind) => (
            <div key={ind} className="mb-4 break-inside-avoid relative w-full">
              <Image
                src={item.src}
                alt={'image'}
                width={item.width}
                height={item.height}
                className="w-full h-auto object-cover rounded-[8px]"
              />
            </div>
          ))}
        </div>
      </div>

      <RegisterNow />
    </div>
  );
}
const images = [
  { src: '/images/gallery/pic 1.JPG', width: 320, height: 174 },
  { src: '/images/gallery/pic 2.JPG', width: 320, height: 212 },
  { src: '/images/gallery/pic 3.JPG', width: 320, height: 212 },
  { src: '/images/gallery/pic 4.JPG', width: 320, height: 180 },
  { src: '/images/gallery/pic 5.JPG', width: 320, height: 200 },
  { src: '/images/gallery/pic 6.JPG', width: 320, height: 190 },
  { src: '/images/gallery/pic 7.JPG', width: 320, height: 210 },
  { src: '/images/gallery/pic 8.JPG', width: 320, height: 175 },
  { src: '/images/gallery/pic 9.JPG', width: 320, height: 220 },
  { src: '/images/gallery/pic 10.JPG', width: 320, height: 185 },
  { src: '/images/gallery/pic 11.JPG', width: 320, height: 195 },
  { src: '/images/gallery/pic 12.JPG', width: 320, height: 200 },
  { src: '/images/gallery/pic 13.JPG', width: 320, height: 200 },
  { src: '/images/gallery/pic 14.JPG', width: 320, height: 175 },

  { src: '/images/gallery/pic 15.JPG', width: 320, height: 200 },
  { src: '/images/gallery/pic 16.JPG', width: 320, height: 190 },

  { src: '/images/gallery/pic 17.JPG', width: 320, height: 200 },
  { src: '/images/gallery/pic 18.JPG', width: 320, height: 175 },
  { src: '/images/gallery/pic 19.JPG', width: 320, height: 174 },
];
