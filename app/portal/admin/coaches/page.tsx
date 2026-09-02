"use client"

import CardStatus from "@/components/card-status";
import CreateCoach from "@/components/coach/CreateCoach";
import InputWithIcon from "@/components/input-with-icon";
import getInitials from "@/components/parents/get-initials";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/auth-context";
import { useDebounce } from "@/hooks/use-debounce";
import axios from "@/lib/axios";
import { joinNames } from "@/lib/functions";
import { CoachCardNamesType, coachinfoType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Calendar, CheckCircle, Eye, Target, TrendingUp, User } from "lucide-react";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";

const CoachCardNames: CoachCardNamesType = { totalSessions: "Total Sessions", completed: "Completed", upComing: "Upcoming", players: "Players" }

type ApiCoach = {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_no?: string;
  status?: string;
  notifications?: string;
  profile?: { specialities?: string[] };
  total_sessions?: string;
  completed_sessions?: string;
  upcoming_sessions?: string;
  player_count?: string;
  average_rating?: string;
}

export default function Page() {
  const { user } = useAuth()
  const [coaches, setCoaches] = useState<{ data: coachinfoType[], stats: { total_active_coaches: string, total_coaches: string, total_players: string, total_sessions: string } }>()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive">("active")
  const debouncedSearch = useDebounce(search, 300);
  const localData = [
    {
      Icon: <User />,
      title: "Total Coaches",
      description: coaches?.stats?.total_coaches,
      type: "success",
      going: "active",
    },
    {
      Icon: <CheckCircle />,
      title: "Active Coaches",
      description: coaches?.stats?.total_active_coaches,
      type: "active",
      going: "active",
    },
    {
      Icon: <Calendar />,
      title: "Total Sessions",
      description: coaches?.stats?.total_sessions,
      type: "info",
      going: "info",
    },
    {
      Icon: <Target />,
      title: "Total Players",
      description: coaches?.stats?.total_players,
      type: "other",
      going: "active",
    },
  ];
  useEffect((() => {

    if (user?.id)
      fetchData()
  }), [user?.id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const result = await axios.get("/admin/users?role=coach")
      const mappedCoaches = result?.data?.data?.map((coach: ApiCoach) => (
        {
          name: joinNames([coach.first_name, coach.last_name]),
          email: coach.email,
          phoneNo: coach.phone_no,
          status: coach.status,
          notification: coach.notifications || "0",
          specialities: coach?.profile?.specialities || [],
          totalSessions: coach.total_sessions || "0",
          completed: coach.completed_sessions || "0",
          upComing: coach.upcoming_sessions || "0",
          players: coach.player_count || "0",
          avgRating: coach?.average_rating || "0",
          id: coach.id
        }
      ))
      setCoaches({ stats: result.data?.stats, data: mappedCoaches })
    } catch (error) {
      console.error("Error fetching coaches:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = coaches?.data?.filter((item) => {
    const text = `${item.name} ${item.email}`.toLowerCase();
    const searchWords = debouncedSearch
      ?.toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const matchesSearch = !searchWords?.length || searchWords.every((word: string) => text.includes(word));
    const matchesStatus = item.status?.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });


  return (
    <div className="flex flex-col w-full gap-4">
      <Header>
        <div className="flex flex-wrap gap-4">
          <Link href={"/portal/admin/coaches/stats"}>
            <Button>
              Open Stats
            </Button>
          </Link>
          <CreateCoach onRefresh={async () => {
            await fetchData()
          }} />
        </div>
      </Header>


      <div className="flex justify-between gap-4 flex-wrap">
        {localData.map((item, index) => (
          <Card
            key={index}
            className="rounded-[10px] bg-[#252525] border-[#3A3A3A] flex-1"
          >
            <CardContent className="space-y-2">
              <div className="flex gap-4 items-center">
                <div
                  className={`rounded-[8px] flex w-10 h-10 items-center justify-center bg-${item.type}-bg text-${item.type}-text`}
                >
                  {item.Icon}
                </div>
                <p className="text-[#B0B0B0]">{item.title}</p>
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="font-semibold text-2xl">{item.description}</h1>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex w-full flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <InputWithIcon value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by coach..." />
        </div>
        <Select value={statusFilter} onValueChange={(value: "active" | "inactive") => setStatusFilter(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Coach status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active Coaches</SelectItem>
            <SelectItem value="inactive">Disabled Coaches</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData?.map((coach) => {
            return (
              <Card className="bg-[#252525]" key={coach.id}>
                <CardHeader className="flex justify-between">
                  <div className="flex gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={""} />
                      <AvatarFallback className="bg-primary text-black">
                        {getInitials(coach.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0">
                      <span className="text-[#F3F4F6] text-sm">{coach.name}</span>
                      <p className="text-muted-foreground text-xs">{coach.email}</p>
                      <p className="text-muted-foreground ">{coach.phoneNo}</p>
                    </div>
                  </div>
                  <div className="gap-2 flex flex-col items-end">
                    <CardStatus value={coach?.status} />
                    {/* 
                    <Badge className={` bg-warning-bg text-warning-text border-warning-text/32 leading-none py-1`}>
                      <Bell />  <span >{coach.notification} new</span>
                    </Badge> */}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <h1 className="text-sm text-[#99A1AF]">Specialties</h1>
                    <div className="flex gap-1 flex-wrap">
                      {coach.specialities && coach.specialities.length > 0 ? (
                        coach.specialities.map((s, idx) => {
                          return (
                            <div key={`${s}-${idx}`} className="py-2 px-3 rounded-lg bg-[#1A1A1A] border border-border text-xs leading-none text-[#D1D5DC]">{s}</div>
                          )
                        })
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No specialties assigned</p>
                      )}

                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {["totalSessions", "completed", "upComing", "players"].map((item) => (
                      <div key={item} className="bg-[#1A1A1A] border border-border space-y-1 px-4 py-2 rounded-lg">
                        <div className="text-muted-foreground items-center flex gap-2">
                          <CheckCircle size={16} />
                          <p className="text-sm">{CoachCardNames[item as keyof CoachCardNamesType]}</p>
                        </div>
                        <h1 className="text-[#F3F4F6]">{coach[item as keyof coachinfoType]}</h1>
                      </div>
                    ))}


                  </div>
                  <div className="bg-[#1A1A1A] flex justify-between border border-border rounded-[10px] p-4">
                    <div className="flex gap-2 items-center">
                      <TrendingUp className="text-primary" size={16} />
                      <h1 className="text-sm text-muted-foreground">Avg Rating</h1>
                    </div>
                    <div className="flex gap-2 items-center">
                      <h1 className="text-muted-foreground">{coach.avgRating}</h1>

                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, index) => {
                          const rating = Math.floor(Number(coach.avgRating));

                          return (
                            <div
                              key={index}
                              className={cn(
                                index < rating
                                  ? "bg-primary"
                                  : "bg-[#3A3A3A]", "h-2 w-2 rounded-full")
                              }
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <Link href={`/portal/admin/coaches/${coach.id}`}>
                    <Button className="w-full"><Eye /> View Schedule & Manage</Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

const Header = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex w-full gap-4 justify-between flex-wrap items-center">
      <div className="space-y-1">
        <p className="text-xl">Coaches Management</p>
        <span className="text-xs text-muted-foreground flex items-center">
          <span>Manage coach schedules, availability, and performance</span>
        </span>
      </div>

      {children}
    </div>
  );
};









export const coachinfo = [
  {
    id: 1,
    name: "Coach Martinez",
    email: "martinez@ap2t.com",
    phoneNo: "(555) 123-4567",
    status: "active",
    notification: "3",
    specialities: ["Basketball", "Strength Training"],
    totalSessions: "145",
    completed: "132",
    upComing: "13",
    players: "28",
    avgRating: "4.8",
  },
  {
    id: 2,
    name: "Coach Martinez",
    email: "martinez@ap2t.com",
    phoneNo: "(555) 123-4567",
    status: "active",
    notification: "3",
    specialities: ["Basketball", "Strength Training"],
    totalSessions: "145",
    completed: "132",
    upComing: "13",
    players: "28",
    avgRating: "4.8",
  },
  {
    id: 3,
    name: "Coach Martinez",
    email: "martinez@ap2t.com",
    phoneNo: "(555) 123-4567",
    status: "active",
    notification: "3",
    specialities: ["Basketball", "Strength Training"],
    totalSessions: "145",
    completed: "132",
    upComing: "13",
    players: "28",
    avgRating: "4.8",
  },
  {
    id: 4,
    name: "Coach Martinez",
    email: "martinez@ap2t.com",
    phoneNo: "(555) 123-4567",
    status: "active",
    notification: "3",
    specialities: ["Basketball", "Strength Training"],
    totalSessions: "145",
    completed: "132",
    upComing: "13",
    players: "28",
    avgRating: "4.8",
  },
  {
    id: 5,
    name: "Coach Martinez",
    email: "martinez@ap2t.com",
    phoneNo: "(555) 123-4567",
    status: "On Break",
    notification: "3",
    specialities: ["Basketball", "Strength Training"],
    totalSessions: "145",
    completed: "132",
    upComing: "13",
    players: "28",
    avgRating: "4.8",
  },
];
