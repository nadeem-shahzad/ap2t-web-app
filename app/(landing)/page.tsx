'use client';
import AnimatingLoader from '@/components/landing/animating-loader';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function Page() {
  useEffect(() => {
    setTimeout(() => {
      redirect('/home');
    }, 1000);
  }, []);

  return <AnimatingLoader />;
}
