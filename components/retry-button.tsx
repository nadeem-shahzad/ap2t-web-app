'use client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const RetryButton = () => {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.refresh()}
      className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded font-semibold"
    >
      Retry
    </Button>
  );
};

export default RetryButton;
