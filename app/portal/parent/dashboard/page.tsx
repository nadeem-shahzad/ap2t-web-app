'use client';

import MainParentPage from '@/components/parents/main-parent-page';
import { useAuth } from '@/contexts/auth-context';

export default function Page() {
  const { user } = useAuth();

  return <MainParentPage id={Number(user?.id)} />;
}
