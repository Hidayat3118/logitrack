import type { Metadata } from "next";
import "./global.css";
import Providers from "./provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  metadataBase: new URL("https://logitrack-red.vercel.app"),
  title: {
    default: "si-aslap",
    template: "%s - si-aslap",
  },
  description: "Sistem Informasi ASLAP",
  icons: {
    icon: "/mbg.svg",
    shortcut: "/mbg.png",
    apple: "/mbg.png",
  },
  openGraph: {
    title: "si-aslap",
    description: "Sistem Informasi ASLAP",
    siteName: "si-aslap",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "si-aslap",
    description: "Sistem Informasi ASLAP",
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