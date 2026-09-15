'use client';

import axios from '@/lib/axios';
import { PaymentItem } from '@/lib/types';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

type EmailDialogProps = {
  data: PaymentItem;
  open: boolean;
  onOpenChange: (val: boolean) => void;
};

export function CustomEmailDialog({ open, onOpenChange, data }: EmailDialogProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSendEmail = async () => {
    if (!subject || !message) {
      return;
    }
    setLoading(true);
    try {
      await axios.post('/admin/payments/email', { id: data?.player_user_id, subject, message });
      handleClose(false);
      toast.success('Email sent');
    } catch (error) {
      console.error(error);
      alert('Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  function handleClose(val: boolean) {
    onOpenChange(val);
    setSubject('');
    setMessage('');
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Custom Email</DialogTitle>
          <DialogDescription>Send a custom email for payment reminders</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-4">
          <Input
            placeholder="Enter email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <Textarea
            placeholder="Write your message here..."
            rows={6}
            value={message}
            className="min-h-[200px]"
            onChange={(e) => setMessage(e.target.value)}
          />

          {/* Actions */}
          <div className="flex justify-end">
            <Button disabled={loading} onClick={handleSendEmail}>
              {loading ? 'Sending' : 'Send Email'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
