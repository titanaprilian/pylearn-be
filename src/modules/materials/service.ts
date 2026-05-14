import { prisma } from "@/libs/prisma";
import type { CreateMaterialInput, UpdateMaterialInput } from "./schema";
import { Prisma } from "@generated/prisma";
import type { Logger } from "pino";
import { join } from "path";
import { mkdir } from "fs/promises";

export const SAFE_MATERIAL_SELECT = {
  id: true,
  lecturerId: true,
  title: true,
  description: true,
  materialType: true,
  content: true,
  sourceUrl: true,
  iconName: true,
  isPublished: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export abstract class MaterialService {
  static async getMaterials(
    params: {
      page: number;
      limit: number;
      lecturerId?: string;
      materialType?: string;
      isPublished?: boolean;
    },
    log: Logger,
  ) {
    log.debug(
      {
        page: params.page,
        limit: params.limit,
        lecturerId: params.lecturerId,
        materialType: params.materialType,
        isPublished: params.isPublished,
      },
      "Fetching materials list",
    );

    const { page, limit, lecturerId, materialType, isPublished } = params;

    const where: Prisma.MaterialWhereInput = {};

    if (lecturerId) {
      where.lecturerId = lecturerId;
    }

    if (materialType) {
      where.materialType = materialType;
    }

    if (typeof isPublished === "boolean") {
      where.isPublished = isPublished;
    }

    const skip = (page - 1) * limit;

    const [materials, total] = await prisma.$transaction([
      prisma.material.findMany({
        where,
        select: SAFE_MATERIAL_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.material.count({ where }),
    ]);

    log.info(
      { count: materials.length, total },
      "Materials retrieved successfully",
    );

    const materialsWithStringDates = materials.map((material) => ({
      ...material,
      id: material.id.toString(),
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
      publishedAt: material.publishedAt?.toISOString() ?? null,
    }));

    return {
      materials: materialsWithStringDates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getMaterial(id: bigint, log: Logger) {
    log.debug({ materialId: id.toString() }, "Fetching material details");

    const material = await prisma.material.findUniqueOrThrow({
      where: { id },
      select: SAFE_MATERIAL_SELECT,
    });

    log.info(
      { materialId: id.toString(), title: material.title },
      "Material details retrieved successfully",
    );

    return {
      ...material,
      id: material.id.toString(),
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
      publishedAt: material.publishedAt?.toISOString() ?? null,
    };
  }

  static async createMaterial(data: CreateMaterialInput, log: Logger) {
    log.debug(
      { title: data.title, lecturerId: data.lecturerId },
      "Creating new material",
    );

    const material = await prisma.material.create({
      data: {
        ...data,
        publishedAt: data.isPublished ? new Date() : null,
      },
      select: SAFE_MATERIAL_SELECT,
    });

    log.info(
      { materialId: material.id.toString(), title: material.title },
      "Material created successfully",
    );

    return {
      ...material,
      id: material.id.toString(),
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
      publishedAt: material.publishedAt?.toISOString() ?? null,
    };
  }

  static async createMaterialMe(data: any, lecturerId: string, log: Logger) {
    let filePath: string | null = null;

    if (data.file instanceof File) {
      log.debug("Processing uploaded PDF file...");

      const uploadDir = join(process.cwd(), "storage", "materials");
      await mkdir(uploadDir, { recursive: true });
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const fileName = `${uniqueSuffix}-${data.file.name.replace(/\s+/g, "_")}`;
      const fullPath = join(uploadDir, fileName);

      const bytesWritten = await Bun.write(fullPath, data.file);
      log.debug(
        { bytesWritten, path: fullPath },
        "File saved to local storage",
      );

      filePath = `/storage/materials/${fileName}`;
    }

    const material = await prisma.material.create({
      data: {
        title: data.title,
        materialType: data.materialType,
        lecturerId: lecturerId,
        content: filePath ?? data.content ?? null,
        publishedAt:
          data.isPublished === "true" || data.isPublished === true
            ? new Date()
            : null,
      },
      select: SAFE_MATERIAL_SELECT,
    });

    log.info(
      { materialId: material.id.toString(), title: material.title },
      "Material with attachment created successfully",
    );

    return {
      ...material,
      id: material.id.toString(),
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
      publishedAt: material.publishedAt?.toISOString() ?? null,
    };
  }

  static async updateMaterial(
    id: bigint,
    data: UpdateMaterialInput,
    log: Logger,
  ) {
    log.debug({ materialId: id.toString() }, "Updating material");

    const updateData: Prisma.MaterialUpdateInput = { ...data };

    if (data.isPublished !== undefined) {
      if (data.isPublished === true) {
        updateData.publishedAt = new Date();
      } else {
        updateData.publishedAt = null;
      }
    }

    const material = await prisma.material.update({
      where: { id },
      data: updateData,
      select: SAFE_MATERIAL_SELECT,
    });

    log.info(
      { materialId: id.toString(), title: material.title },
      "Material updated successfully",
    );

    return {
      ...material,
      id: material.id.toString(),
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
      publishedAt: material.publishedAt?.toISOString() ?? null,
    };
  }

  static async deleteMaterial(id: bigint, log: Logger) {
    log.debug({ materialId: id.toString() }, "Deleting material");

    const material = await prisma.material.delete({
      where: { id },
      select: SAFE_MATERIAL_SELECT,
    });

    log.info(
      { materialId: id.toString(), title: material.title },
      "Material deleted successfully",
    );

    return {
      ...material,
      id: material.id.toString(),
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
      publishedAt: material.publishedAt?.toISOString() ?? null,
    };
  }
}
