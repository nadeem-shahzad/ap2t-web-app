'use client';

import BackButton from '@/components/back-button';
import MainParentPage from '@/components/parents/main-parent-page';
import { useParams } from 'next/navigation';

export default function Page() {
  const { id } = useParams();
  return (
    <MainParentPage
      admin={true}
      id={id as string}
      back={<BackButton title="Back To Parents" route="/portal/admin/parents" />}
    />
  );
}
