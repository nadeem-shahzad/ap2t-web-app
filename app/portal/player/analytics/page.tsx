'use client';

import PersonalAnalytics from '@/components/analytics/personal-analytics';
import { useAuth } from '@/contexts/auth-context';

export default function PlayerAnalyticsPage() {
  const { user } = useAuth();
  return <PersonalAnalytics mode="player" playerId={Number(user?.id) || undefined} />;
}
