import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Salon Booking — Book Your Style',
  description: 'Book salon appointments online. Haircuts, beard trims, facials and more. Real-time availability.',
  keywords: 'salon booking, hair appointment, barber, beauty salon',
  openGraph: {
    title: 'Salon Booking',
    description: 'Book your next salon appointment in seconds.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0f0f13" />
      </head>
      <body>{children}</body>
    </html>
  );
}
