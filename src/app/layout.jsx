
import "./globals.css";

export const metadata = {
  title: "AVXBS | Water Treatment & Softening Solutions",
  description:
    "Advanced residential and commercial water treatment solutions by AVXBS.",
  icons: {
    icon: "/assets/logo/avxbs-logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Inter+Tight:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
