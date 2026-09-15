'use client';
import SessionMainPage from '@/components/session/main-page';
import { useParams } from 'next/navigation';

export default function Page() {
  const { id } = useParams();

  return (
    <SessionMainPage
      id={Number(id || null)}
      back={'/portal/coach/sessions'}
      back_title={'Back to Sessions'}
    />
  );
}
