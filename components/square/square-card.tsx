'use client';

import { DARKMODECARDSTYLE } from '@/lib/constants';
import { GetSquare } from '@/lib/square-creds';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { RequiredStar } from '../required-star';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

declare global {
  interface Window {
    Square: any;
  }
}

export interface SquareCardRef {
  tokenize: () => Promise<{ token: string; cardholderName: string }>;
}

interface SquareCardProps {
  className?: string;
}

const SquareCard = forwardRef<SquareCardRef, SquareCardProps>(({ className }, ref) => {
  const cardRef = useRef<any>(null);
  const initializedRef = useRef(false);
  const [cardholderName, setCardholderName] = useState('');

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (initializedRef.current) return;
      if (!(window as any).Square) return;

      const { error, merchant, location } = await GetSquare();

      if (error) return;

      const payments = (window as any).Square.payments(merchant!, location!);

      const card = await payments.card({
        style: DARKMODECARDSTYLE,
      });

      if (cancelled) return;

      await card.attach('#square-card-container');

      cardRef.current = card;
      initializedRef.current = true;
    };

    init();

    return () => {
      cancelled = true;
      if (cardRef.current) {
        cardRef.current.destroy();
        cardRef.current = null;
        initializedRef.current = false;
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    async tokenize() {
      if (!cardRef.current) {
        throw new Error('Payment form not ready.');
      }

      if (!cardholderName) {
        throw new Error('Cardholder name is missing');
      }

      const result = await cardRef.current.tokenize();

      if (result.status !== 'OK') {
        const errorMsg = result.errors?.[0]?.message || 'Invalid card details';
        throw new Error(errorMsg);
      }

      return { token: result.token, cardholderName: cardholderName };
    },
  }));

  return (
    <div className={className}>
      <Label className="text-sm">
        Cardholder Name <RequiredStar />
      </Label>
      <Input
        type="text"
        placeholder="Joe Smith"
        className="w-full px-4"
        value={cardholderName}
        onChange={(e) => setCardholderName(e.target.value)}
      />

      <div id="square-card-container" className="h-[80px]" />
    </div>
  );
});

SquareCard.displayName = 'SquareCard';

export default SquareCard;
