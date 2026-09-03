"use client";
import { CreateSessionDialog } from "@/components/sessions/create-session-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import axios from "@/lib/axios";
import { calcualteRevenu, joinNames } from "@/lib/functions";
import { PrmotionsType } from "@/lib/types";
import {
  Calendar,
  DollarSign,
  ShoppingBag,
  Tag,
  TrendingUp,
  Users
} from "lucide-react";
import moment from "moment";
import NextLink from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { GoDotFill } from "react-icons/go";
import Zoom from "react-medium-image-zoom";

const allFilters = ["All", "Active", "Upcoming", "Archive"]



export default function Page() {
  const [filter, setFilter] = useState<
    "All" | "Active" | "Upcoming" | "Archive"
  >("Active");

  const { user } = useAuth()
  const [data, setData] = useState<PrmotionsType[] | []>([])

  useEffect(() => {
    if (user?.id)
      fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const result = await axios.get("/admin/sessions?promotion=true");
      setData(result.data)
      if (result.data) {
        const mappedSessions = result.data.map((s: any) => ({
          ...s,
          date: moment(new Date(s.date)).format("YYYY-MM-DD"),
          end_date: moment(new Date(s.end_date)).format("YYYY-MM-DD"),
          time: `${s.start_time} - ${s.end_time}`,
          coachName: joinNames([s.coach_first_name, s.coach_last_name]),
          status: s.status,
          total_participants: s?.participants?.length,
          total_revenue: calcualteRevenu(s?.payments),
          save: (Number(s.price || 0) - Number(s.promotion_price || 0)),
          rawData: s
        }));
        setData(mappedSessions);
      }
    } catch (error) {
      console.error("Error fetching sessions", error);
    }
  };


  function calculateSessionStats(sessions: any[]) {
    const today = moment();

    return sessions.reduce(
      (acc, session) => {
        if (
          session.apply_promotion &&
          session.promotion_end
        ) {
          const promoEnd = moment(new Date(session.promotion_end));

          if (today.isSameOrBefore(promoEnd, "day")) {
            acc.total_active += 1;
          }
        }


        if (session.status?.toLowerCase() === "upcoming") {
          acc.total_upcoming += 1;
        }


        acc.total_participants += Array.isArray(session.participants)
          ? session.participants.length
          : 0;


        if (Array.isArray(session.payments)) {
          acc.total_revenue += session.payments
            .filter((p: any) => p.status?.toLowerCase() === "paid")
            .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
        }

        return acc;
      },
      {
        total_active: 0,
        total_participants: 0,
        total_revenue: 0,
        total_upcoming: 0
      }
    );
  }


  const stats = calculateSessionStats(data);

  const localData = [
    {
      Icon: <Tag />,
      title: "Active Promotions",
      description: stats.total_active,
      type: "active",
      going: "active",
    },
    {
      Icon: <Users />,
      title: "Total Sign-ups",
      description: stats.total_participants,
      type: "info",
      going: "active",
    },
    {
      Icon: <DollarSign />,
      title: "Total Revenue",
      description: `$${stats.total_revenue}`,
      type: "success",
      going: "danger",
    },
    {
      Icon: <Calendar />,
      title: "Upcoming",
      description: stats.total_upcoming,
      type: "other",
      going: "active",
    },
  ];

  const filteredData = data.filter((item) => {
    const today = moment();

    if (filter === "All") return true;

    if (filter === "Active") {

      return item.apply_promotion && today.isSameOrBefore(moment(item.promotion_end), "day");
    }

    if (filter === "Upcoming") {
      return item.status?.toLowerCase() === "upcoming";
    }

    if (filter === "Archive") {
      return (
        item.status?.toLowerCase() === "completed" ||
        item.status?.toLowerCase() === "cancelled" ||
        (item.apply_promotion && today.isAfter(moment(item.promotion_end), "day"))
      );
    }

    return true;
  });




  return (
    <div className="flex flex-col w-full gap-4">
      <Header>
        <div className="flex flex-wrap gap-4">
          {/* <Button variant={"outline"} className="gap-2 text-sm">
            <RefreshCcw /> Sync with Square
          </Button> */}

          <CreateSessionDialog onRefresh={fetchData} promotion={true} />
        </div>
      </Header>



      <div className="flex justify-between gap-4 flex-wrap">
        {localData.map((item: any, index) => (
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



      <Card className="p-0">
        <CardContent className="flex justify-between gap-4 flex-wrap items-center p-4">
          <div className="flex gap-4 flex-wrap items-center">
            <p className="text-muted-foreground">Filter by status:</p>

            <div className="flex gap-4">
              {allFilters.map((item) => (
                <Button
                  key={item}
                  variant={filter === item ? "default" : "outline"}
                  size="sm"
                  className={
                    filter === item
                      ? "font-medium"
                      : "font-normal text-muted-foreground border-muted-foreground"
                  }
                  onClick={() => setFilter(item as typeof filter)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-info-text/32 bg-info-bg p-2 flex items-center gap-2">
            <GoDotFill className="text-active-text" />
            <h1 className="text-info-text">Live Sync with Square</h1>
          </div>
        </CardContent>
      </Card>



      <div className="flex flex-wrap gap-4">
        {filteredData.map((item, i) => (
          <Card key={i} className="w-full sm:w-[380px] p-0 overflow-hidden">
            <div className="relative">
              <Zoom>
                <img
                  src={item.image || "/footballkick.jpg"}
                  alt={item.name}
                  onError={(event) => { event.currentTarget.src = "/footballkick.jpg"; }}
                  className="w-full cursor-zoom-in object-cover"
                />
              </Zoom>


              <Badge className="absolute top-3 left-3 bg-active-text text-white font-normal">
                {item?.status?.charAt(0)?.toUpperCase() + item?.status?.slice(1)}
              </Badge>

              {item?.show_storefront &&

                <Badge className="absolute top-3 right-3  text-black flex gap-1 ">
                  <ShoppingBag className="h-3 w-3" /> Live on Storefront
                </Badge>
              }
            </div>
            <CardContent className="px-4 space-y-4">

              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-white">
                  {item.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-success-text" />
                <span className="text-xl font-semibold">{item.promotion_price}</span>
                <span className="text-sm line-through text-muted-foreground">{item.price}</span>
                <Badge className="bg-active-bg text-active-text rounded-md">Save ${item.save}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1 bg-[#1A1A1A] border border-border rounded-xl p-3">

                  <div className="flex gap-2 items-center">
                    <Calendar size={12} className="text-muted-foreground" />
                    <div className="text-xs text-muted-foreground">Start Date</div>

                  </div>
                  <div className="text-sm text-white">{item.date}</div>
                </div>



                <div className="space-y-1 bg-[#1A1A1A] border border-border rounded-xl p-3">

                  <div className="flex gap-2 items-center">
                    <Calendar size={12} className="text-muted-foreground" />
                    <div className="text-xs text-muted-foreground">End Date</div>

                  </div>
                  <div className="text-sm text-white">{item.end_date}</div>
                </div>

              </div>

              <div className="grid grid-cols-2 gap-2">

                <div className="space-y-1 bg-[#1A1A1A] border border-border rounded-xl p-3">

                  <div className="flex gap-2 items-center">
                    <Users size={12} className="text-muted-foreground" />
                    <div className="text-xs text-muted-foreground">Sign-ups</div>

                  </div>
                  <div className="text-sm text-white">{item?.total_participants}</div>
                </div>



                <div className="space-y-1 bg-[#1A1A1A] border border-border rounded-xl p-3">

                  <div className="flex gap-2 items-center">
                    <TrendingUp size={12} className="text-muted-foreground" />
                    <div className="text-xs text-muted-foreground">Revenue</div>

                  </div>
                  <div className="text-sm text-white">{item.total_revenue}</div>
                </div>
              </div>


              {/* <div className="flex items-center justify-between bg-info-bg border border-info-text/32 rounded-lg px-3 h-12">
                <div className="flex items-center gap-2">
                  <ExternalLink size={16} className="text-info-text" />
                  <span className="text-info-text text-sm">Square Checkout</span>
                </div>

                <Button size="sm" variant="link" className="text-info-text">
                  View Link
                </Button>
              </div> */}

              <div className="flex items-center justify-between bg-success-bg border border-success-text/32 rounded-lg px-3 h-12 text-success-text text-sm">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={16} />
                  <span >{item?.show_storefront ? "Visible" : "Not visible"} on Storefront</span>
                </div>
                <span>Users can signup</span>
              </div>

              <Separator />



              <div className="flex gap-2 mb-4 w-full">
                <NextLink href={`/portal/admin/promotions/${item.id}`} className="w-full" >
                  <Button variant="outline" className="w-full">
                    <Users /> View Detail
                  </Button>
                </NextLink>
              </div>


            </CardContent>

          </Card>
        ))}
      </div>
    </div>
  );
}


const Header = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex w-full gap-4 justify-between flex-wrap items-center">
      <div className="space-y-1">
        <p className="text-xl">Promotions Management</p>
        <span className="text-xs text-muted-foreground flex items-center">
          <span>Create and manage promotional offers - Auto-syncs</span>
        </span>
      </div>

      {children}
    </div>
  );
};
