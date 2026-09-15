'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDebounce } from '@/hooks/use-debounce';
import axios from '@/lib/axios';
import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Spinner } from '../ui/spinner';

interface LinkChildrenDialogProps {
  parent_id: number | null | undefined | string;
  onSuccess: () => Promise<void>;
}

interface Player {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  picture: string;
}

export function LinkChildrenDialog({ parent_id, onSuccess }: LinkChildrenDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [cont, setCont] = useState<null | number>(null);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (open) fetchPlayers();
  }, [open]);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/admin/players/search`);
      setResults(response.data);
    } finally {
      setLoading(false);
    }
  };

  const addChildren = async (playerId: number | null) => {
    setAddingId(playerId);

    try {
      const response = await axios.get(
        `/admin/players/${playerId}/parent/check?parent=${parent_id}`
      );
      if (response.data?.continueToSave) {
        await continueToSave(playerId);
      } else {
        setCont(playerId);
      }
    } finally {
      setAddingId(null);
    }
  };

  async function continueToSave(playerId: number | null) {
    setAddingId(playerId);

    try {
      await axios.post(`/admin/players/${playerId}/parent`, {
        parent_id: parent_id,
      });
      await onSuccess();
      setOpen(false);
    } finally {
      setAddingId(null);
    }
  }

  const filteredData = results.filter((item) =>
    `${item.first_name} ${item.last_name}`
      ?.toLocaleLowerCase()
      ?.includes(debouncedSearch?.toLocaleLowerCase())
  );

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            setSearch('');
            setResults([]);
          }
        }}
      >
        <DialogTrigger asChild>
          <Button>
            <Plus />
            Link Children
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-[#252525] border-[#3A3A3A] max-w-5xl p-0 gap-0">
          <DialogHeader className="border-b border-[#3A3A3A] p-4">
            <DialogTitle className="text-[#F3F4F6] font-semibold text-lg">
              Link Chlidren
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-[#99A1AF]">Search Children</Label>
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
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#1A1A1A] border border-[#3A3A3A]"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={player.picture} />
                          <AvatarFallback>
                            {player.first_name[0]}
                            {player.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-[#E5E7EB]">
                            {player.first_name} {player.last_name}
                          </p>
                          <p className="text-xs text-[#99A1AF]">{player.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => addChildren(player.id)}
                        disabled={addingId === player.id}
                      >
                        {addingId === player.id ? <Spinner /> : <Plus className="h-4 w-4" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-[#99A1AF]">No children found.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!cont}>
        {/* <AlertDialogTrigger >{children}</AlertDialogTrigger> */}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Parent Already exists</AlertDialogTitle>
            <AlertDialogDescription>
              This player already has a parent linked to it. Would you still like to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setAddingId(null);
                setCont(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                continueToSave(cont);
                setCont(null);
              }}
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
