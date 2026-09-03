"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import axios from "@/lib/axios";
import { ArrowDown, ArrowUp, ImageIcon, Plus, Save, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type FlyerPage = "home" | "in_house" | "camps_clinics";

type Flyer = {
  id: number;
  page: FlyerPage;
  imageUrl: string;
  position: number;
};

type ApiFlyer = {
  id: number;
  page_key: FlyerPage;
  image_url: string;
  position: number;
};

const pageLabels: Record<FlyerPage, string> = {
  home: "Home",
  in_house: "In House",
  camps_clinics: "Camps & Clinics",
};

export default function FlyersPage() {
  const [selectedPage, setSelectedPage] = useState<FlyerPage>("home");
  const [imageUrl, setImageUrl] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const pageFlyers = useMemo(
    () => flyers.filter((flyer) => flyer.page === selectedPage).sort((a, b) => a.position - b.position),
    [flyers, selectedPage],
  );

  async function fetchFlyers() {
    setLoading(true);
    try {
      const response = await axios.get<ApiFlyer[]>(`/admin/flyers?page_key=${selectedPage}`);
      setFlyers(response.data.map((flyer) => ({
        id: flyer.id,
        page: flyer.page_key,
        imageUrl: flyer.image_url,
        position: flyer.position,
      })));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFlyers();
  }, [selectedPage]);

  async function addFlyer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedUrl = imageUrl.trim();
    if (!trimmedUrl || !previewLoaded || previewFailed) {
      toast.error("Enter a working flyer image URL first.");
      return;
    }

    setSavingId(0);
    try {
      await axios.post("/admin/flyers", { page_key: selectedPage, image_url: trimmedUrl });
      setImageUrl("");
      setPreviewFailed(false);
      setPreviewLoaded(false);
      await fetchFlyers();
      toast.success("Flyer added");
    } finally {
      setSavingId(null);
    }
  }

  function updateFlyer(id: number, imageUrl: string) {
    setFlyers((current) => current.map((flyer) => flyer.id === id ? { ...flyer, imageUrl } : flyer));
  }

  async function saveFlyer(id: number) {
    const flyer = flyers.find((item) => item.id === id);
    if (!flyer?.imageUrl.trim()) {
      toast.error("Image URL is required.");
      return;
    }

    setSavingId(id);
    try {
      await axios.put("/admin/flyers", { id, image_url: flyer.imageUrl });
      await fetchFlyers();
      toast.success("Flyer updated");
    } finally {
      setSavingId(null);
    }
  }

  async function removeFlyer(id: number) {
    setSavingId(id);
    try {
      await axios.delete(`/admin/flyers?id=${id}`);
      await fetchFlyers();
      toast.success("Flyer removed");
    } finally {
      setSavingId(null);
    }
  }

  async function moveFlyer(id: number, direction: -1 | 1) {
    const index = pageFlyers.findIndex((flyer) => flyer.id === id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= pageFlyers.length) return;

    const reordered = [...pageFlyers];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    const positions = new Map(reordered.map((flyer, position) => [flyer.id, position + 1]));
    setFlyers((current) => current.map((flyer) => positions.has(flyer.id) ? { ...flyer, position: positions.get(flyer.id)! } : flyer));
    setSavingId(id);
    try {
      await axios.put("/admin/flyers", { flyers: reordered.map((flyer, position) => ({ id: flyer.id, position: position + 1 })) });
      await fetchFlyers();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex w-full gap-4 justify-between flex-wrap items-center">
        <div className="space-y-1">
          <p className="text-xl">Flyers Management</p>
          <span className="text-xs text-muted-foreground flex items-center">
            <span>Choose a page, then add and arrange the flyers visitors will see.</span>
          </span>
        </div>
        <div className="rounded-lg border border-border bg-[#252525] px-3 py-2 text-sm text-muted-foreground">
          {pageFlyers.length} {pageFlyers.length === 1 ? "flyer" : "flyers"} on {pageLabels[selectedPage]}
        </div>
      </div>
     
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(Object.entries(pageLabels) as Array<[FlyerPage, string]>).map(([page, label]) => (
          <Button
            key={page}
            type="button"
            variant={selectedPage === page ? "default" : "outline"}
            className="h-auto justify-start rounded-xl px-5 py-4 text-left"
            onClick={() => setSelectedPage(page)}
          >
            <ImageIcon className="size-5" />
            <span className="flex flex-col items-start">
              <span>{label}</span>
              <span className="text-xs font-normal opacity-70">Manage {label.toLowerCase()} flyers</span>
            </span>
          </Button>
        ))}
      </div>

      <Card className="bg-[#252525]">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={addFlyer} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Label htmlFor="flyer-url">Add a flyer to {pageLabels[selectedPage]}</Label>
                <Input id="flyer-url" value={imageUrl} onChange={(event) => { setImageUrl(event.target.value); setPreviewFailed(false); setPreviewLoaded(false); }} placeholder="Paste an image URL here" />
              </div>
              <Button type="submit" className="mt-auto" disabled={savingId === 0 || !imageUrl.trim() || !previewLoaded || previewFailed}>{savingId === 0 ? <Spinner className="text-black" /> : <Plus />} Add Flyer</Button>
            </div>
            {imageUrl.trim() && (
              <div className="overflow-hidden rounded-lg border border-border bg-[#1A1A1A]">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <span className="text-sm font-medium">Preview</span>
                  <span className={`text-xs ${previewFailed ? "text-destructive" : previewLoaded ? "text-green-500" : "text-muted-foreground"}`}>{previewFailed ? "Image could not be loaded" : previewLoaded ? "Image is ready" : "Checking image URL"}</span>
                </div>
                {previewFailed ? (
                  <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Check that the URL is a publicly accessible image.</div>
                ) : (
                  <div className="flex h-48 items-center justify-center p-3">
                    <img src={imageUrl} alt="New flyer preview" className="h-full max-w-full object-contain" onLoad={() => setPreviewLoaded(true)} onError={() => { setPreviewLoaded(false); setPreviewFailed(true); }} />
                  </div>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-end justify-between px-1">
          <div>
            <h2 className="text-lg font-semibold">{pageLabels[selectedPage]} Flyers</h2>
            <p className="text-sm text-muted-foreground">Order controls affect how these flyers appear on the page.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : pageFlyers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-[#252525] py-16 text-center text-muted-foreground">
            <div className="rounded-full bg-[#1A1A1A] p-3"><ImageIcon className="size-7" /></div>
            <div><p className="font-medium text-foreground">No flyers yet</p><p className="text-sm">Paste an image URL above to add the first flyer.</p></div>
          </div>
        ) : <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pageFlyers.map((flyer, index) => (
            <Card key={flyer.id} className="overflow-hidden bg-[#252525]">
              <div className="relative flex aspect-[4/3] items-center justify-center bg-[#1A1A1A] p-3">
                <img src={flyer.imageUrl} alt={`Flyer ${index + 1}`} className="h-full w-full object-contain" />
                <span className="absolute left-3 top-3 rounded-md bg-black/75 px-2 py-1 text-xs font-medium">#{index + 1}</span>
              </div>
              <CardContent className="space-y-3 p-4">
                <div className="space-y-1">
                  <Label htmlFor={`flyer-${flyer.id}`}>Image URL</Label>
                  <Input id={`flyer-${flyer.id}`} value={flyer.imageUrl} onChange={(event) => updateFlyer(flyer.id, event.target.value)} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1">
                    <Button type="button" size="icon" variant="outline" disabled={savingId === flyer.id || index === 0} onClick={() => moveFlyer(flyer.id, -1)} aria-label="Move flyer up"><ArrowUp /></Button>
                    <Button type="button" size="icon" variant="outline" disabled={savingId === flyer.id || index === pageFlyers.length - 1} onClick={() => moveFlyer(flyer.id, 1)} aria-label="Move flyer down"><ArrowDown /></Button>
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" size="icon" variant="outline" disabled={savingId === flyer.id} onClick={() => saveFlyer(flyer.id)} aria-label="Save flyer"><Save /></Button>
                    <Button type="button" size="icon" variant="destructive" disabled={savingId === flyer.id} onClick={() => removeFlyer(flyer.id)} aria-label="Remove flyer"><Trash2 /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>}
      </div>
    </div>
  );
}
