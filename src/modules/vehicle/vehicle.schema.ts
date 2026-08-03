import { z } from "zod";

export const getVehiclesQuerySchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  isAging: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, { message: "Page must be > 0" })
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, { message: "Limit must be > 0" })
    .optional(),
});
