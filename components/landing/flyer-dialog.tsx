"use client";

import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import axios from "@/lib/axios";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

type FlyerPage = "home" | "in_house" | "camps_clinics";

type Flyer = {
  id: number;
  image_url: string;
};

export default function FlyerDialog({ page }: { page: FlyerPage }) {
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [failedFlyerIds, setFailedFlyerIds] = useState<Set<number>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function fetchFlyers() {
      try {
        const response = await axios.get<Flyer[]>(`/admin/flyers?page_key=${page}`);
        setFlyers(response.data);
        setFailedFlyerIds(new Set());
        setCurrentIndex(0);
        setOpen(response.data.length > 0);
      } catch {
        setOpen(false);
      }
    }

    fetchFlyers();
  }, [page]);

  const visibleFlyers = flyers.filter((flyer) => !failedFlyerIds.has(flyer.id));
  if (!visibleFlyers.length) return null;

  const safeIndex = Math.min(currentIndex, visibleFlyers.length - 1);
  const currentFlyer = visibleFlyers[safeIndex];
  const hasMultipleFlyers = visibleFlyers.length > 1;
  const showPrevious = () => setCurrentIndex((index) => (index - 1 + visibleFlyers.length) % visibleFlyers.length);
  const showNext = () => setCurrentIndex((index) => (index + 1) % visibleFlyers.length);
  const hideBrokenFlyer = () => {
    setFailedFlyerIds((current) => new Set(current).add(currentFlyer.id));
    setCurrentIndex(0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="h-[min(72vh,620px)] w-[min(94vw,560px)] max-w-none gap-0 overflow-hidden rounded-[18px] border-white/15 bg-[#090909] p-0">
        <DialogTitle className="sr-only">Promotional flyer</DialogTitle>
        <DialogClose asChild>
          <button type="button" className="absolute right-2.5 top-2.5 z-30 rounded-full border border-white/15 bg-black/55 p-2 text-white/90 shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-black/80 hover:text-white" aria-label="Close flyer">
            <X className="size-4" />
          </button>
        </DialogClose>

        <div className="absolute inset-0 scale-110 bg-cover bg-center opacity-20 blur-3xl" style={{ backgroundImage: `url(${currentFlyer.image_url})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/50" />
        <div className="relative flex h-full items-center justify-center p-1.5">
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[13px] bg-black/25 p-0.5 backdrop-blur-sm">
            <Zoom>
              <img src={currentFlyer.image_url} alt={`Flyer ${safeIndex + 1}`} className="max-h-full max-w-full rounded-[10px] object-contain" onError={hideBrokenFlyer} />
            </Zoom>
          </div>
        </div>

        {hasMultipleFlyers && (
          <>
            <button type="button" onClick={showPrevious} className="absolute left-2.5 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/15 bg-black/55 p-2.5 text-white/90 shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-black/80 hover:text-white" aria-label="Previous flyer">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" onClick={showNext} className="absolute right-2.5 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/15 bg-black/55 p-2.5 text-white/90 shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-black/80 hover:text-white" aria-label="Next flyer">
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
