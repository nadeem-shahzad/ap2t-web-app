
import { formatTimeWithAmPm, joinNames } from '@/lib/functions'
import { CalendarEvent } from '@/lib/types'
import CardStatus from '../card-status'
import { AddParticipantDialog } from '../sessions/add-participant-dialog'
import { Badge } from '../ui/badge'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { ScrollArea } from '../ui/scroll-area'
import ParticipateButton from './participate-button'
import { OctagonAlert } from 'lucide-react'


const EventDetail = ({
    open,
    onOpenChange,
    events,
    player_id = null,
    parent_id = null,
    onSuccess
}: {
    events: CalendarEvent[];
    open: boolean;
    onOpenChange: () => void;
    player_id: string | null | undefined,
    onSuccess: () => Promise<void>,
    parent_id: string | null | undefined | number
}) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#252525] border border-[#3A3A3A] sm:max-w-4xl p-0">
                <DialogHeader className="border-b border-[#3A3A3A] p-4">
                    <DialogTitle className="text-[#F3F4F6] font-semibold text-lg">
                        Event details
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[calc(100vh-250px)] px-4 py-3">
                    <div className="space-y-3">
                        {events.length === 0 && (
                            <div className="text-sm text-muted-foreground text-center py-10">
                                No events found
                            </div>
                        )}
                        <div className="bg-[#FF69001A] border border-[#FF690033] rounded-[10px] flex gap-2 text-warning-text p-4">
                            <OctagonAlert className="h-5 w-5" />
                            <div className="space-y-1">
                                <h1 className="text-warning-text">Reminder</h1>
                                <p className="text-sm text-[#D1D5DC]">
                                    Siblings in session get 10% off.
                                </p>
                            </div>
                        </div>

                        {events.map((event) => (
                            <div
                                key={event.id}
                                className="rounded-lg border border-[#3A3A3A] bg-[#1E1E1E] p-4 flex flex-col justify-between hover:bg-[#242424] transition gap-4 sm:gap-2"
                            >
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-2">
                                    <div className="flex-1 space-y-2">
                                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                            {event.title} {event?.enrolled && <Badge className="bg-green-500/10 text-green-400">Enrolled</Badge>}
                                        </h3>

                                        <div className="text-xs text-muted-foreground flex flex-wrap gap-2 sm:gap-3">
                                            <span>{event.start_date} - {event?.end_date}</span>
                                            <span>•</span>
                                            <span>{formatTimeWithAmPm(event.time)} - {formatTimeWithAmPm(event?.end_time)}</span>
                                        </div>

                                        {event?.children?.length > 0 && (
                                            <p className="text-xs">
                                                <span className="font-medium text-sm">Players enrolled:</span>{" "}
                                                {event.children.map(child => joinNames([child.first_name, child.last_name])).join(", ")}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-start sm:items-end gap-2">
                                        {event?.promotion && <span className="text-sm line-through text-muted-foreground">${event?.original_price}</span>}
                                        <div className="p-2 bg-active-bg text-active-text border border-active-text/32 rounded-md">
                                            <p className="text-md font-medium leading-none">${Number(event?.price || 0).toFixed(0)}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-xs px-2 py-1 rounded-full font-medium capitalize bg-alternative-bg text-alternative-text">
                                                {event.sessionType}
                                            </span>
                                            <CardStatus value={event?.status} />
                                        </div>
                                    </div>
                                </div>

                                {event.status === "upcoming" && (
                                    <div className="flex flex-col sm:flex-row sm:justify-start sm:gap-2 mt-4">
                                        {player_id && !event?.enrolled && (
                                            <ParticipateButton
                                                player_id={player_id}
                                                session_id={event.originalId}
                                                variants={event.variants ?? []}
                                                onSuccess={async () => {
                                                    await onSuccess();
                                                    onOpenChange();
                                                }}
                                            />
                                        )}
                                        {parent_id && (
                                            <AddParticipantDialog
                                                parent_id={parent_id}
                                                sessionId={Number(event.originalId)}
                                                variants={event.variants ?? []}
                                                onSuccess={async () => {
                                                    await onSuccess();
                                                    onOpenChange();
                                                }}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                        ))}
                    </div>
                </ScrollArea>

                <div className="p-2 space-y-1 border-t border-[#3A3A3A]">
                    <div className="flex gap-4">
                        <DialogClose className="text-[13px] font-medium leading-none h-8 px-4  bg-black text-white border-border rounded-md hover:opacity-70 cursor-pointer flex flex-1 items-center justify-center">
                            Close
                        </DialogClose>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EventDetail
