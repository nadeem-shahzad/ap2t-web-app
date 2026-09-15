'use client';

import axios from '@/lib/axios';
import { SquareSavedCard } from '@/lib/types';
import { useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import SquareCard, { SquareCardRef } from './square-card';

export default function PaymentMethodSteps({
  id,
  data,
  onRefresh,
}: {
  id: string | number | undefined;
  data?: SquareSavedCard;
  onRefresh: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const squareRef = useRef<SquareCardRef>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleCard() {
    if (!squareRef.current) return;

    try {
      setLoading(true);
      const tokendata = await squareRef.current.tokenize();
      if (data?.id) {
        await axios.put(`/user/card`, {
          token: tokendata.token,
          cardholder: tokendata.cardholderName,
          id,
          card_id: data?.id,
          customer_id: data?.customerId,
        });
      } else {
        await axios.post(`/user/card`, {
          token: tokendata.token,
          cardholder: tokendata.cardholderName,
          id,
        });
      }
      await onRefresh();
      setOpen(false);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCard() {
    try {
      setDeleteLoading(true);
      await axios.put(`/user`, {
        id: id,
        cardholder_name: '',
        square_card_id: '',
        card_active: false,
      });
      await onRefresh();
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-background p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="font-semibold uppercase text-sm text-muted-foreground">
            {data?.cardBrand || 'NA'}
          </div>

          <div className="font-mono text-sm tracking-widest">
            {data?.last4 ? `•••• •••• •••• ${data.last4}` : `•••• •••• •••• ••••`}
          </div>

          <div className="text-sm text-muted-foreground">
            {data?.expMonth || '00'}/{data?.expYear || '00'}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {data?.id && (
            <Button
              disabled={deleteLoading}
              onClick={() => handleDeleteCard()}
              variant="destructive"
              size="sm"
            >
              {deleteLoading && <Spinner className="text-white" />} Delete
            </Button>
          )}
          <Button onClick={() => setOpen(!open)} variant="outline" size="sm">
            {data?.id ? 'Update' : 'Add'}
          </Button>
        </div>
      </div>

      {open && (
        <>
          <SquareCard ref={squareRef} className="space-y-2" />
          <Button disabled={loading} onClick={handleCard} className="w-full">
            {loading && <Spinner className="text-black" />}
            {data?.id ? 'Update' : 'Add'}
          </Button>
        </>
      )}
    </>
  );
}
