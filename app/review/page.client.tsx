'use client';

import { useState } from 'react';
import { Spinner } from '@/components/ui/spinner';

interface ReviewFormProps {
  token: any;
  isValid: boolean;
  error?: string;
}

export default function ReviewForm({ token, isValid, error: initialError }: ReviewFormProps) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    name: '',
    designation: '',
    rating: 0,
  });

  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(initialError || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      setError('Invalid, expired, or already used link.');
      return;
    }

    if (form.rating === 0) {
      setError('Please select a rating.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/testimonials/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...form, token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit the review.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <div className="bg-[#454545] p-8 rounded-2xl text-center">
          <h1 className="text-2xl font-semibold mb-2">Thank you!</h1>
          <p className="text-[#a3a3a3]">Your review has been submitted. You can close this page.</p>
        </div>
      </div>
    );
  }
  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <div className="bg-[#454545] p-8 rounded-2xl text-center">
          <h1 className="text-2xl font-semibold mb-2">Invalid Link</h1>
          <p className="text-[#a3a3a3]">{error || 'This review link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-[#2a2a2a] rounded-2xl p-6 shadow-xl text-white"
      >
        <h2 className="text-lg font-medium mb-1">Leave a Review</h2>
        <p className="text-xs text-[#888] mb-5">Share your experience with us</p>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-900/30 border border-red-700 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="text-xs text-[#bbb] block mb-1">Title</label>
          <input
            type="text"
            required
            className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm outline-none"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="mb-4">
          <label className="text-xs text-[#bbb] block mb-1">Description</label>
          <textarea
            required
            className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm outline-none resize-y min-h-[90px]"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-[#bbb] block mb-1">Your Name</label>
            <input
              type="text"
              required
              className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-[#bbb] block mb-1">Designation</label>
            <input
              type="text"
              placeholder="e.g. Athlete, Parent"
              className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm outline-none"
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="text-xs text-[#bbb] block mb-2">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setForm({ ...form, rating: star })}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                className="text-2xl"
              >
                <span
                  className={(hover || form.rating) >= star ? 'text-[#c8f020]' : 'text-[#3a3a3a]'}
                >
                  ★
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-[#c8f020] text-[#111] font-semibold rounded-lg px-5 py-2 text-sm disabled:opacity-70"
          >
            {loading && <Spinner className="text-black h-5 w-5" />}
            Submit Review
          </button>
        </div>
      </form>
    </div>
  );
}
