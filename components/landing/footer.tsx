import { Calendar, Clock, Facebook, Instagram, LetterTextIcon, Map, Phone } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <div className="w-full border-t mt-12 border-[#282828]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="flex flex-col gap-4">
            <img src="/images/logo.png" alt="Logo" className="w-20 rounded-full" />
            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              Your ultimate destination for sports, fitness, and community.
            </p>

            <div className="flex gap-3">
              <Link
                href="https://www.facebook.com/AP2T.net/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow AP2T on Facebook"
              >
                <Facebook className="w-4 h-4" />
              </Link>
              <Link
                href="https://www.instagram.com/_ap2t.net_/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow AP2T on Instagram"
              >
                <Instagram className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="font-medium text-sm">Quick Links</h1>
            <div className="flex flex-col gap-2 text-[#A3A3A3] text-xs">
              <Link href="/about">About Us</Link>
              <Link href="/inhouseprograms">Programs</Link>
              <Link href="/camps-clinics">Camps & Clinics</Link>
              <Link href="/portal/auth?p=signup">Registration</Link>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="font-medium text-sm">Contact</h1>
            <div className="flex flex-col gap-3 text-[#A3A3A3] text-xs">
              <Link href="/contact">Contact Us</Link>
              <div className="flex gap-2 items-start">
                <LetterTextIcon className="w-4 h-4 mt-0.5" />
                <span>rjallen@ap2t.net</span>
              </div>
              <div className="flex gap-2 items-start">
                <Map className="w-4 h-4 mt-0.5" />
                <span>302 High St, Metuchen, New Jersey, 08840</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="font-medium text-sm">Hours of Operation</h1>
            <div className="flex flex-col gap-3 text-[#A3A3A3] text-xs">
              <div className="flex gap-2 items-center">
                <Calendar className="w-4 h-4" />
                <span>Mon–Fri: 8 a.m. – 9 p.m.</span>
              </div>
              <div className="flex gap-2 items-center">
                <Clock className="w-4 h-4" />
                <span>Sat: 8 a.m. – 12 p.m.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#282828] mt-10 pt-6 text-center text-xs text-[#A3A3A3]">
          © {`${new Date().getFullYear()}`} AP2T. All rights reserved.
        </div>
      </div>
    </div>
  );
}
