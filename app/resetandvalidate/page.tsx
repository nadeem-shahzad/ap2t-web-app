'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth } from '@/lib/firebase';
import { confirmPasswordReset } from 'firebase/auth';
import { CircleCheck, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function Page() {
  const [page, setPage] = useState<string | null>('');
  const search = useSearchParams();

  useEffect(() => {
    const mode = search.get('mode');
    setPage(mode);
  }, [search]);

  return page === 'resetPassword' ? (
    <PasswordResetPage />
  ) : (
    <div className="w-full flex items-center justify-center py-24">
      <h1 className="font-formula1-regular text-primary text-4xl">Invalid or broken link</h1>
    </div>
  );
}

const PasswordResetPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validation, setValidation] = useState([false, false]);
  const [matched, setMatched] = useState(false);
  const [loading, setLoading] = useState(false);
  const search = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (password.length > 7) {
      if (validation[0] == false)
        setValidation((prevState) => {
          const newState = [...prevState];
          newState[0] = true;
          return newState;
        });
    } else {
      if (validation[0] == true)
        setValidation((prevState) => {
          const newState = [...prevState];
          newState[0] = false;
          return newState;
        });
    }

    if (!/[0-9]/.test(password)) {
      if (validation[1] == true)
        setValidation((prevState) => {
          const newState = [...prevState];
          newState[1] = false;
          return newState;
        });
    } else {
      if (validation[1] == false)
        setValidation((prevState) => {
          const newState = [...prevState];
          newState[1] = true;
          return newState;
        });
    }

    if (password == confirmPassword) {
      if (matched == false) setMatched(true);
    } else {
      if (matched == true) setMatched(false);
    }
  }, [password, confirmPassword]);

  async function handlePasswordCreation(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Password do not match');
      return;
    }
    const oobCode = search.get('oobCode');
    if (!oobCode) return;

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setLoading(false);
      toast.success('Password created successfully, sign in to continue');
    } catch (e: any) {
      setLoading(false);
      toast.error(e?.message || 'Error in password creation');
    }
    // setShowSuccessfull(true);
  }

  return (
    <section className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary">Reset</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back! Reset your password to access your account.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border bg-background p-6 shadow-sm">
          <form onSubmit={handlePasswordCreation} className="space-y-4">
            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmpassword">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmpassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Validation */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CircleCheck
                  size={16}
                  className={validation[0] ? 'text-primary' : 'text-muted-foreground'}
                />
                <span className="text-sm">At least 8 characters</span>
              </div>

              <div className="flex items-center gap-2">
                <CircleCheck
                  size={16}
                  className={validation[1] ? 'text-primary' : 'text-muted-foreground'}
                />
                <span className="text-sm">Contains one number</span>
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'RESETTING...' : 'RESET PASSWORD'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
