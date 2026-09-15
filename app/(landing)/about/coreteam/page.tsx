import CoreTeamPage from '@/components/landing/about-coreteam';

export const metadata = {
  title: 'Core Team | AP2T',
  description:
    'Get to know the expert coaches and core team at AP2T. Passionate professionals focused on athlete development, training, and performance.',
  openGraph: {
    title: 'AP2T Core Team',
    description: 'Meet the people driving athlete success at AP2T.',
  },
};
export default function Page() {
  return <CoreTeamPage />;
}
