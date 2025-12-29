"use client"


import { useUser } from "@clerk/nextjs";
import React from "react";

import { Button } from "@/app/components/ui/button";

const AppHeader =  () => {
    const {user} = useUser();
  return (


    <div className="flex flex-row  items-center justify-between  gap-4  ">
      <div className=" flex flex-col justify-start gap-1">
        <h1 className=" text-gray-600 ">My WorkSpace</h1>
        <h1 className="text-3xl font-bold">
          Welcome {user?.firstName || "User"} 👋
        </h1>{" "}
      </div>
      <div>
        <Button className="bg-blue-500">Profile</Button>
      </div>
    </div>
  );
};

export default AppHeader;
