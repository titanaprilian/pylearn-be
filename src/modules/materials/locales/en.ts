export const en = {
  createSuccess: "Material created successfully",
  updateSuccess: "Material updated successfully",
  deleteSuccess: "Material deleted successfully",
  getSuccess: "Material details retrieved",
  listSuccess: "Materials retrieved successfully",
  notFound: "Material not found",
  levelCreateSuccess: "Level created successfully",
  levelUpdateSuccess: "Level updated successfully",
  levelDeleteSuccess: "Level deleted successfully",
  levelListSuccess: "Levels retrieved successfully",
  levelNotFound: "Level not found",
  cannotDeleteLevel:
    "Cannot delete level. Levels must be deleted in reverse sequential order.",
} as const;

export type MaterialsLocale = typeof en;
