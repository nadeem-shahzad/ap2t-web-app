'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import { Calendar, Clock, Pin, Trophy, Users, Volleyball } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter } from '../ui/card';
import { CurvedImage } from './curved-image';
import FlyerDialog from './flyer-dialog';
import Booking from './home-page/book.client';
import GradientIcon from './icon-container';
import RegisterNow from './register-now';

export default function InHouseProgramsPage() {
  const mobile = useIsMobile();

  return (
    <div className="relative py-16 sm:py-20">
      <FlyerDialog page="in_house" />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* HERO / PROGRAM INTRO */}
        <section className="space-y-12">
          <div className="relative flex flex-col items-center bg-[#090909] py-12 sm:py-16 rounded-lg overflow-hidden">
            <div className="absolute top-0 left-[30%] bg-primary h-60 w-50 rounded-full blur-[220px]" />

            <div className="relative space-y-8 w-full max-w-4xl">
              <div className="flex flex-col items-center gap-4 text-center">
                <h1 className="text-4xl sm:text-5xl font-bold">Programs at Our Facility</h1>
                <p className="text-sm text-muted max-w-xl">
                  From private to group sessions, build skill, agility, and athletic performance.
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
            <h1 className="text-2xl sm:text-3xl font-semibold">Class Overview</h1>
            <p className="text-sm sm:text-base text-muted leading-relaxed">
              Our Agility & Quickness Drills class is built to improve your athleticism by improving
              reaction time, directional changes, and multi-directional speed. Through cutting
              drills, cone work, and explosive reaction exercises, you'll sharpen your footwork and
              enhance your ability to change direction efficiently.
            </p>
          </div>
        </section>

        {/* IN-HOUSE EVENTS */}
        <section className="space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <p className="font-bold text-3xl sm:text-4xl">In-House Events</p>
            <p className="text-[#B3B3B3] text-sm sm:text-base">
              Comprehensive training programs designed to develop exceptional soccer players
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {events2
              .filter((item) => item.title !== 'Sport-Specific Technical Training')
              .sort((a, b) => programOrder[a.title] - programOrder[b.title])
              .map((item, i) => (
                <Card key={i} className="flex flex-col justify-between bg-[#131313] rounded-lg">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <GradientIcon>{item.icon}</GradientIcon>
                      <p className="font-semibold text-xl sm:text-2xl">{item.title}</p>
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
                    <h1 className="text-primary font-semibold">${item.price}</h1>
                    <Link href="/portal/auth?p=signup">
                      <Button className="bg-primary text-secondary">Book Now</Button>
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
                <h1 className="text-xl sm:text-2xl font-bold">Who This Program is Perfect For</h1>
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
      </div>
      <div className="pt-6 sm:pt-8 lg:pt-10">
        <RegisterNow />
      </div>
    </div>
  );
}

const programOrder: Record<string, number> = {
  'Speed, Agility, and Quickness': 1,
  'Technical and Skill Training': 2,
  '2 Hour Training': 3,
  'Strength Training': 4,
  'Sport-Specific Technical Training': 5,
};

const events2 = [
  {
    title: 'Speed, Agility, and Quickness',
    description:
      'Build explosive speed, sharper footwork, and confident change-of-direction skills. Athletes learn proper acceleration, sprinting, and lateral-movement techniques. Focused drills improve reaction time and on-field quickness. Each session also reinforces movement habits that help reduce running-related injuries.',
    icon: <img src="/images/inhouse/running.png" className="w-8 h-8" />,
    area: 'Main Training Area',
    players: '12 Players',
    time: '4:00 PM - 5:00 PM',
    day: 'Monday - Friday',
    price: 45,
  },
  {
    title: 'Strength Training',
    description:
      'Develop the strength, power, and conditioning needed to perform at your best. Training combines sport-focused exercises, plyometrics, mobility, and endurance work. Athletes receive guidance on safe technique and consistent progress. Each program supports greater confidence, resilience, and injury resistance.',
    icon: <img src="/images/inhouse/gym.png" className="w-8 h-8" />,
    area: 'Main Training Area',
    players: '12 Players',
    time: '6:00 PM - 7:00 PM',
    day: 'Monday - Friday',
    price: 25,
  },
  {
    title: '2 Hour Training',
    description:
      'Get two focused hours of complete athletic development in one session. Training combines technical skill work, speed and agility drills, and game-ready conditioning. Coaches provide detailed instruction and feedback throughout the session. It is an ideal option for athletes who want more time to build confidence and improve performance.',
    icon: <Trophy className="w-8 h-8 text-primary" />,
    area: 'Main Training Area',
    players: '12 Players',
    time: '4:00 PM - 6:00 PM',
    day: 'Monday - Friday',
    price: 69.95,
  },
  {
    title: 'Sport-Specific Technical Training',
    description:
      'Refine the technical skills that make a difference in your sport. Experienced coaches teach proper movement patterns, decision-making, and position-specific techniques. Sessions are tailored to each athlete’s current level and goals. Athletes leave with practical tools to perform with more confidence in competition.',
    icon: <Trophy className="w-8 h-8 text-primary" />,
    area: 'Main Training Area',
    players: '12 Players',
    time: '4:00 PM - 5:00 PM',
    day: 'Monday - Friday',
    price: 40,
  },

  {
    title: 'Technical and Skill Training',
    description:
      'Build stronger technical skills in a focused, supportive training environment. Athletes work on ball control, passing, movement, and game awareness. Coaches adapt instruction to suit different ages and experience levels. Consistent practice helps players make smarter, more confident decisions on the field.',
    icon: <Volleyball className="w-8 h-8 text-primary" />,
    area: 'Main Training Area',
    players: '12 Players',
    time: '5:00 PM - 6:00 PM',
    day: 'Monday - Friday',
    price: 45,
  },
];
