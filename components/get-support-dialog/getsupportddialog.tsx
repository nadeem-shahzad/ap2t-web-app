'use client';

import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { useEffect, useState } from 'react';
import { Spinner } from '../ui/spinner';
import axios from '@/lib/axios';

export default function GetSupportDialog({ email }: { email: string | undefined }) {
  const [localEmail, setLocalEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (email) setLocalEmail(email);
  }, [email]);

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
      await axios.post(`/support?type=support`, data);
      toast.success('Message sent to support team..');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1 w-full bg-primary rounded-xl p-4">
        <p className="text-xs text-[#282828]">Need Help?</p>
        <p className="text-md text-[#282828]">Contact Support</p>
        <Button className="bg-black text-primary rounded-xl" onClick={() => setOpen(true)}>
          Get Support
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Get Support</DialogTitle>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                name="firstName"
                required
                type="text"
                placeholder="First Name"
                className="w-full rounded bg-neutral-900 border border-neutral-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                name="lastName"
                required
                type="text"
                placeholder="Last Name"
                className="w-full rounded bg-neutral-900 border border-neutral-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <input
              name="phone"
              required
              type="tel"
              placeholder="Phone Number"
              className="w-full rounded bg-neutral-900 border border-neutral-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />

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
              placeholder="Your Message"
              className="w-full rounded bg-neutral-900 border border-neutral-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Spinner className="text-black" />} Send Message
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
