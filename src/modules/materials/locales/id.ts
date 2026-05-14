export const id = {
  createSuccess: "Materi berhasil dibuat",
  updateSuccess: "Materi berhasil diperbarui",
  deleteSuccess: "Materi berhasil dihapus",
  getSuccess: "Detail materi berhasil diambil",
  listSuccess: "Materi berhasil diambil",
  notFound: "Materi tidak ditemukan",
} as const;

export type MaterialsLocale = typeof id;
