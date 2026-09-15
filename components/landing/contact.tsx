'use client';

import CoreTeam from '@/components/landing/home-page/core-team';
import GradientIcon from '@/components/landing/icon-container';
import { Button } from '@/components/ui/button';
import { Clock, Mail, Phone, Pin } from 'lucide-react';

export default function ContactPage() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    alert('Form submitted');
  }

  return (
    <>
      <div
        className="relative h-[60vh] w-full flex items-center justify-center"
        style={{
          backgroundImage: "url('/images/contact/hero.JPG')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Optional overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Centered content */}
        <h1 className="relative z-10 text-white text-3xl sm:text-5xl font-bold">Contact Us</h1>
      </div>

      <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* LEFT SIDE – FORM */}
          <div className="bg-[#141414] p-8">
            <p className="text-sm uppercase tracking-wide text-gray-400">
              Get in <span className="text-primary">Touch</span>
            </p>

            <h2 className="mt-2 text-3xl font-bold text-white">
              We're here to support your <span className="text-primary">Soccer Training Needs</span>
            </h2>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  required
                  type="text"
                  placeholder="First Name"
                  className="w-full rounded bg-neutral-900 border border-neutral-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  required
                  type="text"
                  placeholder="Last Name"
                  className="w-full rounded bg-neutral-900 border border-neutral-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <input
                required
                type="tel"
                placeholder="Phone Number"
                className="w-full rounded bg-neutral-900 border border-neutral-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <input
                required
                type="email"
                placeholder="Email Address"
                className="w-full rounded bg-neutral-900 border border-neutral-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <textarea
                required
                rows={5}
                placeholder="Your Message"
                className="w-full rounded bg-neutral-900 border border-neutral-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <Button type="submit" className="w-full">
                Send Message
              </Button>
            </form>
          </div>

          {/* RIGHT SIDE – MAP + INFO */}
          <div className="space-y-6">
            {/* Google Map */}
            <div className="overflow-hidden rounded-xl border border-neutral-800">
              <iframe
                title="Google Map"
                src="https://www.google.com/maps?q=New%20York&t=&z=13&ie=UTF8&iwloc=&output=embed"
                className="w-full h-70"
                loading="lazy"
              />
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Call Us */}
              <div className="rounded-xl border border-neutral-800 bg-[#141414] p-5">
                <GradientIcon className="mb-2">
                  <Phone className="text-primary" />
                </GradientIcon>
                <h4 className="font-semibold text-white">Call Us</h4>
                <p className="mt-2 text-sm text-gray-400">732-515-9300</p>
              </div>

              {/* Visit Office */}
              <div className="rounded-xl border border-neutral-800 bg-[#141414] p-5">
                <GradientIcon className="mb-2">
                  <Pin className="text-primary" />
                </GradientIcon>
                <h4 className="font-semibold text-white">Visit Office</h4>
                <p className="mt-2 text-sm text-gray-400">302 High St Metuchen, NJ 08840</p>
              </div>

              {/* Office Hours */}
              <div className="rounded-xl border border-neutral-800 bg-[#141414] p-5">
                <GradientIcon className="mb-2">
                  <Clock className="text-primary" />
                </GradientIcon>
                <h4 className="font-semibold text-white">Office Hours</h4>
                <p className="mt-2 text-sm text-gray-400">Mon – Sat: 8:00 AM – 9:00 PM</p>
                <p className="mt-2 text-sm text-gray-400">Sunday: Closed</p>
              </div>

              {/* Email Us */}
              <div className="rounded-xl border border-neutral-800 bg-[#141414] p-5">
                <GradientIcon className="mb-2">
                  <Mail className="text-primary" />
                </GradientIcon>
                <h4 className="font-semibold text-white">Email Us</h4>
                <p className="mt-2 text-sm text-gray-400">rjallen@ap2t.net</p>
                <p className="mt-2 text-sm text-gray-400">mke@ap2t.net</p>
                <p className="mt-2 text-sm text-gray-400">matt@ap2t.net</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <CoreTeam />
      </section>
    </>
  );
}
