"use client";

import { Calendar, Clock, Pin, Trophy, Users, Volleyball } from "lucide-react";
import JoinNow from "./join-now";
import Booking from "./home-page/book.client";
import { Card, CardContent, CardFooter } from "../ui/card";
import GradientIcon from "./icon-container";
import Link from "next/link";
import { Button } from "../ui/button";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
import { CurvedImage } from "./curved-image";

export default function InHouseProgramsPage() {
  const mobile = useIsMobile();

  return (
    <div className="relative py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* HERO / PROGRAM INTRO */}
        <section className="space-y-12">
          <div className="relative flex flex-col items-center bg-[#090909] py-12 sm:py-16 rounded-lg overflow-hidden">
            <div className="absolute top-0 left-[30%] bg-primary h-60 w-50 rounded-full blur-[220px]" />

            <div className="relative space-y-8 w-full max-w-4xl">
              <div className="flex flex-col items-center gap-4 text-center">
                <h1 className="text-4xl sm:text-5xl font-bold">
                  Programs at Our Facility
                </h1>
                <p className="text-sm text-muted max-w-xl">
                  From private to group sessions, build skill, agility, and
                  athletic performance.
                </p>
              </div>
            </div>

            <CurvedImage
              src="/images/inhouse/hero.JPG"
              alt="In house"
              curveDepth={mobile ? 10 : 20}
              className="shadow-2xl"
            />
          </div>

          {/* CLASS OVERVIEW */}
          <div className="max-w-4xl space-y-4">
            <h1 className="text-2xl sm:text-3xl font-semibold">
              Class Overview
            </h1>
            <p className="text-sm sm:text-base text-muted leading-relaxed">
              Our Agility & Quickness Drills class is built to improve your
              athleticism by improving reaction time, directional changes, and
              multi-directional speed. Through cutting drills, cone work, and
              explosive reaction exercises, you'll sharpen your footwork and
              enhance your ability to change direction efficiently.
            </p>
          </div>
        </section>

        {/* IN-HOUSE EVENTS */}
        <section className="space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <p className="font-bold text-3xl sm:text-4xl">In-House Events</p>
            <p className="text-[#B3B3B3] text-sm sm:text-base">
              Comprehensive training programs designed to develop exceptional
              soccer players
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {events2
              .filter((item) => item.title !== "Sport-Specific Technical Training")
              .map((item, i) => (
              <Card
                key={i}
                className="flex flex-col justify-between bg-[#131313] rounded-lg"
              >
                <CardContent className="p-6 space-y-6">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <GradientIcon>{item.icon}</GradientIcon>
                    <p className="font-semibold text-xl sm:text-2xl">
                      {item.title}
                    </p>
                    <p className="text-[#B3B3B3] text-sm sm:text-base leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex gap-4 items-center">
                      <Pin className="text-primary" size={16} />
                      <p>{item.area}</p>
                      <Users className="text-primary" size={16} />
                      <p>{item.players}</p>
                    </div>

                    <div className="flex gap-4 items-center">
                      <Clock className="text-primary" size={16} />
                      <p>{item.time}</p>
                      <Calendar className="text-primary" size={16} />
                      <p>{item.day}</p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t border-[#282828] px-6 py-4">
                  <h1 className="text-primary font-semibold">
                    ${item.price}
                  </h1>
                  <Link href="/portal/auth?p=signup">
                    <Button className="bg-primary text-secondary">
                      Book Now
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
              ))}
          </div>
        </section>

        <Booking />

        {/* BENEFITS SECTION */}
        <section className="bg-[#1E1E1E] rounded-lg p-6 sm:p-8 lg:p-10 space-y-10">
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-1 space-y-10">
              <div className="space-y-4">
                <h1 className="text-xl sm:text-2xl font-bold">Key Benefits</h1>
                <ul className="list-disc space-y-2 pl-5 marker:text-primary text-sm text-muted">
                  <li>Improve agility and overall speed</li>
                  <li>Enhance coordination and body control</li>
                  <li>Reduce injury risk through proper movement mechanics</li>
                  <li>Move confidently in game situations</li>
                  <li>Build muscle memory for reactive movements</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h1 className="text-xl sm:text-2xl font-bold">
                  Who This Program is Perfect For
                </h1>
                <ul className="list-disc space-y-2 pl-5 marker:text-primary text-sm text-muted">
                  <li>Competitive athletes across sports</li>
                  <li>Youth athletes developing fundamentals</li>
                  <li>Adults improving coordination & balance</li>
                  <li>Athletes seeking speed & agility gains</li>
                </ul>
              </div>
            </div>

            <div className="relative w-full lg:w-1/2 h-64 sm:h-80 md:h-96">
              <Image
                src="/images/inhouse/endpic.JPG"
                alt="pic"
                fill
                className="rounded-lg object-cover object-top"
                priority
              />
            </div>
          </div>
        </section>

        <JoinNow />
      </div>
    </div>
  );
}

const events2 = [
  {
    title: "Speed, Agility, and Quickness",
    description:
      "At AP2T, we recognize that today’s athletes are faster, quicker, and more agile than ever before. Since the difference between the best and the rest can often be fractions of seconds, we understand that developing game-changing speed and agility is one of the most important elements of our training regimen. Creating athletes who are strong and skillful is not enough to dominate the competition, which is why AP2T focuses heavily on executing sport-specific movements as explosively as possible. At AP2T, you will become a student of linear, lateral, and change-of-direction techniques. Through detailed instruction that explains the intricacies of elite-level running, AP2T athletes will improve acceleration, top speed, quickness, and enhance their resistance to injuries commonly associated with sport-related running.",
    icon: <img src="/images/inhouse/running.png" className="w-8 h-8" />,
    area: "Main Training Area",
    players: "12 Players",
    time: "4:00 PM - 5:00 PM",
    day: "Monday - Friday",
    price: 45,
  },
  {
    title: "Strength Training",
    description:
      "AP2T prides itself on offering a strength and conditioning program that is second to none. We are committed to providing each student-athlete with the most appropriate exercise regimen to prepare them for their specific sport. Through the implementation of properly prescribed strength, power, plyometrics, speed, endurance, and flexibility exercises, we induce positive gains in holistic wellness, overall fitness, and resistance to injury as it relates to sport performance. AP2T creates individualized, sport-specific, multi-planar training regimens designed to produce morphological and neurological adaptations that yield physiological advantages for athletic performance. Our research-based programs form the foundation of AP2T’s Strength & Conditioning approach.",
    icon: <img src="/images/inhouse/gym.png" className="w-8 h-8" />,
    area: "Main Training Area",
    players: "12 Players",
    time: "4:00 PM - 5:00 PM",
    day: "Monday - Friday",
    price: 25,
  },
  {
    title: "Basic Nutrition Plan",
    description:
      "Fuel your body for peak performance with AP2T’s personalized nutrition plans. Whether your goal is to build lean muscle, increase endurance, or improve recovery, our expert staff will create a plan tailored to your age, athletic level, and goals. Learn how to eat smarter, train harder, and maximize results both on and off the field.",
    icon: (
      <img src="/images/inhouse/diet.png" className="w-8 h-8 text-primary" />
    ),
    area: "Nutrition Center",
    players: "Individual or Small Group",
    time: "Flexible / By Appointment",
    day: "Monday - Friday",
    price: 100,
  },
  {
    title: "Sport-Specific Technical Training",
    description:
      "At AP2T, we recognize that strength and speed will only take you so far in your sport. While both are extremely important, proper technique is equally critical. AP2T’s coaching staff includes professionals who currently work at the professional and Division-I collegiate levels. Their years of experience and mastery of their respective sports enable them to teach proper technique to athletes of all levels. All athletes who participate in sport-specific technical training receive personalized programs designed to help them master the technical demands of their sport.",
    icon: <Trophy className="w-8 h-8 text-primary" />,
    area: "Main Training Area",
    players: "12 Players",
    time: "4:00 PM - 5:00 PM",
    day: "Monday - Friday",
    price: 40,
  },

  {
    title: "Technical and Skill Training",
    description:
      "AP2T offers team training for athletes of all ages and levels. Many of our current coaches work at the professional and Division-I levels, and all are fully licensed to coach youth soccer teams. Our coaches have achieved success at both the youth and professional levels, winning State, Regional, and National Championships along the way. Many also hold advanced coaching certifications. Please email us to learn more about our Soccer Team Training programs.",
    icon: <Volleyball className="w-8 h-8 text-primary" />,
    area: "Main Training Area",
    players: "12 Players",
    time: "5:00 PM - 6:00 PM",
    day: "Monday - Friday",
    price: 40,
  },
];
