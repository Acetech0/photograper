import './globals.css';

export const metadata = {
  title: 'Shamik Deshmukh',
  description:
    'Shamik Deshmukh — Fashion and Commercial Photographer based in Mumbai, India.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
