import ContactPage from '@/components/landing/contact';

export const metadata = {
  title: 'Contact Us | AP2T',
  description:
    "Contact AP2T for questions about training programs, camps, coaching, or any other inquiries. We're here to help athletes succeed.",
  openGraph: {
    title: 'Contact AP2T',
    description: 'Reach out to AP2T for inquiries about coaching, programs, or athlete support.',
  },
};
export default function Page() {
  return <ContactPage />;
}
