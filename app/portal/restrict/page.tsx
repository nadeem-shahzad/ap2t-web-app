'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { handleLogout } from '@/lib/logout';
import { AlertCircle } from 'lucide-react';

export default function AccountInactivePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex h-screen w-screen items-center justify-center px-4">
      <div className="max-w-md w-full rounded-xl border border-red-700 bg-gray-800 p-8 text-center shadow-lg">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-900/20">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        {/* Title */}
        <h2 className="mb-2 text-2xl font-bold text-red-500">Account Inactive</h2>

        {/* Message */}
        <p className="mb-6 text-gray-300">
          Your account has been marked as inactive. To restore access, please contact your
          administrator.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-4">
          <Button
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={async () => await handleLogout()}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
