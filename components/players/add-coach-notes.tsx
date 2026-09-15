'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth-context';
import axios from '@/lib/axios';
import { SquarePen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { IoIosStar, IoIosStarOutline } from 'react-icons/io';
import { ScrollArea } from '../ui/scroll-area';
import { Spinner } from '../ui/spinner';
import SelectSession from './select-session';

export function AddCoachNotes({
  player_id,
  onRefresh,
}: {
  player_id: number | undefined;
  onRefresh: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | number>('');
  const [rating, setRating] = useState(0);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);

  const [sessions, setSessions] = useState<{ value: string; label: string }[] | []>([]);

  useEffect(() => {
    if (open) fetchSession();
  }, [open]);

  async function fetchSession() {
    if (!player_id) return;

    setSessionLoading(true);
    try {
      const response = await axios.get(`/admin/players/${player_id}/sessions`);
      const finalData = response.data.map((item: any) => {
        return { value: item.id, label: item.name };
      });
      setSessions(finalData);
    } finally {
      setSessionLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const values = {
      note: formData.get('notes'),
      session_id: selectedSession,
      user_id: user?.id,
      player_id: player_id,
      rating,
    };

    if (!selectedSession || !player_id || !formData.get('notes')) return;

    setLoading(true);
    try {
      await axios.post(`/admin/sessions/${selectedSession}/note`, values);
      await onRefresh();
      setOpen(false);
    } finally {
      setLoading(false);
    }

    setOpen(false);
    // call API here
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <SquarePen className="mr-2" /> Add Note
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogOverlay />
        <DialogContent className="sm:max-w-[550px] bg-[#252525]">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-sm font-normal">Add Coach Note</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <ScrollArea className=" py-1 space-y-4 px-2 h-[50vh] ">
              <div className="grid gap-4">
                {/* Session Select */}
                <div className="grid gap-2">
                  <Label htmlFor="session" className="text-xs text-muted-foreground">
                    Session
                  </Label>
                  {sessionLoading ? (
                    <Spinner />
                  ) : (
                    <SelectSession
                      sessions={sessions}
                      value={selectedSession}
                      onReturn={setSelectedSession}
                      player_id={player_id}
                    />
                  )}
                </div>

                {/* Performance Stars */}
                <div className="grid gap-2">
                  <Label htmlFor="performance" className="text-xs text-muted-foreground">
                    Performance & Rating
                  </Label>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} onClick={() => setRating(i + 1)} className="cursor-pointer">
                        {i < rating ? (
                          <IoIosStar className="text-primary" size={20} />
                        ) : (
                          <IoIosStarOutline className="text-muted-foreground" size={20} />
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="grid gap-2">
                  <Label htmlFor="notes" className="text-xs text-muted-foreground">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Enter performance notes, areas of improvement, and observations..."
                    required
                    className="dark:bg-black min-h-30"
                  />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button disabled={loading} type="submit">
                {loading && <Spinner className="text-black" />}Add Note
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
