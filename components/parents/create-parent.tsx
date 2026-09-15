'use client';
import axios from '@/lib/axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { RequiredStar } from '../required-star';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Field, FieldError } from '../ui/field';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Spinner } from '../ui/spinner';
import { Textarea } from '../ui/textarea';

type EditParentsProps = {
  visible: boolean;
  onChange: (open: boolean) => void;
};

const parentSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),

  email: z
    .string()
    .email('Invalid email')
    .transform((val) => val.trim().toLowerCase()),

  phone_no: z.string().min(6, 'Phone is required'),

  zip_code: z.string().min(3, 'Zip code required'),

  location: z.string().min(2, 'Location required'),
});
type parentSchemaValues = z.infer<typeof parentSchema>;

export function CreateParent({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<parentSchemaValues>({
    resolver: zodResolver(parentSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone_no: '',
      location: '',
      zip_code: '',
    },
  });

  const onSubmit = async (values: parentSchemaValues) => {
    setLoading(true);
    try {
      const result = await axios.post('/user', {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone_no: values.phone_no,
        location: values.location,
        zip_code: values.zip_code,
        role: 'parent',
      });
      toast.success('Parent Created Successfully');
      await onRefresh();
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error('Error while creating parent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Add Parent
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[550px] bg-[#252525]">
          <form onSubmit={form.handleSubmit(onSubmit, (errors) => console.log('errors', errors))}>
            <DialogHeader className=" pb-4">
              <DialogTitle className="text-sm font-normal">Add New Parent</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4 border-t">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-2">
                  <Controller
                    name="first_name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <Label className="text-sm text-[#99A1AF]">
                          First Name <RequiredStar />
                        </Label>
                        <Input
                          {...field}
                          id={field.name}
                          aria-invalid={fieldState.invalid}
                          placeholder="john"
                          autoComplete="off"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Controller
                    name="last_name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <Label className="text-sm text-[#99A1AF]">
                          Last Name <RequiredStar />
                        </Label>
                        <Input
                          {...field}
                          id={field.name}
                          aria-invalid={fieldState.invalid}
                          placeholder="martinz"
                          autoComplete="off"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <Label className="text-sm text-[#99A1AF]">
                        Email <RequiredStar />
                      </Label>
                      <Input
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        placeholder="martinz@example.com"
                        autoComplete="off"
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <div className="grid gap-2">
                <Controller
                  name="phone_no"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <Label className="text-sm text-[#99A1AF]">
                        phone <RequiredStar />
                      </Label>
                      <Input
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        placeholder="+1XXXXXX"
                        autoComplete="off"
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <div className="grid gap-2">
                <Controller
                  name="zip_code"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <Label className="text-sm text-[#99A1AF]">
                        Zip Code <RequiredStar />
                      </Label>
                      <Input
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        placeholder="1038"
                        autoComplete="off"
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <div className="grid gap-2">
                <Controller
                  name="location"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <Label className="text-sm text-[#99A1AF]">Address</Label>
                      <Textarea
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        autoComplete="off"
                        className="min-h-[170px]"
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading && <Spinner className="text-black" />}Add Parent
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
