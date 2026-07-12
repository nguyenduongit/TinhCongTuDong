import { z } from "zod/v4";

export const UpsertLichTrinhBody = z.object({
  ngay: z.string(),
  loai: z.enum(['tang_ca', 'nghi_phep']),
  so_phut: z.number()
});
export type UpsertLichTrinhBodyType = z.infer<typeof UpsertLichTrinhBody>;

export const LichTrinhResponse = z.object({
  id: z.number(),
  user_id: z.number(),
  ngay: z.string(),
  loai: z.string(),
  so_phut: z.number(),
  created_at: z.date().nullable().optional(),
  updated_at: z.date().nullable().optional(),
});
export type LichTrinhResponseType = z.infer<typeof LichTrinhResponse>;

export const ListLichTrinhQueryParams = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const ListLichTrinhResponse = z.array(LichTrinhResponse);
export type ListLichTrinhResponseType = z.infer<typeof ListLichTrinhResponse>;

export const DeleteLichTrinhParams = z.object({
  ngay: z.string(), // Delete by specific date instead of ID
});
