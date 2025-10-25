import { UserButton } from "@clerk/nextjs";
import React from "react";

const Header = () => {
  return (
    <div className="w-full p-4 flex justify-between items-center border-b-2 lg:p-8">
      <h1 className="text-2xl text-blue-600 font-bold">Intervu.Ai</h1>

      {/* Show Clerk User Button when signed in */}
      <UserButton/>
    </div>
  );
};

export default Header;
