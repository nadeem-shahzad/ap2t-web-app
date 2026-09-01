"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/auth-context";
import axios from "@/lib/axios";
import { joinNames } from "@/lib/functions";
import { PrmotionsType } from "@/lib/types";
import {
    Calendar,
    DollarSign,
    Users
} from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";


export default function Page() {

    const { user } = useAuth()
    const [data, setData] = useState<PrmotionsType[] | []>([])
    const [loading, setLoading] = useState(false)


    useEffect(() => {
        if (user?.id)
            fetchData();
    }, [user]);

    const fetchData = async () => {
        setLoading(true)
        try {
            const result = await axios.get(`/player/${user?.id}/promotions?type=camp`);
            setData(result.data)
            if (result.data) {
                const mappedSessions = result.data.map((s: any) => ({
                    ...s,
                    date: moment(new Date(s.date)).format("YYYY-MM-DD"),
                    end_date: moment(new Date(s.end_date)).format("YYYY-MM-DD"),
                    time: `${s.start_time} - ${s.end_time}`,
                    coachName: joinNames([s.coach_first_name, s.coach_last_name]),
                    status: s.status,
                    save: (Number(s.price || 0) - Number(s.promotion_price || 0)),
                }));
                setData(mappedSessions);
            }
        } catch (error) {
            console.error("Error fetching sessions", error);
        } finally {
            setLoading(false)
        }
    };



    return (
        <div className="flex flex-col w-full gap-4">
            <Header />

            {loading ?
                <div className="flex flex-1 items-center justify-center mt-10">
                    <Spinner />
                </div> :
                <div className="flex flex-wrap gap-4">
                    {data.map((item) => (
                        <RenderEachItem key={item.id} item={item} fetchData={fetchData} />
                    ))}
                </div>
            }
        </div>
    );
}

const RenderEachItem = ({ item, fetchData }: { item: PrmotionsType, fetchData: () => Promise<void> }) => {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [selectedDate, setSelectedDate] = useState(item.date)
    const isEnrolledForSelectedDate = item.is_daily_payment
        ? item.enrolled_dates?.includes(selectedDate) ?? false
        : item.enrolled;

    async function handleEnroll(item: PrmotionsType) {

        if (!user?.id || !item?.id) return

        setLoading(true)
        try {
            await axios.post(`/admin/sessions/${item.id}/participants`, {
                player_id: user?.id,
                ...(item.is_daily_payment ? { session_date: selectedDate } : {}),
            });
            await fetchData();

        } finally {
            setLoading(false);
        }
    }
    return (
        <Card className="w-full sm:w-[380px] p-0 overflow-hidden">
            <div className="relative">
                <img
                    src={item.image}
                    alt={item.name}

                    className="w-full object-cover"
                />


                <Badge className="absolute top-3 left-3 bg-active-text text-white font-normal">
                    {item?.status?.charAt(0)?.toUpperCase() + item?.status?.slice(1)}
                </Badge>

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


                <Separator />

                {item.is_daily_payment && (
                    <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Booking Date</div>
                        <input
                            type="date"
                            value={selectedDate}
                            min={item.date}
                            max={item.end_date || item.date}
                            onChange={(event) => setSelectedDate(event.target.value)}
                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                        />
                    </div>
                )}



                <div className="flex gap-2 mb-4 w-full">
                    {isEnrolledForSelectedDate ? <Badge className="bg-green-500/10 text-green-400 w-full">Enrolled</Badge> :
                        <Button disabled={loading} onClick={() => handleEnroll(item)} variant="outline" className="w-full">
                            {loading && <Spinner />} <Users /> Participate
                        </Button>
                    }
                </div>

            </CardContent>

        </Card>
    )
}


const Header = () => {
    return (
        <div className="flex w-full gap-4 justify-between flex-wrap items-center">
            <div className="space-y-1">
                <p className="text-xl">Camps</p>
            </div>
        </div>
    );
};
