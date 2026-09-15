'use client';

import axios from '@/lib/axios';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Spinner } from '../ui/spinner';
import { MessageSquareDot, Send } from 'lucide-react';

export default function PrivateSessionInquiryDialog({
  email,
  firstName,
  lastName,
}: {
  email: string | undefined;
  firstName: string | undefined;
  lastName: string | undefined;
}) {
  const [localEmail, setLocalEmail] = useState('');
  const [localFirstName, setLocalFirstName] = useState('');
  const [localLastName, setLocalLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (email) setLocalEmail(email);
    if (firstName) setLocalFirstName(firstName);
    if (lastName) setLocalLastName(lastName);
  }, [email, firstName, lastName]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      phone: formData.get('phone'),
      email: localEmail,
      message: formData.get('message'),
    };

    try {
      await axios.post(`/support?type=inquiry`, data);
      toast.success('Inquiry successfully sent..');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Send /> Private Training Inquiry
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Private Training Inquiry</DialogTitle>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                value={localFirstName}
                onChange={(e) => setLocalFirstName(e.target.value)}
                name="firstName"
                required
                type="text"
                placeholder="First Name"
                className="w-full rounded bg-neutral-900 border border-neutral-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                value={localLastName}
                onChange={(e) => setLocalLastName(e.target.value)}
                name="lastName"
                required
                type="text"
                placeholder="Last Name"
                className="w-full rounded bg-neutral-900 border border-neutral-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <input
              name="email"
              required
              type="email"
              value={localEmail}
              onChange={(e) => setLocalEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full rounded bg-neutral-900 border border-neutral-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <textarea
              name="message"
              required
              rows={5}
              placeholder="Your Inquiry"
              className="w-full rounded bg-neutral-900 border border-neutral-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Spinner className="text-white" />} Send Message
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
