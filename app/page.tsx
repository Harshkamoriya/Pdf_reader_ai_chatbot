"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";

import { ReactQueryProvider } from "./components/ReactQueryProvider";
import Herosection from "./components/HeroSection";

const Page = () => {
  const { isSignedIn } = useUser();

  const handlePost = async () => {
    const res = await axios.post(`/api/aiCoach`);
    console.log(res);
  };

  const handleSaveUser = async () => {
    try {
      console.log("inside handleSaveUser");
      const res = await axios.post(`/api/user`);
      console.log(res, "res data");
    } catch (error) {
      console.error("Error in saving the user", error);
    }
  };

  if (isSignedIn) {
    handleSaveUser();
  }

  return (
    <div>
      <ReactQueryProvider>
        <Herosection />
        <button onClick={handlePost}>AI Coach</button>
      </ReactQueryProvider>
    </div>
  );
};

export default Page;
