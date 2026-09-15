import GalleryPage from '@/components/landing/gallary';

export const metadata = {
  title: 'Gallery | AP2T',
  description:
    'Browse photos from AP2T training sessions, camps, and events. See athletes in action and real moments from our programs.',
  openGraph: {
    title: 'AP2T Gallery',
    description: 'A visual look at training, camps, and athlete development at AP2T.',
  },
};
export default function Page() {
  return <GalleryPage />;
}
