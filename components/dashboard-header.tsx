'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-mobile';
import axios from '@/lib/axios';
import { auth } from '@/lib/firebase';
import { joinNames } from '@/lib/functions';
import { signOut } from 'firebase/auth';
import { ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'nextjs-toploader/app';
import { ReactNode, useEffect, useState } from 'react';
import InputWithIcon from './input-with-icon';
import NotificationSheet from './notification-sheet';
import RenderAvatar from './render-avatar';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Spinner } from './ui/spinner';

interface PopupItem {
  id: string | number;
  name: string;
  route: string;
}

export default function DashboardHeader({ trigger }: { trigger?: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const showPopup = pathname?.includes('admin');

  const logout = async () => {
    try {
      await signOut(auth);
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="flex flex-1 w-full h-full px-4">
      <div className="w-full flex justify-between flex-wrap items-center">
        <div className="flex gap-4 items-center">
          {trigger}
          {showPopup && <PopupSearch />}
        </div>
        <div className="flex gap-4 items-center">
          <NotificationSheet />
          <Separator orientation="vertical" />
          <div>
            <p className="text-xs text-white text-right">{user?.first_name}</p>
            <p className="text-xs text-muted-foreground text-right">{user?.email}</p>
          </div>
          <RenderAvatar
            fallback={joinNames([user?.first_name, user?.last_name])}
            img={user?.picture}
          />

          <DropdownMenu>
            <DropdownMenuTrigger>
              <ChevronDown size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="dark:hover:bg-transparent">
                <Button onClick={() => logout()} className="w-full">
                  Logout
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

const PopupSearch = () => {
  const [data, setData] = useState<PopupItem[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  const router = useRouter();

  useEffect(() => {
    if (!debouncedSearch?.trim()) {
      setData([]);
      return;
    }
    fetchData();
  }, [debouncedSearch]);

  async function fetchData() {
    setLoading(true);
    try {
      const response = await axios.get(
        `/admin/all-search?query=${encodeURIComponent(debouncedSearch)}`
      );
      setData(response.data);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  const handleClick = (route: string) => {
    router.push(route);
    setSearch('');
    setData([]);
  };

  return (
    <div className="relative w-full">
      <InputWithIcon
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={isMobile ? 'hidden' : 'w-100'}
        placeholder="Search player, coaches, sessions..."
      />

      {loading && (
        <div className="absolute top-full left-0 z-50 w-full bg-secondary border rounded shadow-md mt-1 px-4 py-2 text-sm">
          <Spinner />
        </div>
      )}

      {search && !loading && data.length > 0 && (
        <div className="absolute top-full left-0 z-50 w-full max-h-64 bg-secondary border rounded mt-1">
          <ScrollArea className="h-64">
            {data.map((item) => (
              <div
                key={item.route}
                onClick={() => handleClick(item.route)}
                className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-black text-sm"
              >
                {item.name}
              </div>
            ))}
          </ScrollArea>
        </div>
      )}

      {search && !loading && data.length === 0 && (
        <div className="absolute top-full left-0 z-50 w-full bg-secondary border rounded shadow-md mt-1 px-4 py-2 text-sm">
          No results found
        </div>
      )}
    </div>
  );
};
