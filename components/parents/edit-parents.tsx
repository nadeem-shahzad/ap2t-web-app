'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from '@/lib/axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { SquarePen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import { RequiredStar } from '../required-star';
import { Field, FieldError } from '../ui/field';
import { Spinner } from '../ui/spinner';
import { Textarea } from '../ui/textarea';

type EditParentsProps = {
  parent_id: number | null;
  data: {
    first_name: string;
    last_name: string;
    phone_no: string | null;
    location: string | null;
    zip_code: string | null;
  };
  onRefresh: () => Promise<void>;
};

const parentSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),

  phone_no: z.string().min(6, 'Phone is required').nullable(),

  zip_code: z.string().min(3, 'Zip code required').nullable(),

  location: z.string().min(2, 'Location required').nullable(),
});
type parentSchemaValues = z.infer<typeof parentSchema>;

export function EditParents({ parent_id, data, onRefresh }: EditParentsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) {
      form.reset(data);
    }
  }, [parent_id, data]);

  const form = useForm<parentSchemaValues>({
    resolver: zodResolver(parentSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone_no: '',
      location: '',
      zip_code: '',
    },
  });

  async function onSubmit(values: parentSchemaValues) {
    setLoading(true);
    try {
      await axios.put(`/user`, {
        id: parent_id,
        ...values,
      });
      toast.success('Profile updated');
      await onRefresh();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant={'outline'} className="bg-black dark:bg-black" onClick={() => setOpen(true)}>
        <SquarePen /> Edit Details
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[550px] bg-[#252525]">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader className=" pb-4">
              <DialogTitle className="text-sm font-normal">Edit Parent Details</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4 border-t">
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
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
                <div className="grid gap-2">
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
                  name="phone_no"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <Label className="text-sm text-[#99A1AF]">
                        phone <RequiredStar />
                      </Label>
                      <Input
                        value={field?.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        // {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        placeholder="+1XXXXXXX"
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
                        value={field?.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
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
                        value={field?.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
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
              <Button disabled={loading} type="submit">
                {loading && <Spinner className="text-black" />}Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
