'use client';
import SessionMainPage from '@/components/session/main-page';
import { useParams } from 'next/navigation';

export default function Page() {
  const { id } = useParams();

  return (
    <SessionMainPage
      admin={true}
      id={Number(id || null)}
      back={'/portal/admin/sessions'}
      back_title={'Back to Sessions'}
    />
  );
}
