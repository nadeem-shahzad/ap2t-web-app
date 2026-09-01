"use client";

import PageTable from "@/components/app-table";
import { useApproval } from "@/components/frontdesk/use-approval";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import axios from "@/lib/axios";
import { FrontDeskActionData } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, CircleCheck, Loader2 } from "lucide-react";
import moment from "moment";
import { useState } from "react";
import { RxCrossCircled } from "react-icons/rx";
import InputWithIcon from "../input-with-icon";


export default function FrontdeskDashboard() {


  const [loadingId, setLoadingId] = useState<number | null>()
  const [loadingType, setLoadingType] = useState<string | null>()
  const { approvals: sessions, loading } = useApproval()
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300);


  const FRONT_DESK_SESSION_COLUMNS: ColumnDef<FrontDeskActionData>[] = [
    {
      accessorKey: "session_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          SESSION NAME
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium text-[#D1D5DC]">
          {row.getValue("session_name")}
        </span>
      ),
    },

    {
      accessorKey: "player_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          PLAYER NAME
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium text-[#D1D5DC]">
          {row.getValue("player_name")}
        </span>
      ),
    },



    {
      accessorKey: "session_date",
      header: "BOOKING DATE",
      cell: ({ row }) => {
        const bookingDate = row.getValue("session_date") as string | null;
        return <span className="text-[#D1D5DC]">{bookingDate ? moment(bookingDate).format("YYYY-MM-DD") : "One-time"}</span>;
      },
    },
    {
      id: "date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          DATE & TIME
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => {
        return (
          <div className="leading-tight">
            <div className="text-[#D1D5DC]">{moment(new Date(row.original.date)).format("YYYY-MM-DD")} - {moment(new Date(row.original.end_date)).format("YYYY-MM-DD")}</div>
            <div className="text-xs text-[#9CA3AF]">{row.original.start_time} - {row.original.end_time}</div>
          </div>
        )
      }

    },




    {
      accessorKey: "referal_code",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Referal Code
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium text-[#D1D5DC]">
          {row.getValue("referal_code")}
        </span>
      ),
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          PRICE
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium text-[#D1D5DC]">
          $ {row.getValue("price")}
        </span>
      ),
    },


    {
      accessorKey: "Message",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          MESSAGE
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => {
        const action = row.original.action;
        const status = row.original?.status
        if (action === "approval" && status === 'waiting') {
          return (
            <span className="font-medium text-[#D1D5DC]">
              Requires Approval
            </span>
          );
        }
        else if (action === "approval" && status !== 'waiting') {
          return (
            <span className="font-medium text-green-500">
              Done
            </span>
          );
        }
        else if (action === "cash" && status === 'waiting') {
          return (
            <span className="font-medium text-[#D1D5DC]">
              Requires Cash Confirmation
            </span>
          );
        }
        else if (action === "cash" && status !== 'waiting') {
          return (
            <span className="font-medium text-green-500">
              Done
            </span>
          );
        }
      }
    },

    {
      id: "actions",
      header: () => <div className="text-[#99A1AF] text-[12px] tracking-wider dark:hover:bg-transparent dark:hover:text-white/50">ACTIONS</div>,

      cell: ({ row }) => {
        const { action, status, id } = row.original;

        const isAcceptedLoading = loadingId === id && loadingType === "accepted";
        const isRejectedLoading = loadingId === id && loadingType === "rejected";

        if (status === "accepted" || status === "rejected") {
          const isAccepted = status === "accepted";

          return (
            <p
              className={`text-sm flex gap-2 items-center ${isAccepted ? "text-primary" : "text-danger-text"
                }`}
            >
              {isAccepted ? (
                <CircleCheck className="w-4 h-4" />
              ) : (
                <RxCrossCircled className="w-4 h-4" />
              )}
              {status?.charAt(0)?.toUpperCase() + status?.slice(1)}
            </p>
          );
        }
        const config = {
          approval: {
            acceptText: "Approve",
            rejectText: "Disapprove",
            acceptType: "approval",
          },
          cash: {
            acceptText: "Received",
            rejectText: "Not Received",
            acceptType: "cash",
          },
        };

        const current = config[action];
        if (!current) return null;

        return (
          <div className="flex gap-2">
            <Button
              disabled={loadingId === id}
              onClick={() => handleSubmit(id, "accepted", current.acceptType)}
            >
              {isAcceptedLoading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                current.acceptText
              )}
            </Button>

            <Button
              disabled={loadingId === id}
              variant="destructive"
              onClick={() => handleSubmit(id, "rejected")}
            >
              {isRejectedLoading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                current.rejectText
              )}
            </Button>
          </div>
        );
      }
    }



  ];


  async function handleSubmit(id: number, status: "accepted" | "rejected", type: string = "") {
    try {
      setLoadingId(id);
      setLoadingType(status);

      await axios.put(`/front-desk?type=${type}`, { id, status });

    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setLoadingId(null);
      setLoadingType(null);
    }
  }


  const filteredData = sessions.filter((item: any) => {
    const text = `${item?.session_name} ${item?.player_name} `.toLowerCase();

    const searchWords = debouncedSearch
      ?.toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    const matchesSearch =
      !searchWords?.length ||
      searchWords.every((word: string) => text.includes(word));



    return matchesSearch
  });

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex w-full gap-4 justify-between flex-wrap items-center">
        <div className="space-y-1">
          <p className="text-xl">Front Desk Sessions</p>
          <span className="text-xs text-muted-foreground flex items-center">
            <span>Manage check-ins and approvals</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-[14px] bg-#252525 border border-[#3A3A3A] p-4 bg-[#252525]">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="w-full">
            <InputWithIcon value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or session..." />
          </div>
        </div>
      </div>

      <PageTable
        loading={loading}
        columns={FRONT_DESK_SESSION_COLUMNS}
        data={filteredData}
        onRowClick={() => { }}
      />
    </div>
  );
}

