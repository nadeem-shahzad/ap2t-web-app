import CommonLayout from '@/components/common-layout';
import { ReactNode } from 'react';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  return <CommonLayout>{children}</CommonLayout>;
}
