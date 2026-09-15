import { ReactNode } from 'react';

const Header = ({ children, totalParents }: { children: ReactNode; totalParents: number }) => {
  return (
    <div className="flex w-full gap-4 justify-between flex-wrap items-center">
      <div className="space-y-2">
        <p className="text-xl">Parent Management</p>
        <span className="text-xs text-muted-foreground flex items-center">
          <span>
            {totalParents} of {totalParents} parents{' '}
          </span>
          {/* <span className="text-alternative-text inline-flex"> <Dot size={16} /> 3 with payment issues</span> */}
        </span>
      </div>

      {children}
    </div>
  );
};

export default Header;
