import { prisma } from "@/libs/prisma";
import type {
  CreateMaterialInput,
  CreateMaterialMeInput,
  UpdateMaterialInput,
  CreateLevelInput,
  UpdateLevelInput,
} from "./schema";
import { Prisma } from "@generated/prisma";
import type { Logger } from "pino";
import { CannotDeleteLevelError } from "./error";

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

  static async createMaterialMe(
    data: CreateMaterialMeInput,
    lecturerId: string,
    log: Logger,
  ) {
    return this.createMaterial({ ...data, lecturerId }, log);
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

const SAFE_LEVEL_SELECT = {
  id: true,
  materialId: true,
  title: true,
  levelOrder: true,
  createdAt: true,
  updatedAt: true,
} as const;

export abstract class MaterialLevelService {
  static async getLevels(materialId: bigint, log: Logger) {
    log.debug(
      { materialId: materialId.toString() },
      "Fetching levels for material",
    );

    const levels = await prisma.materialLevel.findMany({
      where: { materialId },
      select: SAFE_LEVEL_SELECT,
      orderBy: { levelOrder: "asc" },
    });

    log.info(
      { materialId: materialId.toString(), count: levels.length },
      "Levels retrieved successfully",
    );

    return levels.map((level) => ({
      ...level,
      id: level.id.toString(),
      materialId: level.materialId.toString(),
      createdAt: level.createdAt.toISOString(),
      updatedAt: level.updatedAt.toISOString(),
    }));
  }

  static async createLevel(
    materialId: bigint,
    data: CreateLevelInput,
    log: Logger,
  ) {
    log.debug(
      { materialId: materialId.toString(), title: data.title },
      "Creating new level",
    );

    const maxLevel = await prisma.materialLevel.aggregate({
      where: { materialId },
      _max: { levelOrder: true },
    });

    const newLevelOrder = (maxLevel._max.levelOrder ?? 0) + 1;

    const level = await prisma.materialLevel.create({
      data: {
        materialId,
        title: data.title,
        levelOrder: newLevelOrder,
      },
      select: SAFE_LEVEL_SELECT,
    });

    log.info(
      {
        materialId: materialId.toString(),
        levelId: level.id.toString(),
        levelOrder: level.levelOrder,
      },
      "Level created successfully",
    );

    return {
      ...level,
      id: level.id.toString(),
      materialId: level.materialId.toString(),
      createdAt: level.createdAt.toISOString(),
      updatedAt: level.updatedAt.toISOString(),
    };
  }

  static async updateLevel(
    materialId: bigint,
    levelId: bigint,
    data: UpdateLevelInput,
    log: Logger,
  ) {
    log.debug(
      { materialId: materialId.toString(), levelId: levelId.toString() },
      "Updating level",
    );

    const level = await prisma.materialLevel.update({
      where: { id: levelId },
      data: { title: data.title },
      select: SAFE_LEVEL_SELECT,
    });

    log.info(
      { levelId: level.id.toString(), title: level.title },
      "Level updated successfully",
    );

    return {
      ...level,
      id: level.id.toString(),
      materialId: level.materialId.toString(),
      createdAt: level.createdAt.toISOString(),
      updatedAt: level.updatedAt.toISOString(),
    };
  }

  static async deleteLevel(materialId: bigint, levelId: bigint, log: Logger) {
    log.debug(
      { materialId: materialId.toString(), levelId: levelId.toString() },
      "Deleting level",
    );

    const level = await prisma.materialLevel.findUnique({
      where: { id: levelId },
      select: { id: true, levelOrder: true },
    });

    if (!level) {
      throw new Prisma.PrismaClientKnownRequestError("Level not found", {
        code: "P2025",
        clientVersion: "6.5.0",
      });
    }

    const maxLevel = await prisma.materialLevel.aggregate({
      where: { materialId },
      _max: { levelOrder: true },
    });

    if (level.levelOrder !== maxLevel._max.levelOrder) {
      throw new CannotDeleteLevelError(
        "Cannot delete level. Levels must be deleted in reverse sequential order.",
      );
    }

    const deletedLevel = await prisma.materialLevel.delete({
      where: { id: levelId },
      select: SAFE_LEVEL_SELECT,
    });

    log.info(
      { levelId: deletedLevel.id.toString() },
      "Level deleted successfully",
    );

    return {
      ...deletedLevel,
      id: deletedLevel.id.toString(),
      materialId: deletedLevel.materialId.toString(),
      createdAt: deletedLevel.createdAt.toISOString(),
      updatedAt: deletedLevel.updatedAt.toISOString(),
    };
  }
}
