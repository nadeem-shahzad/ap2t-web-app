'use client';

import LogoLoop from '../LogoLoop';

const logos = [
  { src: '/images/partnerlogos/vsa.png', alt: 'VSA', href: 'https://www.vsa-nj.com/' },
  {
    src: '/images/partnerlogos/edison.png',
    alt: 'Edison',
    href: 'https://www.edisonunitedsoccer.com/',
  },
  { src: '/images/partnerlogos/pda.png', alt: 'PDA', href: 'https://www.pdasoccer.org/' },
  {
    src: '/images/partnerlogos/metuchen.png',
    alt: 'Metuchen',
    href: 'https://metuchensportscenter.com/',
  },
  {
    src: '/images/partnerlogos/perform.png',
    alt: 'Perform',
    href: 'https://www.performbetter.com/',
  },
  { src: '/images/partnerlogos/runner1.png', alt: 'Runner', href: 'https://runnershighnj.com/' },
  { src: '/images/partnerlogos/psa.png', alt: 'PSA', href: 'https://princetonsocceracademy.com/' },
];

export default function Partners() {
  return (
    <div className="w-full flex flex-col py-10">
      <p className="text-2xl sm:text-3xl md:text-4xl font-semibold text-center mb-6">
        Our Trusted Partners
      </p>
      <div style={{ position: 'relative', overflow: 'hidden' }} className="mt-10">
        <LogoLoop
          logos={logos}
          speed={120}
          direction="left"
          logoHeight={70}
          gap={100}
          hoverSpeed={0}
          scaleOnHover
          fadeOut
          fadeOutColor="#000000"
          ariaLabel="Technology partners"
        />
      </div>
    </div>
  );
}
