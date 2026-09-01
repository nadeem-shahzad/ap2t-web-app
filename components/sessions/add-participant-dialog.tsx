"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebounce } from "@/hooks/use-debounce";
import axios from "@/lib/axios";
import { joinNames } from "@/lib/functions";
import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import RenderAvatar from "../render-avatar";
import { Badge } from "../ui/badge";
import { Spinner } from "../ui/spinner";

interface AddParticipantDialogProps {
  sessionId: number;
  onSuccess: () => Promise<void>;
  parent_id?: string | null | undefined | number;
  variants?: Array<{ id: number; hour: number; price: number | string }>;
  session_date?: string;
  enrolled_player_ids?: number[];
}

interface Player {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  picture: string;
}

export function AddParticipantDialog({ sessionId, onSuccess, parent_id = null, variants = [], session_date, enrolled_player_ids = [] }: AddParticipantDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [addingVariantId, setAddingVariantId] = useState<number | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    if (open)
      fetchPlayers()
  }, [open]);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      let query = `/admin/players/search`
      if (parent_id) {
        query = `/parent/${parent_id}/players/search`
      }
      const response = await axios.get(query);
      setResults(response.data);
    } finally {
      setLoading(false);
    }
  };

  const addParticipant = async (playerId: number, variantId?: number) => {

    setAddingId(playerId);
    setAddingVariantId(variantId ?? null);
    try {
      await axios.post(`/admin/sessions/${sessionId}/participants`, {
        player_id: playerId,
        ...(variantId ? { variant_id: variantId } : {}),
        ...(session_date ? { session_date } : {}),
      });
      await onSuccess();
      setOpen(false);
      setSelectedPlayer(null);
    } finally {
      setAddingId(null);
      setAddingVariantId(null);
    }
  };

  const filteredData = results.filter((item) => `${item.first_name} ${item.last_name}`?.toLocaleLowerCase()?.includes(debouncedSearch?.toLocaleLowerCase()))

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        setSearch("");
        setResults([]);
        setSelectedPlayer(null);
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Add Participant
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#252525] border-[#3A3A3A] max-w-5xl p-0 gap-0">
        <DialogHeader className="border-b border-[#3A3A3A] p-4">
          <DialogTitle className="text-[#F3F4F6] font-semibold text-lg">
            Add Participant
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-4">
          {selectedPlayer ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-[#E5E7EB]">
                  Select a duration for {selectedPlayer.first_name} {selectedPlayer.last_name}
                </p>
                <p className="text-xs text-[#99A1AF]">Choose the session option to charge.</p>
              </div>
              {variants.map((variant) => (
                <Button
                  key={variant.id}
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => addParticipant(selectedPlayer.id, variant.id)}
                  disabled={addingId === selectedPlayer.id}
                >
                  {addingVariantId === variant.id ? (
                    <Spinner className="text-white" />
                  ) : (
                    <>
                      <span>{variant.hour} {variant.hour === 1 ? "hour" : "hours"}</span>
                      <span>${Number(variant.price).toFixed(2)}</span>
                    </>
                  )}
                </Button>
              ))}
              <Button type="button" variant="ghost" onClick={() => setSelectedPlayer(null)}>
                Back to players
              </Button>
            </div>
          ) : (
            <>
          <div className="space-y-2">
            <Label className="text-sm text-[#99A1AF]">Search Player</Label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : results.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="space-y-2">
                {filteredData.map((player) => (
                  (() => {
                    const isEnrolledForSelectedDate = enrolled_player_ids.includes(player.id);
                    return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#1A1A1A] border border-[#3A3A3A]"
                  >
                    <div className="flex items-center gap-3">
                      <RenderAvatar fallback={joinNames([player.first_name, player.last_name])} img={player?.picture} className="h-8 w-8" />
                      <div>
                        <p className="text-sm font-medium text-[#E5E7EB]">
                          {player.first_name} {player.last_name}
                        </p>
                        <p className="text-xs text-[#99A1AF]">{player.email}</p>
                        {isEnrolledForSelectedDate && <Badge className="mt-1 bg-green-500/10 text-green-400">Enrolled</Badge>}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => variants.length > 0 ? setSelectedPlayer(player) : addParticipant(player.id)}
                      disabled={addingId === player.id || isEnrolledForSelectedDate}
                    >
                      {addingId === player.id ? (
                        <Spinner className="text-white" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                    );
                  })()
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-[#99A1AF]">
              No players found.
            </div>
          )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
