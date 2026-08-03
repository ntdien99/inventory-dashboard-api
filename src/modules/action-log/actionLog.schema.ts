import { z } from "zod";

export const createActionLogSchema = z.object({
  action: z.string().min(3, "Action description is required"),
  notes: z.string().optional(),
});
