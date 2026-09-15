import axios from '@/lib/axios';
import { PaymentItem } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { DialogClose } from '@radix-ui/react-dialog';
import { OctagonAlert } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import z from 'zod';
import { RequiredStar } from '../required-star';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Field, FieldError } from '../ui/field';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Spinner } from '../ui/spinner';
import { Textarea } from '../ui/textarea';
import SelectCompCategory from './select-comp-cateegory';

type CompedDialogProps = {
  data: PaymentItem;
  onRefresh: () => Promise<void>;
  open: boolean;
  onOpenChange: (val: boolean) => void;
};

const compedSchema = z.object({
  comped_category: z.string().trim().min(1, 'Category is required'),

  comped_reason: z.string().trim().min(1, 'Reason is required'),
});
type compedSchemaValues = z.infer<typeof compedSchema>;

export function CompedDialog({ open, onOpenChange, data, onRefresh }: CompedDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpdateStatus(values: compedSchemaValues) {
    if (!data?.id) return;

    setLoading(true);
    try {
      await axios.put(`/admin/payments`, {
        id: data.id,
        comped_category: values.comped_category,
        comped_reason: values.comped_reason,
        status: 'comped',
        method: 'Nil',
        paid_at: new Date(),
      });
      await onRefresh();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  const form = useForm<compedSchemaValues>({
    resolver: zodResolver(compedSchema),
    defaultValues: {
      comped_category: '',
      comped_reason: '',
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#252525] border border-border p-0">
        <DialogHeader className="border-b border-border p-4">
          <DialogTitle className="text-lg font-semibold text-[#F3F4F6]">
            Mark Payment as Comped
          </DialogTitle>
          <p className="text-sm text-ghost-text">This action is for accounting purposes</p>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleUpdateStatus)}>
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="px-6 py-2 space-y-4">
              <div className="bg-[#1A1A1A] border border-border rounded-[10px] space-y-2 p-6">
                <div className="flex justify-between">
                  <p className="text-ghost-text">Parent:</p>
                  <h1 className="text-[#E5E7EB]">{data?.parent_name}</h1>
                </div>
                <div className="flex justify-between">
                  <p className="text-ghost-text">Player:</p>
                  <h1 className="text-[#E5E7EB]">{data?.player_name}</h1>
                </div>
                <div className="flex justify-between">
                  <p className="text-ghost-text">Session:</p>
                  <h1 className="text-[#E5E7EB]">{data?.session_name}</h1>
                </div>
                <div className="flex justify-between">
                  <p className="text-ghost-text">Amount:</p>
                  <h1 className="text-[#E5E7EB]">${data?.amount}</h1>
                </div>
              </div>
              <div className="bg-[#FF69001A] border border-[#FF690033] rounded-[10px] flex gap-2 text-warning-text p-4">
                <OctagonAlert className="h-5 w-5" />
                <div className="space-y-1">
                  <h1 className="text-warning-text">Important</h1>
                  <p className="text-sm text-[#D1D5DC]">
                    This will mark the payment as comped. A reason must be provided for accounting
                    records.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Controller
                  name="comped_category"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <Label className="text-sm text-[#99A1AF]">
                        Comp Category <RequiredStar />
                      </Label>
                      <SelectCompCategory value={field.value} onChange={field.onChange} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Controller
                  name="comped_reason"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <Label className="text-sm text-[#99A1AF]">
                        Comp Reason <RequiredStar />
                      </Label>

                      <Textarea
                        value={field.value}
                        onChange={field.onChange}
                        className="min-h-35 "
                        placeholder="Provide a detailed reason for comping this session (required for accounting records)..."
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <p className="text-xs text-ghost-text">
                  This note will be saved to the payment record and included in financial reports.
                </p>
              </div>
            </div>
          </ScrollArea>
          <div className="p-2 space-y-1 border-t border-[#3A3A3A]">
            <div className="flex gap-4">
              <DialogClose className="text-[12px] font-medium tracking-wider leading-none h-8 px-4 py-2 text-white border-2 border-border rounded-md hover:opacity-70 cursor-pointer flex flex-1 items-center justify-center">
                Cancel
              </DialogClose>
              <Button type="submit" disabled={loading} className="bg-other-text text-white flex-1">
                {loading && <Spinner className="text-white" />} Mark as Comped
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
