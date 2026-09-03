"use client"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle
} from "@/components/ui/sheet"
import { useAuth } from "@/contexts/auth-context"
import { useNotifications } from "@/hooks/use-notifications"
import axios from "@/lib/axios"
import { NotificationType } from "@/lib/types"
import { Bell, Dot } from "lucide-react"
import moment from "moment"
import { useRouter } from "nextjs-toploader/app"
import { useState } from "react"
import { ScrollArea } from "./ui/scroll-area"
import { Spinner } from "./ui/spinner"

export default function NotificationSheet() {

    const { notifications, unRead } = useNotifications()
    const router = useRouter()
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [loadingNotificationId, setLoadingNotificationId] = useState<number | null>(null)
    const [open, setOpen] = useState(false)

    async function handleClick(item: NotificationType) {
        if (loadingNotificationId !== null) return

        setLoadingNotificationId(item.id)
        try {
            // The PUT route writes the Firestore document watched by
            // useNotifications; wait for it before leaving this screen.
            await axios.put(`/notification?user_id=${user?.id}`, { read: true, id: item.id })
        } catch (error) {
            console.error("Failed to mark notification as read", error)
        } finally {
            setLoadingNotificationId(null)
            router.push(item?.route || "#")
        }
    }

    async function handleMarkAll() {
        try {
            setLoading(true)
            await axios.post(`/notification/all`, { user_id: user?.id })
            setOpen(false)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <NotificationBadge count={unRead} onClick={() => setOpen(!open)} />
            <Sheet open={open} onOpenChange={setOpen}>

                <SheetContent className="bg-[#252525] border-[#3A3A3A] p-0 sm:max-w-[500px] gap-0">
                    <SheetHeader className=" p-4">

                        <div className="flex gap-4 items-center">
                            <div className={`rounded-[8px] flex w-10 h-10 items-center justify-center bg-success-bg text-success-text`}><Bell />

                            </div>
                            <div className="space-y-0">
                                <SheetTitle className="text-md">Notification Center</SheetTitle>
                                <SheetDescription className="text-xs text-muted-foreground">{unRead} unread messages</SheetDescription>
                            </div>
                        </div>

                    </SheetHeader>

                    {unRead > 0 &&
                        <div className="flex w-full gap-4 justify-between px-6 py-4">
                            <Button disabled={loading} onClick={handleMarkAll} variant={"outline"} className="flex flex-1">{loading && <Spinner />}Mark All as Read</Button>
                        </div>}



                    <ScrollArea className="overflow-y-auto p-4">
                        <div className="px-2 space-y-2">
                            {notifications.map((item, i) => {
                                const isRead = item.read;
                                const isLoading = loadingNotificationId === item.id;
                                return (
                                    <div

                                        key={i}
                                        onClick={() => !loading && handleClick(item)}
                                        className={`
        p-3 border rounded-md transition-all duration-200 w-full
        ${isRead
                                                ? "bg-[#141414] border-[#2A2A2A] opacity-70"
                                                : "bg-[#1A1A1A] border-[#3A3A3A]"} 
        ${loading || loadingNotificationId !== null ? "cursor-not-allowed" : "cursor-pointer hover:bg-[#242424] hover:border-[#4A4A4A] hover:scale-[1.01]"}
      `}
                                    >
                                        <div className="flex gap-2">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p className={`text-sm ${isRead ? "text-gray-400" : "text-white"}`}>
                                                        {item?.title}
                                                    </p>
                                                    {isLoading && <Spinner />}
                                                </div>

                                                <p className="text-xs text-white">
                                                    {item.msg}
                                                </p>

                                                <div className="flex gap-2 items-center">
                                                    <p className="text-xs text-muted-foreground">
                                                        {item?.to_name}
                                                    </p>

                                                    <Dot size={10} className="text-muted-foreground" />

                                                    <p className="text-xs text-muted-foreground">
                                                        {moment(item.created_at).format("YYYY-MM-DD hh:mm A")}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>

                </SheetContent>
            </Sheet>
        </>
    )
}


const NotificationBadge = ({ count, onClick }: { count?: number | null, onClick: () => void }) => {
    return (
        <div className="relative inline-block" onClick={onClick}>
            <Bell size={20} />

            {(count ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 block w-2 h-2 bg-red-500 rounded-full" />
            )}
        </div>
    );
};



