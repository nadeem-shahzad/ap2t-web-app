'use client';
import { admin_nav_items } from '@/lib/constants';
import { startHolyLoader } from 'holy-loader';
import { KBarAnimator, KBarPortal, KBarPositioner, KBarProvider, KBarSearch } from 'kbar';
import { useRouter } from 'next/navigation';
import { ReactNode, useMemo, useState } from 'react';
import RenderResults from './render-result';

export default function KBar({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [navItems, setNavItems] = useState(admin_nav_items);

  const navigateTo = (url: string) => {
    startHolyLoader();
    router.push(`${url}`);
  };

  const localNavItems = [...navItems];

  const actions = useMemo(
    () =>
      localNavItems.flatMap((navItem) => {
        // Only include base action if the navItem has a real URL and is not just a container
        const baseAction =
          navItem.url !== '#'
            ? {
                id: `${navItem.title.toLowerCase()}Action`,
                name: navItem.title,
                shortcut: navItem.shortcut,
                keywords: navItem.title.toLowerCase(),
                section: 'Navigation',
                subtitle: `Go to ${navItem.title}`,
                perform: () => navigateTo(navItem.url),
              }
            : [];

        return baseAction;
      }),
    [navItems]
  );

  if (actions.length === 0) {
    return <>{children}</>;
  }

  return (
    <KBarProvider actions={actions}>
      <KBarComponent>{children}</KBarComponent>
    </KBarProvider>
  );
}
const KBarComponent = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <KBarPortal>
        <KBarPositioner className="scrollbar-hide fixed inset-0 z-[99999] bg-black/80 !p-0 backdrop-blur-sm">
          <KBarAnimator className="relative !mt-64 w-full max-w-[600px] !-translate-y-12 overflow-hidden rounded-lg border bg-background text-foreground shadow-lg">
            <div className="bg-background">
              <div className="border-x-0 border-b-2">
                <KBarSearch className="w-full border-none bg-background px-6 py-4 text-lg outline-none focus:outline-none focus:ring-0 focus:ring-offset-0" />
              </div>
              <RenderResults />
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </>
  );
};
