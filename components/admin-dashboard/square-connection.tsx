import { useAuth } from '@/contexts/auth-context';
import useSquareConnection from '@/hooks/use-square-connection';
import { useEffect } from 'react';
import { GoDotFill } from 'react-icons/go';

export default function SquareConnection() {
  const { connected, checkConnection } = useSquareConnection();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    checkConnection();
  }, [user]);

  return (
    <div className="space-y-1 ">
      <h1 className="text-[#99A1AF] text-xs">Square Integration</h1>
      <div className="flex items-center gap-2 text-sm">
        <GoDotFill className={connected ? 'text-active-text' : 'text-warning-text'} />
        <h1 className={connected ? 'text-active-text' : 'text-warning-text'}>
          {connected ? 'Connected' : 'Disconnected'}
        </h1>
      </div>
    </div>
  );
}
