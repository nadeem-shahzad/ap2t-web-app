'use client';
import { auth } from '@/lib/firebase';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import { Button } from '../ui/button';
import { Field, FieldError } from '../ui/field';
import { Input } from '../ui/input';
import { Spinner } from '../ui/spinner';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address'),

  password: z.string().min(1, 'Password is required'),
});

type LoginSchemaValues = z.infer<typeof loginSchema>;

export default function LoginForm({ onClickSignup }: { onClickSignup: () => void }) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (values: LoginSchemaValues) => {
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast.success('Login successfull');
    } catch (error: any) {
      toast.error(error?.message);
    } finally {
      setLoading(false);
    }
  };

  const form = useForm<LoginSchemaValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex flex-col justify-center items-center gap-5">
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="Email"
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="relative w-full">
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  autoComplete="off"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>

        <Link href="#">Forgot Password?</Link>
      </div>

      <div className="flex flex-col gap-2">
        <Button type="submit" className="bg-primary text-secondary w-full" disabled={loading}>
          {loading && <Spinner className="text-black" />}
          Log In
        </Button>

        <Button
          type="button"
          onClick={() => onClickSignup()}
          className="bg-secondary text-white w-full"
        >
          Sign up
        </Button>
      </div>
    </form>
  );
}
