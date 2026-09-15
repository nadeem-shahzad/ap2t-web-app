'use client';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSafeBack } from '@/hooks/use-safe-back';
import { ArrowLeft, Mail } from 'lucide-react';
import { team } from './constants';

export default function CoreTeamPage() {
  const isMobile = useIsMobile();
  const safeBack = useSafeBack('/home');

  return (
    <div className="pt-16 sm:pt-20 relative">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div onClick={safeBack} className="flex gap-4 text-muted items-center cursor-pointer">
          <ArrowLeft size={14} />
          <p className="text-xs">Back</p>
        </div>
      </div>
      <div className="h-60 flex items-center justify-center bg-gradient-to-b from-[#0A0A0A] to-[#1A1A1A] flex-col gap-4">
        <p className=" text-5xl mb-2">
          <span>Our Core </span>
          <span className="text-primary">Team</span>
        </p>
        <p className="text-[#A3A3A3] text-sm sm:text-base mb-6 sm:mb-8">
          Meet the dedicated professionals who make Athletic exceptional
        </p>
      </div>

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-12 py-12">
          {team.map((member, index) => {
            const isReversed = isMobile ? false : index % 2 !== 0;

            return (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isReversed ? (
                  <>
                    <div className={`space-y-2 `}>
                      <h3 className="text-xl font-semibold">{member.title}</h3>
                      <p className="text-primary font-medium">{member.designation}</p>

                      <div className="flex items-center gap-2">
                        <Mail size={12} className="text-muted" />
                        <a
                          href={`mailto:${member.email}`}
                          className="text-sm text-muted hover:underline block"
                        >
                          {member.email}
                        </a>
                      </div>

                      <p className="text-sm text-muted leading-relaxed">{member.description}</p>
                    </div>
                    <div className="flex items-start justify-end">
                      <img
                        src={member.img}
                        alt={member.title}
                        className="w-full max-w-sm  object-cover rounded-lg"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-start">
                      <img
                        src={member.img}
                        alt={member.title}
                        className="w-full max-w-sm object-cover rounded-lg"
                      />
                    </div>

                    <div className={`space-y-2`}>
                      <h3 className="text-xl font-semibold">{member.title}</h3>
                      <p className="text-primary font-medium">{member.designation}</p>

                      <a
                        href={`mailto:${member.email}`}
                        className="text-sm text-muted hover:underline block"
                      >
                        {member.email}
                      </a>

                      <p className="text-sm text-muted leading-relaxed">{member.description}</p>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
