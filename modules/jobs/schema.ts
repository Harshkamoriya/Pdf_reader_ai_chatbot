import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string(),
  description: z.string(),
  skills: z.array(z.string()),
  companyId: z.string(),
});
