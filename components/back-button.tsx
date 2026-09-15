'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BackButton({ title = '', route = '#' }: { title: string; route: string }) {
  return (
    <Link href={route}>
      <div className="flex gap-2 text-muted-foreground items-center">
        <ArrowLeft size={16} />
        <div className="text-md ">{title}</div>
      </div>
    </Link>
  );
}
