"use client"

import { detailIcons } from "@/components/landing/constants";
import { CurvedImage } from "@/components/landing/curved-image";
import FlyerDialog from "@/components/landing/flyer-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { CampClinicCard, CampClinicSession } from "@/lib/types";
import { ArrowRight, Search } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useState } from "react";
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';





export default function CampsAndClinics({ data = [] }: { data?: CampClinicSession[] }) {

    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState("All")
    const mobile = useIsMobile()
    const camps = transformCampClinics(data);
    return (
        <div className="relative pt-16 sm:pt-20">
            <FlyerDialog page="camps_clinics" />
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">

                <section className="space-y-5">

                    <div className="relative flex flex-col items-center bg-[#090909] py-12 sm:py-16 rounded-lg overflow-hidden">
                        <div className="relative space-y-8 w-full max-w-4xl">
                            <div className="flex flex-col items-center gap-4 text-center">
                                <h1 className="text-4xl sm:text-5xl font-bold">
                                    Camps & Clinics
                                </h1>
                                <p className="text-sm text-muted max-w-xl">
                                    Enhance your reaction time, coordination, and movement efficiency.
                                </p>
                            </div>
                        </div>

                        <CurvedImage
                            src="/images/camps/hero.JPG"
                            alt="About hero"
                            curveDepth={mobile ? 10 : 20}
                            className="shadow-2xl"
                            imageClassName="object-top"
                        />

                    </div>
                    <div className="flex flex-wrap justify-between gap-6">

                        <div className="flex items-center gap-2 rounded border border-gray-200 px-3 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                            <Search className="h-4 w-4 text-gray-400" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by camp name or clinic..."
                                className="w-80 border-none dark:bg-transparent p-0 text-sm placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4">
                            <Button
                                onClick={() => setFilter("All")}
                                className="rounded-[8px]"
                                variant={filter !== "All" ? "outline" : "default"}
                            >
                                All
                            </Button>

                            <Button
                                onClick={() => setFilter("CAMP")}
                                className="rounded-[8px]"
                                variant={filter !== "CAMP" ? "outline" : "default"}
                            >
                                Camps
                            </Button>

                            <Button
                                onClick={() => setFilter("CLINIC")}
                                className="rounded-[8px]"
                                variant={filter !== "CLINIC" ? "outline" : "default"}
                            >
                                Clinics
                            </Button>
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {camps
                            .filter((item) => {
                                if (filter === "All") return item
                                return item.badge
                                    .toLowerCase()
                                    .includes(filter.toLowerCase())
                            })
                            .filter((item) =>
                                item.title.toLowerCase().includes(search?.toLowerCase())
                            )
                            .map((item) => (
                                <Card
                                    key={item.id}
                                    className="bg-[#131313] rounded border border-white/5"
                                >
                                    <CardContent className="p-4 space-y-4">

                                        {/* Badges */}
                                        <div className="flex items-center justify-between">
                                            <div
                                                className={`text-xs font-semibold px-2.5 py-1 rounded-md ${item.badge === "CLINIC"
                                                    ? "bg-blue-500/15 text-blue-400"
                                                    : "bg-primary/15 text-primary"
                                                    }`}
                                            >
                                                {item.badge}
                                            </div>

                                            {item?.left && (
                                                <div className="text-xs font-semibold px-2 py-1 rounded-md bg-red-500/15 text-red-400">
                                                    {item.left} Left
                                                </div>
                                            )}
                                        </div>

                                        <Zoom>
                                            <img
                                                src={item.image || "/footballkick.jpg"}
                                                alt={`${item.title} program`}
                                                className="h-[350px] w-full rounded-md object-contain"
                                                onError={(event) => { event.currentTarget.src = "/footballkick.jpg"; }}
                                            />
                                        </Zoom>

                                        {/* Title */}
                                        <div className="text-base font-semibold text-white">
                                            {item.title}
                                        </div>

                                        {/* Description */}
                                        <div className="text-sm text-muted-foreground leading-relaxed">
                                            {item.description}
                                        </div>

                                        {/* Details */}
                                        <div className="flex flex-col gap-3 pt-1">
                                            {item.details.map((eachDetail, index) => {
                                                const Icon = detailIcons[index]
                                                return (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-2 text-xs text-muted-foreground"
                                                    >
                                                        {Icon && (
                                                            <Icon className="h-4 w-4 text-primary shrink-0" />
                                                        )}
                                                        <span>{eachDetail}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <Link href={`/camps-clinics/${item.id}`}>
                                            <Button
                                                className="w-full bg-primary/20 text-primary hover:bg-primary/30 flex items-center gap-2"
                                            >
                                                View Details
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ))}
                    </div>
                </section>
            </div>
        </div>
    )

}

export const transformCampClinics = (
    sessions: CampClinicSession[]
): CampClinicCard[] => {
    return sessions.map((s) => ({
        id: s.id,
        badge: s.session_type.toUpperCase() as "CAMP" | "CLINIC",
        image: s.image,
        title: s.name,
        description: s.description,
        price: Number(s.apply_promotion ? s.promotion_price : s.price),
        left: s.total_left,
        details: [
            `${moment(s.date).format("MMM DD")}–${moment(s.end_date).format("DD, YYYY")}`,
            `${s.start_time} - ${s.end_time}`,
            `Ages ${s.age_limit ?? "All"}`,
            s?.location || "",
        ],
    }));
};




