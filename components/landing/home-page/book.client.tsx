"use client";

import { Calendar } from "@/components/ui/calendar";
import { Calendar1, Clock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Booking() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
      <div className="w-full min-h-screen flex flex-col items-center justify-center gap-16">
        <div className="max-w-4xl text-center space-y-2">
          <h1 className="text-5xl font-bold">
            Book Your <span className="text-primary">Training Session</span>
          </h1>
          <p className="text-muted">
            Select your preferred date and time for group training sessions
          </p>
        </div>

        <div className="flex flex-col lg:flex-row w-full max-w-6xl gap-8 px-4 lg:px-6 mx-auto">
          <div className="flex flex-col flex-1 rounded-2xl bg-[#262626] p-6 sm:px-10 gap-6">
            <div className="flex items-center justify-center gap-3">
              <Calendar1 className="text-primary" />
              <h1 className="font-semibold text-lg sm:text-xl">Select Date</h1>
            </div>
            <div className="w-full overflow-x-auto">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-[0.75rem] border w-full"
              />
            </div>
            <Button asChild className="w-full">
              <Link href="/portal/auth">BOOK SESSION</Link>
            </Button>
          </div>

          <div className="flex flex-col flex-1 rounded-2xl bg-[#262626] p-6 sm:p-8 gap-6">
            <div className="flex items-center justify-center gap-3">
              <Clock className="text-primary" />
              <h1 className="font-semibold sm:font-bold text-lg sm:text-xl">
                Available Time Slot
              </h1>
            </div>

            <div className="bg-background rounded-[0.75rem] p-6 sm:p-8 space-y-6 w-full">
              <div className="flex items-center gap-2">
                <Clock className="text-primary" />
                <h1 className="font-semibold text-base sm:text-lg">
                  Select Session
                </h1>
              </div>

              <div className="space-y-4">
                {/* Session Cards */}
                {[
                  {
                    title: "Speed & Agility",
                    price: "$45",
                    time: "4:00 PM - 5:00 PM • Monday - Friday",
                  },
                  {
                    title: "Technical Session",
                    price: "$45",
                    time: "5:00 PM - 6:00 PM • Monday - Friday",
                  },
                  {
                    title: "2-hr Session",
                    price: "$69.95",
                    time: "4:00 PM - 6:00 PM • Monday - Friday",
                    note: "⭐ Best Value - Save $20",
                  },
                  {
                    title: "Physical Training",
                    price: "$25",
                    time: "6:00 PM - 7:00 PM • Monday - Friday",
                  },
                ].map((session, i) => (
                  <div
                    key={i}
                    className="border border-[#282828] rounded-2xl w-full space-y-2 p-4"
                  >
                    <div className="flex justify-between">
                      <h1 className="font-semibold">{session.title}</h1>
                      <h1 className="text-lg text-primary font-bold">
                        {session.price}
                      </h1>
                    </div>
                    <p className="text-sm text-muted">{session.time}</p>
                    {session.note && (
                      <p className="text-primary text-xs">{session.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Available Slots */}
            <div className="w-full flex flex-col gap-2">
              <p className="text-sm sm:text-base font-medium">
                Available Slots
              </p>
              <div className="flex flex-col sm:flex-row gap-4 h-auto sm:h-18">
                {[
                  { time: "9:00 AM", slots: 2 },
                  { time: "5:00 PM", slots: 3 },
                ].map((slot, i) => (
                  <div
                    key={i}
                    className="bg-background w-full sm:w-56.5 h-full flex justify-center items-center gap-3 rounded-[0.75rem] p-2"
                  >
                    <h1 className="text-sm sm:text-base">{slot.time}</h1>
                    <div className="p-2 h-10 bg-[#262626] flex justify-center items-center rounded-[0.5rem]">
                      <h1 className="text-xs sm:text-sm">
                        {slot.slots} slots available
                      </h1>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
