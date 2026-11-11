import "./globals.css";

export const metadata = {
  title: "AVXBS | Water Treatment & Softening Solutions",
  description:
    "Advanced residential and commercial water treatment solutions by AVXBS.",
  icons: {
    icon: "/assets/logo/avxbs-logo.png",
    shortcut: "/assets/logo/avxbs-logo.png",
    apple: "/assets/logo/avxbs-logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
