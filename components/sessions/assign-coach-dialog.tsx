"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebounce } from "@/hooks/use-debounce";
import axios from "@/lib/axios";
import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Spinner } from "../ui/spinner";

type Coach = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  picture: string;
  schedule: any
};
interface AssignCoachDialogProps {
  onSelect: (coach: {
    id: number; first_name: string; last_name: string; schedule: any
  }) => void;
  placeholder?: string
}




export function AssignCoachDialog({ onSelect, placeholder = "Select Coach" }: AssignCoachDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedSeach = useDebounce(search, 300)

  useEffect(() => {
    if (open)
      fetchCoaches()
  }, [open]);

  const fetchCoaches = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/admin/coaches/search?active_only=true`
      );
      setResults(response.data);
    } finally {
      setLoading(false);
    }
  };

  async function handleSelect(coachInformation: { id: number, first_name: string, last_name: string, schedule: any }) {
    if (!coachInformation?.id) return
    onSelect(coachInformation)
    setOpen(false);
  }
  const filteredData = results.filter((item) => `${item.first_name} ${item.last_name}`?.toLocaleLowerCase()?.includes(debouncedSeach?.toLocaleLowerCase()))

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) {
          setSearch("");
          setResults([]);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus />
          {placeholder}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#252525] border-[#3A3A3A] max-w-5xl p-0 gap-0">
        <DialogHeader className="border-b border-[#3A3A3A] p-4">
          <DialogTitle className="text-[#F3F4F6] font-semibold text-lg">
            Select Coach
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-[#99A1AF]">Search Coach</Label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                placeholder="Search by name..."
                className="pl-9 !bg-[#1A1A1A] !border-[#3A3A3A] !text-[#E5E7EB]"
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
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-2">
                {filteredData.map((coach) => (
                  <div
                    key={coach.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#1A1A1A] border border-[#3A3A3A] cursor-pointer hover:bg-[#2A2A2A]"
                    onClick={() => {

                      handleSelect({
                        id: coach.id,
                        first_name: coach.first_name,
                        last_name: coach.last_name,
                        schedule: coach?.schedule
                      })


                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={coach.picture} />
                        <AvatarFallback>
                          {coach.first_name[0]}
                          {coach.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-[#E5E7EB]">
                          {coach.first_name} {coach.last_name}
                        </p>
                        <p className="text-xs text-[#99A1AF]">{coach.email}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-[#99A1AF]">
              No coaches found.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
