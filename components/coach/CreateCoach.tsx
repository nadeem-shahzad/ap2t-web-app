import AppCalendar from '@/components/app-calendar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import axios from '@/lib/axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Field, FieldError } from '../ui/field';
import { RequiredStar } from '../required-star';

const coachSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),

  email: z
    .string()
    .email('Invalid email')
    .transform((val) => val.trim().toLowerCase()),

  phone_no: z.string().min(6, 'Phone is required'),

  // zip_code: z.string().min(3, "Zip code required"),

  career_start: z.date({
    error: 'Date of birth is required',
  }),

  bio: z.string().min(2, 'Biography required'),
});
type coachSchemaValues = z.infer<typeof coachSchema>;

const CreateCoach = ({ onRefresh }: { onRefresh: () => Promise<void> }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<coachSchemaValues>({
    resolver: zodResolver(coachSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone_no: '',
      career_start: undefined,
      bio: '',
      // zip_code: "",
    },
  });

  const addCoach = async (values: coachSchemaValues) => {
    setLoading(true);

    try {
      await axios.post('/user', {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone_no: values.phone_no,
        career_start: values.career_start,
        bio: values.bio,
        // zip_code: values.zip_code,
        role: 'coach',
      });

      await onRefresh();
      setOpen(false);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button className="gap-2 text-sm" onClick={() => setOpen(!open)}>
        <Plus /> Add Coach
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#252525] border border-[#3A3A3A] sm:max-w-4xl p-0">
          <DialogHeader className="border-b border-[#3A3A3A] p-4">
            <DialogTitle className="text-[#F3F4F6] font-semibold text-lg">
              Add New Coach
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(addCoach)} className="">
            <ScrollArea className=" py-1 space-y-4 px-2 h-[calc(100vh-250px)]">
              <div className="space-y-2 px-2 pb-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
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
                            placeholder="Coach"
                            autoComplete="off"
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
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
                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-2">
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
                            placeholder="martinz"
                            autoComplete="off"
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </div>

                  {/* <div className="space-y-2">
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
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div> */}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
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
                  <div className="space-y-2">
                    <Controller
                      name="career_start"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <Label className="text-sm text-[#99A1AF]">
                            Career_start <RequiredStar />
                          </Label>

                          <AppCalendar date={field.value} onChange={field.onChange} />
                          {fieldState.invalid && (
                            <p className="text-xs text-red-500">{fieldState?.error?.message}</p>
                          )}
                        </Field>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Controller
                    name="bio"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <Label className="text-sm text-[#99A1AF]">
                          Biography <RequiredStar />
                        </Label>
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
            </ScrollArea>
            <Separator />
            <div className="p-4">
              <div className="flex gap-4 flex-wrap">
                <DialogClose className="text-[13px] font-medium leading-none h-8 px-4 py-2 bg-black text-white border-border rounded-md hover:opacity-70 cursor-pointer flex flex-1 items-center justify-center">
                  Cancel
                </DialogClose>
                <Button disabled={loading} type="submit" className="flex-1 text-[13px]">
                  {loading && <Spinner className="text-black" />} Add Coach
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateCoach;
