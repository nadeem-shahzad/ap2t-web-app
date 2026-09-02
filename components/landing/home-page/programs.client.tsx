"use client";

import GradientIcon from "@/components/landing/icon-container";
import { Trophy, User, Users } from "lucide-react";
import Link from "next/link";

export default function Programs() {
  return (
    <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
      <div className="flex flex-col gap-10 items-center">
        <div className="flex flex-col gap-3 items-center">
          <h1 className="text-3xl sm:text-5xl font-bold text-center">
            Our <span className="text-primary">Programs</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground text-center">
            Comprehensive training programs designed to develop exceptional
            soccer players
          </p>
        </div>

        <div className="w-full flex flex-wrap justify-center gap-6">
          {programs.map((program, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-between p-6 bg-[#131313] border border-[#353535] rounded text-center w-full sm:w-[48%] lg:w-[30%]"
            >
              <GradientIcon>{program.icon}</GradientIcon>
              <div className="space-y-1 mt-2">
                <h1 className="text-lg font-semibold">{program.title}</h1>
                <p className="text-sm text-primary">{program.price}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {program.description}
              </p>
              {program.buttonText==="Book Online"?<Link
                href="/portal/auth"
                className="py-2 w-full rounded-full bg-[#CBFD0026] text-primary mt-4 hover:bg-primary hover:text-black text-center block transition"
              >
                {program.buttonText}
              </Link>:
              <Link
                href="/contact"
                className="py-2 w-full rounded-full bg-[#CBFD0026] text-primary mt-4 hover:bg-primary hover:text-black text-center block transition"
              >
                {program.buttonText}
              </Link>
              }
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const programs = [
  {
    title: "Technical Training",
    price: "$45",
    description:
      "Group sessions focused on improving soccer skills, technique, and on-field decision-making.",
    buttonText: "Book Online",
    icon: <Users className="text-[#CAFF33] size-8 relative z-10" />,
  },
  {
    title: "Speed & Agility",
    price: "$45",
    description:
      "Personalized workouts to improve strength, speed, agility, and overall athletic performance",
    buttonText: "Book Online",
    icon: <User className="text-[#CAFF33] size-8 relative z-10" />,
  },
  {
    title: "2 Hour Training",
    price: "$69.95",
    description:
      "Intensive 2-hour sessions focused on improving skills, speed, and game performance.",
    buttonText: "Book Online",
    icon: <Trophy className="text-[#CAFF33] size-8 relative z-10" />,
  },
  {
    title: "Semi-Private Session",
    price: "$120",
    description:
      "Semi-private sessions for personalized guidance in a small-group setting.",
    buttonText: "Email to Book",
    icon: <User className="text-[#CAFF33] size-8 relative z-10" />,
  },
  {
    title: "Private Session",
    price: "$95",
    description:
      "Personalized private coaching to refine skills and reach your highest potential.",
    buttonText: "Email to Book",
    icon: <Trophy className="text-[#CAFF33] size-8 relative z-10" />,
  },
  {
    title: "Groups of 3 or More",
    price: "$40/Player",
    description:
      "Small-group training for three or more players, with focused coaching and shared development.",
    buttonText: "Email to Book",
    icon: <Users className="text-[#CAFF33] size-8 relative z-10" />,
  },
];
