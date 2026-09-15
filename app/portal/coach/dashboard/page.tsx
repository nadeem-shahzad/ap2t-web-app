'use client';

import MainCoachPage from '@/components/coach/main-coach-page';
import { useAuth } from '@/contexts/auth-context';

export default function Page() {
  const { user } = useAuth();
  return <MainCoachPage id={user?.id} />;
}
