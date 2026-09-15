import axios from '@/lib/axios';
import { PaymentItem } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { DialogClose } from '@radix-ui/react-dialog';
import moment from 'moment';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import z from 'zod';
import { RequiredStar } from '../required-star';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Field, FieldError } from '../ui/field';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Spinner } from '../ui/spinner';

type CompedDialogProps = {
  data: PaymentItem;
  onRefresh: () => Promise<void>;
  open: boolean;
  onOpenChange: (val: boolean) => void;
};

const METHOD_OPTIONS = ['Debit / Credit Card', 'Cash', 'Online'];

const overrideSchema = z.object({
  method: z.string().trim().min(1, 'method is required'),

  transaction_id: z.string().trim().min(1, 'transection id is required'),
});
type overrideSchemaValues = z.infer<typeof overrideSchema>;

export function OverrideDialog({ open, onOpenChange, data, onRefresh }: CompedDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpdateStatus(values: overrideSchemaValues) {
    if (!data?.id) return;

    setLoading(true);
    try {
      await axios.put(`/admin/payments`, {
        id: data.id,
        method: values.method,
        transaction_id: values.transaction_id,
        status: 'paid',
        paid_at: new Date(),
      });
      await onRefresh();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  const form = useForm<overrideSchemaValues>({
    resolver: zodResolver(overrideSchema),
    defaultValues: {
      method: '',
      transaction_id: '',
    },
  });
  const method = form.watch('method');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#252525] border border-border p-0">
        <DialogHeader className="border-b border-border p-4">
          <DialogTitle className="text-lg font-semibold text-[#F3F4F6]">
            Mark Payment as Paid
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
                  <p className="text-ghost-text">Session::</p>
                  <h1 className="text-[#E5E7EB]">{data?.session_name}</h1>
                </div>
                <div className="flex justify-between">
                  <p className="text-ghost-text">Amount:</p>
                  <h1 className="text-[#E5E7EB]">${data?.amount}</h1>
                </div>
              </div>

              <div className="space-y-2">
                <Controller
                  name="method"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <Label className="text-sm text-[#99A1AF]">
                        Method <RequiredStar />
                      </Label>
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          if (v === 'Cash') {
                            form.setValue('transaction_id', moment().valueOf().toString());
                          } else {
                            form.setValue('transaction_id', '');
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          {METHOD_OPTIONS.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Controller
                  name="transaction_id"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <Label className="text-sm text-[#99A1AF]">
                        Transaction Id <RequiredStar />
                      </Label>
                      <Input
                        disabled={method === 'Cash'}
                        value={field.value}
                        onChange={field.onChange}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
            </div>
          </ScrollArea>
          <div className="p-2 space-y-1 border-t border-[#3A3A3A]">
            <div className="flex gap-4">
              <DialogClose className="text-[12px] font-medium tracking-wider leading-none h-8 px-4 py-2 bg-black text-white rounded-md hover:opacity-70 cursor-pointer flex flex-1 items-center justify-center">
                Cancel
              </DialogClose>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Spinner className="text-black" />} Mark as Paid
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
