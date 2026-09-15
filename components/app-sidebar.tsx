'use client';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';

import { Icons } from '@/components/icons';
import { useAuth } from '@/contexts/auth-context';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  admin_nav_items,
  coach_nav_items,
  front_desk_items,
  parent_nav_items,
  player_nav_items,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import CountBadge from './count-badge';
import { useApproval } from './frontdesk/use-approval';
import GetSupportDialog from './get-support-dialog/getsupportddialog';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

export const company = {
  name: 'AP2T',
  logo: '/images/logo.png',
  favicon: '/favicon.png',
};

export default function AppSidebar() {
  const pathname = usePathname();

  const isMobile = useIsMobile();
  const { toggleSidebar, state } = useSidebar();
  const [navItems, setNavItems] = useState<any[]>([]);
  const { user } = useAuth();
  const { approvalCount } = useApproval();

  useEffect(() => {
    if (pathname.startsWith('/portal/admin')) {
      setNavItems([...admin_nav_items]);
    }

    if (pathname.startsWith('/portal/parent')) {
      setNavItems([...parent_nav_items]);
    }

    if (pathname.startsWith('/portal/player')) {
      setNavItems([...player_nav_items]);
    }

    if (pathname.startsWith('/portal/coach')) {
      setNavItems([...coach_nav_items]);
    }
    if (pathname.startsWith('/portal/front-desk')) {
      setNavItems([...front_desk_items]);
    }
  }, [pathname]);

  const showSupport = user?.role === 'parent' || user?.role === 'player';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex w-full align-center justify-center py-1">
          <div
            className={cn(
              'w-35 h-9.25   overflow-hidden',
              state === 'expanded' && 'rounded-full bg-black'
            )}
          >
            {state === 'expanded' ? (
              <img src={company.logo} alt="AP2T LOGO" className="w-full h-full " />
            ) : (
              <img src={company.favicon} alt="AP2T LOGO" className="w-full h-full " />
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden pt-5">
        <ScrollArea>
          <SidebarGroup>
            <SidebarMenu>
              {navItems.map((item, index: number) => {
                const Icon = item.icon ? Icons[item.icon] : Icons.gitHub;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={pathname.includes(item.url)}
                      className="h-10 rounded-[8px]"
                    >
                      <Link
                        onClick={() => {
                          if (isMobile) toggleSidebar();
                        }}
                        href={`${item.url}`}
                        className="flex items-center"
                      >
                        <Icon />
                        <span className="text-[14px]">{item.title} </span>
                        {item?.title === 'Front Desk' && <CountBadge count={approvalCount} />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
          <ScrollBar />
        </ScrollArea>
      </SidebarContent>

      {state === 'expanded' && showSupport && (
        <SidebarFooter className="border-t py-5">
          <SidebarMenu>
            <SidebarMenuItem>
              <GetSupportDialog email={user?.email} />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
      <SidebarRail />
    </Sidebar>
  );
}
