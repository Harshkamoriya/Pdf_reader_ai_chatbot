import { ClerkDegraded } from "@clerk/nextjs";

export const logger = {
  info: (msg: string) => console.log(msg),
  error: (msg: string) => console.error(msg),
  warn:(msg:string)=>console.log(msg)
};
