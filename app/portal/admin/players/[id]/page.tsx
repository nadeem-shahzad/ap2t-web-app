'use client';

import BackButton from '@/components/back-button';
import MainPlayerPage from '@/components/players/main-player-page';
import { useParams } from 'next/navigation';

export default function Page() {
  const { id } = useParams();

  return (
    <MainPlayerPage
      admin={true}
      id={Number(id) || undefined}
      back={<BackButton title="Back To Players" route="/portal/admin/players" />}
    />
  );
}
