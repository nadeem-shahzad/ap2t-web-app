import axios from '@/lib/axios';
import { Payment } from '@/lib/types';
import { DialogClose } from '@radix-ui/react-dialog';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Spinner } from '../ui/spinner';

type DiscountDialogProps = {
  data: Payment | null;
  onRefresh: () => Promise<void>;
  original: string;
};

export function DiscountDialog({ original, data, onRefresh }: DiscountDialogProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [discountPrice, setDiscountPrice] = useState('');
  async function handleSubmit() {
    if (!data?.id || !discountPrice) {
      toast.error('Please enter discounted price');
      return;
    }

    const isValidNumber = /^\d+(\.\d+)?$/.test(discountPrice);

    if (!isValidNumber) {
      toast.error('Enter a valid number ');
      return;
    }

    setLoading(true);
    try {
      await axios.put(`/admin/payments`, {
        id: data.id,
        amount: Number(discountPrice),
        original_price: Number(original || 0),
      });

      await onRefresh();
      handleClose(false);
    } finally {
      setLoading(false);
    }
  }

  function handleClose(val: boolean) {
    setOpen(val);
    setDiscountPrice('');
  }

  return (
    <>
      <Button size={'sm'} variant={'outline'} onClick={() => setOpen(true)}>
        Apply discount
      </Button>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="bg-[#252525] border border-border p-0">
          <DialogHeader className="border-b border-border p-4">
            <DialogTitle className="text-lg font-semibold text-[#F3F4F6]">
              Apply Discount
            </DialogTitle>
            <p className="text-sm text-ghost-text">Enter a new discounted price for this payment</p>
          </DialogHeader>

          <div className="px-6 py-2 space-y-4">
            {/* 🔹 Discount Input */}
            <div className="space-y-2">
              <Label className="text-sm text-[#99A1AF]">Discounted Price</Label>
              <Input
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="Enter new discounted price..."
              />
            </div>
          </div>

          {/* 🔹 Footer */}
          <div className="p-2 space-y-1 border-t border-[#3A3A3A]">
            <div className="flex gap-4">
              <DialogClose className="text-[12px] font-medium tracking-wider leading-none h-8 px-4 py-2 text-white border-2 border-border rounded-md hover:opacity-70 cursor-pointer flex flex-1 items-center justify-center">
                Cancel
              </DialogClose>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-other-text text-white flex-1"
              >
                {loading && <Spinner className="text-white" />}
                Apply Discount
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
