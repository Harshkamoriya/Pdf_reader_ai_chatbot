import { ClerkProvider } from "@clerk/nextjs";
import { Geist } from "next/font/google";

import Header from "@/app/components/Header";

import AppHeader from "./_components/AppHeader";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});


export default function DashLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
      <ClerkProvider>
        {children}
        
        
    </ClerkProvider>
  );
}
