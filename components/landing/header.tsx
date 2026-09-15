'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { LogIn } from 'lucide-react';

const links = [
  { name: 'HOME', href: '/home' },
  { name: 'ABOUT US', href: '/about' },
  { name: 'IN-HOUSE PROGRAMS', href: '/inhouseprograms' },
  { name: 'CAMPS & CLINICS', href: '/camps-clinics' },
  { name: 'GALLERY', href: '/gallery' },
  // { name: "STORE", href: "#" }
];

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Header Wrapper */}
      <div className="w-full fixed top-0 left-0 z-50 flex justify-center pt-5">
        <div className="w-full max-w-[1200px] px-4">
          {/* Desktop Navbar */}
          <div className="hidden md:flex justify-between items-center bg-[#FFFFFF3D] p-1 rounded-full">
            {/* Logo */}
            <Link href={'/'}>
              <Image
                src="/images/logo.png"
                alt="logo"
                height={30}
                width={110}
                className="rounded-[22px]"
              />
            </Link>

            {/* Links */}
            <div className="flex gap-8 items-center text-[14px]">
              {links.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  className={`text-[14px] font-medium leading-relaxed tracking-wide ${pathname.includes(item.href) ? ' text-primary' : 'text-white'}`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              {/* <Button className="rounded-full bg-[#CBFD0026] text-primary hover:bg-primary hover:text-secondary w-20">
                Store
              </Button> */}
              <Link href={'/contact'} className="w-25">
                <Button className="bg-[#CBFD0026] text-primary hover:bg-primary hover:text-secondary rounded-full w-full">
                  Contact
                </Button>
              </Link>
              <Link href={'/portal/auth'}>
                <Button className="rounded-full">
                  Portal <LogIn />
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden flex justify-between items-center bg-[#FFFFFF3D] p-2 rounded-full">
            <Link href={'/'}>
              <Image
                src="/images/logo.png"
                alt="logo"
                width={36}
                height={36}
                className="h-9 w-auto rounded-[22px]"
                priority
              />
            </Link>

            <button onClick={() => setDrawerOpen(true)} className="mr-2">
              <HiOutlineMenu size={30} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div className="absolute right-0 top-0 h-full w-72 bg-[#262626] p-6 flex flex-col gap-6">
            {/* Close */}
            <button className="self-end" onClick={() => setDrawerOpen(false)}>
              <HiOutlineX size={24} />
            </button>

            {/* Links */}
            <div className="flex flex-col gap-4 mt-4">
              {links.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  className="text-lg font-semibold"
                  onClick={() => setDrawerOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Buttons */}
            <div className="mt-auto flex flex-col gap-3">
              <Link onClick={() => setDrawerOpen(false)} href={'/contact'} className="w-full">
                <Button className="bg-[#CBFD0026] text-primary hover:bg-primary hover:text-secondary w-full">
                  Contact
                </Button>
              </Link>
              <Link onClick={() => setDrawerOpen(false)} href={'/portal/auth'} className="w-full">
                <Button className="w-full">
                  Portal <LogIn />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
