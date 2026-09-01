"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { SessionProps } from "@/lib/types";
import { Scrollbar } from "@radix-ui/react-scroll-area";
import { ChevronLeft, ChevronRight } from "lucide-react";
import moment from "moment";
import { useMemo, useState } from "react";
import { GoDotFill } from "react-icons/go";
import CardStatus from "../card-status";
import ParticipateButton from "../calendar/participate-button";
import RenderAvatar from "../render-avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Spinner } from "../ui/spinner";

type ReserveComponentProps = {
    player_id?: string | null | undefined,
    onSuccess: () => Promise<void>,
    loading?: boolean,
    sessions: SessionProps[]
}

export default function ReserveComponent({ sessions, onSuccess, loading, player_id }: ReserveComponentProps) {
    const isMobile = useIsMobile()

    const [selectedDate, setSelectedDate] = useState(
        moment().format("YYYY-MM-DD")
    );

    const [startDate, setStartDate] = useState(() =>
        moment().subtract(3, "days").format("YYYY-MM-DD")
    );

    const weekDates = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) =>
            moment(startDate).add(i, "days").format("YYYY-MM-DD")
        );
    }, [startDate]);

    const selectedSessions = useMemo(() => {
        return sessions.filter((s) => {
            const selected = moment(selectedDate).startOf("day");

            const start = moment(s.date).startOf("day");
            const end = s.end_date
                ? moment(s.end_date).startOf("day")
                : start;

            return (
                selected.isSame(start, "day") ||
                selected.isBetween(start, end, "day", "[]")
            );
        });
    }, [sessions, selectedDate]);

    const handlePrev = () => {
        setStartDate((prev) =>
            moment(prev).subtract(1, "day").format("YYYY-MM-DD")
        );
    };

    const handleNext = () => {
        setStartDate((prev) =>
            moment(prev).add(1, "day").format("YYYY-MM-DD")
        );
    };

    return (
        loading ? <div className="w-full mt-10 flex items-center justify-center"><Spinner /></div>
            :
            <div className="space-y-6">

                <div className="flex gap-2 justify-center">
                    <Button
                        disabled={loading}
                        size="icon"
                        variant="outline"
                        onClick={handlePrev}
                    >
                        <ChevronLeft />
                    </Button>

                    <ScrollArea className={`overflow-x-auto ${isMobile && "max-w-[calc(100vw-150px)]"}`}>

                        <div className="flex justify-center gap-3 transition-all duration-300 ease-out">
                            {weekDates.map((date) => {
                                const isSelected = date === selectedDate;

                                return (
                                    <button
                                        key={date}
                                        onClick={() => setSelectedDate(date)}
                                        className={`
                          flex flex-col items-center justify-center
                          h-13 w-13 rounded-full
                          transition-all duration-300
                          transform
                          ${isSelected
                                                ? "bg-white text-black shadow-lg"
                                                : undefined
                                            }
                        `}
                                    >
                                        <span className="text-xl font-semibold leading-none">
                                            {moment(date).format("DD")}
                                        </span>
                                        <span className="text-xs opacity-70">
                                            {moment(date).format("ddd")}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <Scrollbar orientation="horizontal" />
                    </ScrollArea>

                    <Button
                        disabled={loading}
                        size="icon"
                        variant="outline"
                        onClick={handleNext}

                    >
                        <ChevronRight />
                    </Button>
                </div>

                <div >
                    <h2 className="text-lg font-semibold transition-all duration-300">
                        {moment(selectedDate).format("dddd, MMMM DD, YYYY")}
                    </h2>
                </div>

                <div className="space-y-2 transition-all duration-300">
                    {selectedSessions.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center">
                            No sessions found
                        </div>
                    ) : (
                        selectedSessions.map((session) => (
                            <RenderEachSession key={session.id} session={session} selectedDate={selectedDate} fetchData={onSuccess} playerId={player_id} />
                        ))
                    )}
                </div>

            </div>
    );
}

const RenderEachSession = ({ session, selectedDate, fetchData, playerId }: {
    session: SessionProps,
    selectedDate: string,
    fetchData: () => Promise<void>,
    playerId?: string | null,
}) => {
    const isEnrolledForSelectedDate = session.is_daily_payment
        ? session.enrolled_dates?.includes(selectedDate) ?? false
        : session.enrolled;

    return (
        <div

            className="flex border-b p-4 transition-all gap-2 flex-wrap"
        >

            <div className="flex flex-col items-center gap-2 min-w-[70px]">
                <span className="text-xs font-medium text-muted-foreground">
                    {session.time}
                </span>

                <RenderAvatar
                    className="h-11 w-11"
                    img={session.coachPicture}
                    fallback={session.coachName}
                />
            </div>


            <div className="flex flex-col flex-1 px-2 justify-between">
                <div>
                    <div className="text-sm font-semibold text-foreground">
                        {session.sessionName}
                    </div>

                    <div className="text-xs text-muted-foreground mt-1">
                        Coach:{" "}
                        {session.coachName}
                    </div>
                </div>

                <div className="mt-3 text-xs text-muted-foreground flex flex-wrap gap-2 items-center">

                    <span className="text-xs px-2 py-1 rounded-full font-medium capitalize bg-alternative-bg text-alternative-text">
                        {session.type}
                    </span>
                    <CardStatus value={session?.status} />
                    <GoDotFill className="text-white" />
                    <div className="leading-none">{session.location}</div>

                </div>
            </div>


            <div className="flex flex-col justify-end gap-2">
                <div className="flex flex-col items-start sm:items-end gap-2">
                    {session?.promotion && <span className="text-sm line-through text-muted-foreground">${session?.original_price}</span>}
                    <div className="p-2 bg-active-bg text-active-text border border-active-text/32 rounded-md">
                        <p className="text-md font-medium leading-none">${Number(session?.price || 0).toFixed(0)}</p>
                    </div>

                </div>
                {isEnrolledForSelectedDate ? <Badge className="bg-green-500/10 text-green-400">Enrolled</Badge> :
                    <ParticipateButton
                        player_id={playerId}
                        session_id={session.id}
                        session_date={session.is_daily_payment ? selectedDate : undefined}
                        variants={session.variants ?? []}
                        label="Participate"
                        onSuccess={fetchData}
                    />
                }
            </div>
        </div>
    )
}
