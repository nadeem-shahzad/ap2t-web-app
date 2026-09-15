import InHouseProgramsPage from '@/components/landing/inhouseprograms';
export const metadata = {
  title: 'Inhouse Programs | AP2T',
  description:
    'Discover AP2T training programs focused on agility, speed, and coordination. Join in-house sessions and elevate your performance.',
  openGraph: {
    title: 'AP2T Training Programs',
    description:
      'Agility, speed, and performance training programs designed for athletes of all levels.',
  },
};
export default function Page() {
  return <InHouseProgramsPage />;
}
