import type { Metadata } from "next";
import "./global.css";
import Providers from "./provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "si-aslap",
  description: "Sistem INformasi ASLAP",
  icons: {
    icon: "/mbg.svg",
    shortcut: "/mbg.png",
    apple: "/mbg.png",
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
