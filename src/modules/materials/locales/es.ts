export const es = {
  createSuccess: "Material creado exitosamente",
  updateSuccess: "Material actualizado exitosamente",
  deleteSuccess: "Material eliminado exitosamente",
  getSuccess: "Detalles del material obtenidos",
  listSuccess: "Materiales obtenidos exitosamente",
  notFound: "Material no encontrado",
} as const;

export type MaterialsLocale = typeof es;
