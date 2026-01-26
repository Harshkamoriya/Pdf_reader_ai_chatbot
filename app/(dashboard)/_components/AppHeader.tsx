"use client";

import React from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";

export default function AppHeader() {
  const { isLoaded, user } = useUser();

  if (!isLoaded) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md dark:bg-gray-950/80 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-7 w-56 animate-pulse rounded bg-gray-300 dark:bg-gray-800" />
            </div>
            <div className="h-10 w-10 animate-pulse rounded-full bg-gray-300 dark:bg-gray-700" />
          </div>
        </div>
      </header>
    );
  }

  const greeting = user?.firstName
    ? `Welcome back, ${user.firstName}`
    : "Welcome back";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md dark:bg-gray-950/80 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-xs sm:text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              My Workspace
            </span>

            <motion.h1
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="truncate text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl text-gray-900 dark:text-white"
            >
              {greeting} <span className="inline-block">👋</span>
            </motion.h1>
          </div>

          <div className="flex items-center gap-4">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  userButtonAvatarBox:
                    "h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-background shadow-sm",
                  userButtonPopoverCard: "border shadow-2xl",
                },
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}