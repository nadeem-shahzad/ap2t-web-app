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
import { Textarea } from '@/components/ui/textarea';
import axios from '@/lib/axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import AppCalendar from '../app-calendar';
import { RequiredStar } from '../required-star';
import { Field, FieldError } from '../ui/field';
import { Spinner } from '../ui/spinner';
import SelectPosition from './select-position';
import SelectSkill from './select-skill';

type CreatePlayerProps = {
  parent_id?: number | null | undefined | string;
  onRefresh?: () => Promise<void>;
  placeholder?: string;
};

const playerSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),

  email: z
    .string()
    .email('Invalid email')
    .transform((val) => val.trim().toLowerCase()),

  phone_no: z.string().min(6, 'Phone is required'),

  zip_code: z.string().min(3, 'Zip code required'),

  location: z.string().min(2, 'Location required'),

  dob: z.date({
    error: 'Date of birth is required',
  }),

  position: z.string().min(1, 'Select a position'),

  skillLevel: z.string().min(1, 'Select skill level'),

  medicalNotes: z.string().optional(),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

export function CreatePlayer({
  parent_id = null,
  onRefresh = async () => {},
  placeholder = 'Add Player',
}: CreatePlayerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone_no: '',
      dob: undefined,
      zip_code: '',
      location: '',
      position: '',
      skillLevel: '',
      medicalNotes: '',
    },
  });

  const onSubmit = async (values: PlayerFormValues) => {
    try {
      setLoading(true);

      await axios.post('/user', {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone_no: values.phone_no,
        birth_date: values.dob,
        zip_code: values.zip_code,
        location: values.location,
        role: 'player',
        parent_id,
        position: values.position,
        skill_level: values.skillLevel,
        medical_notes: values.medicalNotes,
      });
      toast.success('Player created!');
      await onRefresh();
      form.reset();
      setOpen(false);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="" /> {placeholder}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[550px] bg-[#252525]">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader className="pb-4">
              <DialogTitle className="text-sm font-normal">Add Player Information</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4 border-t">
              <div className="grid grid-cols-2 gap-4">
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
                          placeholder="doe"
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
                        email <RequiredStar />
                      </Label>
                      <Input
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        placeholder="example@ap2t.com"
                        autoComplete="off"
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                          placeholder="2873"
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
                        <Label className="text-sm text-[#99A1AF]">
                          Location <RequiredStar />
                        </Label>
                        <Input
                          {...field}
                          id={field.name}
                          aria-invalid={fieldState.invalid}
                          placeholder="LA ,USA"
                          autoComplete="off"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Controller
                    name="dob"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <Label className="text-sm text-[#99A1AF]">
                          Date Of Birth <RequiredStar />
                        </Label>

                        <AppCalendar date={field.value} onChange={field.onChange} />
                        {fieldState.invalid && (
                          <p className="text-xs text-red-500">{fieldState?.error?.message}</p>
                        )}
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
                          Phone <RequiredStar />
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
                    name="position"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <Label className="text-sm text-[#99A1AF]">
                          Position <RequiredStar />
                        </Label>

                        <SelectPosition
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select position"
                        />
                        {fieldState.invalid && (
                          <p className="text-xs text-red-500">{fieldState?.error?.message}</p>
                        )}
                      </Field>
                    )}
                  />
                </div>

                <div className="grid gap-2">
                  <Controller
                    name="skillLevel"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <Label className="text-sm text-[#99A1AF]">
                          Skill Level <RequiredStar />
                        </Label>

                        <SelectSkill
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select skill"
                        />

                        {fieldState.invalid && (
                          <p className="text-xs text-red-500">{fieldState?.error?.message}</p>
                        )}
                      </Field>
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Controller
                  name="medicalNotes"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <Label className="text-sm text-[#99A1AF]">
                        Medical notes <RequiredStar />
                      </Label>
                      <Textarea
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        placeholder=""
                        autoComplete="off"
                        className="min-h-[100px]"
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
                {' '}
                {loading && <Spinner className="text-black" />}Add Player
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
