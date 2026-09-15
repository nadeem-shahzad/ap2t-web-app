import { ServerError } from '@/components/server-error';
import CampsAndClinicsDetail from './page.client';

export const metadata = {
  title: 'Camps & Clinics Detail | AP2T',
  description:
    'Explore AP2T camps and clinics focused on skill development, game awareness, and performance improvement for athletes of all levels.',
  openGraph: {
    title: 'AP2T Camps & Clinics',
    description: 'Structured camps and clinics to help athletes improve skills and performance.',
  },
};

export default async function Page({ params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/camps-clinics/${id}`,
      {
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      throw new Error('Failed to fetch camps and clinics');
    }
    const data = await res.json();
    return <CampsAndClinicsDetail data={data} />;
  } catch (error: any) {
    return <ServerError error={error} />;
  }
}
