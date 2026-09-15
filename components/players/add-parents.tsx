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
import { Spinner } from '../ui/spinner';

interface AddParentDialogProps {
  playerId: number | undefined;
  onSuccess: () => Promise<void>;
}

interface parent {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  picture: string;
}

export function AddParentDialog({ playerId, onSuccess }: AddParentDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<parent[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (open) fetchParents();
  }, [open]);

  const fetchParents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/admin/parents/search`);
      setResults(response.data);
    } finally {
      setLoading(false);
    }
  };

  const addParents = async (parent_id: number | null) => {
    setAddingId(parent_id);
    try {
      await axios.post(`/admin/players/${playerId}/parent`, {
        parent_id: parent_id,
      });
    } finally {
      onSuccess();
      setOpen(false);
      setAddingId(null);
    }
  };

  const filteredData = results.filter((item) =>
    `${item.first_name} ${item.last_name}`
      ?.toLocaleLowerCase()
      ?.includes(debouncedSearch?.toLocaleLowerCase())
  );

  return (
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
          Link Parent
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#252525] border-[#3A3A3A] max-w-5xl p-0 gap-0">
        <DialogHeader className="border-b border-[#3A3A3A] p-4">
          <DialogTitle className="text-[#F3F4F6] font-semibold text-lg">Link Parent</DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-[#99A1AF]">Search Parents</Label>
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
                {filteredData.map((parent) => (
                  <div
                    key={parent.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#1A1A1A] border border-[#3A3A3A]"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={parent.picture} />
                        <AvatarFallback>
                          {parent.first_name[0]}
                          {parent.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-[#E5E7EB]">
                          {parent.first_name} {parent.last_name}
                        </p>
                        <p className="text-xs text-[#99A1AF]">{parent.email}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => addParents(parent.id)}
                      disabled={addingId === parent.id}
                    >
                      {addingId === parent.id ? (
                        <Spinner className="text-black" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-[#99A1AF]">No parent found.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
