import { ReactNode } from 'react';

const Header = ({ children, length }: { children: ReactNode; length: number }) => {
  return (
    <div className="flex w-full gap-4 justify-between flex-wrap items-center">
      <div className="space-y-2">
        <p className="text-xl">Players Management</p>
        <span className="text-xs text-muted-foreground flex items-center">
          <span>
            {length} of {length} players{' '}
          </span>
          {/* <span className="text-[#FF6467] inline-flex"> <Dot size={16} /> 1 with low attendance</span> */}
        </span>
      </div>

      {children}
    </div>
  );
};

export default Header;
