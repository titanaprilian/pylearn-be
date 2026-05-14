import { PaginationSchema } from "@/libs/response";
import { z } from "zod";

export const MaterialTypeEnum = z.enum(["text", "file", "video", "link"]);

export const CreateMaterialSchema = z.object({
  lecturerId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  materialType: MaterialTypeEnum,
  content: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  iconName: z.string().max(50).optional(),
  isPublished: z.boolean().default(false),
});

export const CreateMaterialMeSchema = CreateMaterialSchema.omit({
  lecturerId: true,
});

export const UpdateMaterialSchema = z
  .object({
    lecturerId: z.string().optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    materialType: MaterialTypeEnum.optional(),
    content: z.string().optional(),
    sourceUrl: z.string().url().optional(),
    iconName: z.string().max(50).optional(),
    isPublished: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const MaterialParamSchema = z.object({
  id: z.string(),
});

export const GetMaterialsQuerySchema = PaginationSchema.extend({
  lecturerId: z.string().optional(),
  materialType: MaterialTypeEnum.optional(),
  isPublished: z
    .union([z.boolean(), z.literal("true"), z.literal("false")])
    .transform((val) => val === true || val === "true")
    .optional(),
});

export type CreateMaterialInput = z.infer<typeof CreateMaterialSchema>;
export type CreateMaterialMeInput = z.infer<typeof CreateMaterialMeSchema>;
export type UpdateMaterialInput = z.infer<typeof UpdateMaterialSchema>;
