import AppSidebar from '@/components/app-sidebar';
import KBar from '@/components/kbar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ReactNode } from 'react';
import DashboardHeader from './dashboard-header';
import PageContainer from './page-container';

export default async function CommonLayout({ children }: { children: ReactNode }) {
  return (
    <KBar>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-1 flex-col">
            <div className="w-full bg-[#252525] h-[61.5px]">
              <DashboardHeader trigger={<SidebarTrigger />} />
            </div>
            <div className="flex flex-1">
              <PageContainer>{children}</PageContainer>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
}
