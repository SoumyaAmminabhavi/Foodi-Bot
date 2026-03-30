import "~/styles/globals.css";
import { type Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400"],
});

export const metadata: Metadata = {
  title: "BiteBot — AI Food Ordering",
  description: "Order food via AI chat",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
