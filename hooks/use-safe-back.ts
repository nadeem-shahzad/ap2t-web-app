// hooks/useSafeBack.ts

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export const useSafeBack = (fallback: string = '/home') => {
  const router = useRouter();
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasHistory(sessionStorage.getItem('hasHistory') === 'true');
      sessionStorage.setItem('hasHistory', 'true');
    }
  }, [router]);

  const safeBack = () => {
    if (typeof window === 'undefined') return;

    if (hasHistory) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return safeBack;
};
