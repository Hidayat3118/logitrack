import type { Metadata } from "next";
import "./global.css";
import Providers from "./provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "LogiTrack",
  description: "Dashboard Logistik",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <Toaster position="top-right" richColors/>
      </body>
    </html>
  );
}
