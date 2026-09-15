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
import { Edit } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { RequiredStar } from '../required-star';
import { Field, FieldDescription, FieldError, FieldLabel } from '../ui/field';

const coachSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),

  phone_no: z.string().min(6, 'Phone is required'),

  // zip_code: z.string().min(3, "Zip code required"),

  career_start: z.date({
    error: 'Career Start Date is required',
  }),

  bio: z.string().min(2, 'Biography required'),
  specialities: z.array(z.string()).default([]).optional(),
  certifications: z.array(z.string()).default([]).optional(),
});
type coachSchemaValues = z.infer<typeof coachSchema>;

const EditCoachProfile = ({
  id,
  data,
  onRefresh,
}: {
  id: string | undefined;
  data: any;
  onRefresh: () => Promise<void>;
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [specialityInput, setSpecialityInput] = useState('');
  const [certificationInput, setCertificationInput] = useState('');

  const form = useForm<coachSchemaValues>({
    resolver: zodResolver(coachSchema),
    defaultValues: {
      specialities: [],
      certifications: [],
      bio: '',
      career_start: undefined,
      first_name: '',
      last_name: '',
      phone_no: '',
      // zip_code: "",
    },
  });

  const specialities = form.watch('specialities');
  const certifications = form.watch('certifications');

  useEffect(() => {
    if (data) {
      form.reset({
        first_name: data?.first_name,
        last_name: data?.last_name,
        phone_no: data?.phone_no,
        career_start: new Date(data?.profile?.career_start),
        bio: data?.profile?.bio,
        specialities: data?.profile?.specialities || [],
        certifications: data?.profile?.certifications || [],
        // zip_code: data?.zip_code || "",
      });
    }
  }, [data]);

  const changeCoach = async (values: coachSchemaValues) => {
    setLoading(true);
    try {
      await axios.put(`/user`, {
        id: id,
        first_name: values?.first_name,
        last_name: values?.last_name,
        phone_no: values?.phone_no,
        // zip_code: values?.zip_code,
      });
      await axios.put(`/admin/coaches/${id}`, {
        id: id,
        career_start: values?.career_start,
        bio: values?.bio,
        specialities: values?.specialities,
        certifications: values?.certifications,
      });

      await onRefresh();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSpeciality = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const trimmed = specialityInput.trim();
    if (!trimmed) return;
    if (!specialities) return;
    if (!specialities.includes(trimmed)) {
      form.setValue('specialities', [...specialities, trimmed], {
        shouldValidate: true,
      });
    }

    setSpecialityInput('');
  };

  const handleRemoveSpeciality = (tag: string) => {
    if (!specialities) return;
    form.setValue(
      'specialities',
      specialities.filter((t) => t !== tag),
      { shouldValidate: true }
    );
  };

  const handleAddCertification = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const trimmed = certificationInput.trim();
    if (!trimmed) return;
    if (!certifications) return;
    if (!certifications.includes(trimmed)) {
      form.setValue('certifications', [...certifications, trimmed], {
        shouldValidate: true,
      });
    }

    setCertificationInput('');
  };

  const handleRemoveCertification = (tag: string) => {
    if (!certifications) return;
    form.setValue(
      'certifications',
      certifications.filter((t) => t !== tag),
      { shouldValidate: true }
    );
  };

  return (
    <>
      <Button onClick={() => setOpen(!open)} variant={'outline'}>
        {' '}
        <Edit /> Edit Profile
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#252525] border border-[#3A3A3A] sm:max-w-4xl p-0">
          <DialogHeader className="border-b border-[#3A3A3A] p-4">
            <DialogTitle className="text-[#F3F4F6] font-semibold text-lg">
              Edit Coach Profile
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(changeCoach)} className="">
            <ScrollArea className="h-[calc(100vh-250px)] py-1 space-y-4 px-2 ">
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
                            placeholder="+1XXXXXXX"
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
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-[#99A1AF]">Specialities</Label>
                  <div className="flex flex-col gap-2 border rounded-md p-2">
                    <Input
                      placeholder="Type speciality and press Enter"
                      value={specialityInput}
                      onChange={(e) => setSpecialityInput(e.target.value)}
                      onKeyDown={handleAddSpeciality}
                    />
                    <div className="flex flex-wrap gap-2">
                      {specialities?.map((tag, idx) => (
                        <span
                          key={idx}
                          className="flex items-center gap-1 bg-primary text-black px-2 py-1 rounded-md text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveSpeciality(tag)}
                            className="ml-1 text-xs hover:text-red-300"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-[#99A1AF]">Certifications</Label>
                  <div className="flex flex-col gap-2 border rounded-md p-2">
                    <Input
                      placeholder="Type certification and press Enter"
                      value={certificationInput}
                      onChange={(e) => setCertificationInput(e.target.value)}
                      onKeyDown={handleAddCertification}
                    />
                    <div className="flex flex-wrap gap-2">
                      {certifications?.map((tag, idx) => (
                        <span
                          key={idx}
                          className="flex items-center gap-1 bg-primary text-black px-2 py-1 rounded-md text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveCertification(tag)}
                            className="ml-1 text-xs hover:text-red-300"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <Separator />
            <div className="p-4">
              <div className="flex gap-4 flex-wrap">
                <DialogClose className="text-[13px] font-medium leading-none px-4 py-2 bg-black text-white border-border rounded-md hover:opacity-70 cursor-pointer flex flex-1 items-center justify-center">
                  Cancel
                </DialogClose>
                <Button disabled={loading} type="submit" className="flex-1 text-[13px]">
                  {loading && <Spinner className="text-black" />} Save
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditCoachProfile;
