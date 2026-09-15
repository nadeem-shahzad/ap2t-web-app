import { ReactNode } from 'react';
import { AuthProvider } from '../../contexts/auth-context';

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
