import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { ReactQueryProvider } from "./components/ReactQueryProvider";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import Header from "./components/Header";
import { Toaster } from "react-hot-toast";
export const metadata: Metadata = {
  title: "Interview.ai",
  description: "",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
     <ClerkProvider>
    <html lang="en" className={`${geist.variable} `}>
      <body
        
      >

           <ReactQueryProvider>
            <Header/>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            className: "font-medium text-sm",
            duration: 4000,
            style: {
              background: "#333",
              color: "#fff",
              borderRadius: "8px",
              padding: "12px",
            },
          }}
        />
        </ReactQueryProvider>
      </body>
    </html>
    </ClerkProvider>
  );
}
