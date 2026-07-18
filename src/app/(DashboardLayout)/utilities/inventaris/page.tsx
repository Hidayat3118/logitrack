"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
} from "@mui/material";
import {
  Add,
  Close,
  DeleteOutline,
  EditOutlined,
  PhotoCamera,
  Search,
} from "@mui/icons-material";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { toast } from "sonner";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";
import { db } from "@/lib/firebase";

type InventarisItem = {
  id: string;
  namaBarang: string;
  jumlahBarang: number;
  satuan: string;
  kondisi: string;
  keterangan: string;
  imageUrl?: string;
  imageName?: string;
};

type InventarisForm = {
  namaBarang: string;
  jumlahBarang: string;
  satuan: string;
  kondisi: string;
  keterangan: string;
};

const emptyForm: InventarisForm = {
  namaBarang: "",
  jumlahBarang: "",
  satuan: "",
  kondisi: "Baik",
  keterangan: "",
};

// warna

const statusConfig: Record<string, { label: string; color: any }> = {
  Baik: { label: "Baik", color: "success" },
  "Rusak Ringan": { label: "Rusak Ringan", color: "warning" },
  "Rusak Berat": { label: "Rusak Berat", color: "error" },
  Dipinjam: { label: "Dipinjam", color: "info" },
};

const InventarisPage = () => {
  // state uplaod gambar
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [imageName, setImageName] = useState("");

  const [items, setItems] = useState<InventarisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InventarisForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [filterKondisi, setFilterKondisi] = useState("Semua");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const [selectedImage, setSelectedImage] = useState<{
    src: string;
    name: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventarisItem | null>(null);

  //   reset form
  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setImage(null);
    setPreview("");
    setImageName("");
  };

  //   pilih gambar
  const handleSelectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImage(file);
      setPreview(result);
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "inventaris"),
      (snapshot) => {
        const data = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...(docItem.data() as Omit<InventarisItem, "id">),
        })) as InventarisItem[];

        setItems(data);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        toast.error("Gagal memuat data inventaris");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const handleOpenAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: InventarisItem) => {
    setEditingId(item.id);
    setForm({
      namaBarang: item.namaBarang,
      jumlahBarang: String(item.jumlahBarang),
      satuan: item.satuan,
      kondisi: item.kondisi,
      keterangan: item.keterangan,
    });
    setImage(null);
    setPreview(item.imageUrl || "");
    setImageName(item.imageName || "");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleOpenImagePreview = (src: string, name: string) => {
    setSelectedImage({ src, name });
  };

  const handleCloseImagePreview = () => {
    setSelectedImage(null);
  };

  const handleOpenDeleteConfirm = (item: InventarisItem) => {
    setDeleteTarget(item);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteTarget(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.namaBarang.trim() || !form.satuan.trim()) {
      toast.error("Nama barang dan satuan wajib diisi");
      return;
    }

    const jumlah = Number(form.jumlahBarang);
    if (Number.isNaN(jumlah) || jumlah < 0) {
      toast.error("Jumlah barang harus angka positif");
      return;
    }

    setSubmitting(true);

    try {
      if (editingId) {
        await updateDoc(doc(db, "inventaris", editingId), {
          namaBarang: form.namaBarang.trim(),
          jumlahBarang: jumlah,
          satuan: form.satuan.trim(),
          kondisi: form.kondisi,
          keterangan: form.keterangan.trim(),
          imageUrl: preview || null,
          imageName: imageName || null,
          updatedAt: serverTimestamp(),
        });
        toast.success("Inventaris berhasil diperbarui");
      } else {
        await addDoc(collection(db, "inventaris"), {
          namaBarang: form.namaBarang.trim(),
          jumlahBarang: jumlah,
          satuan: form.satuan.trim(),
          kondisi: form.kondisi,
          keterangan: form.keterangan.trim(),
          imageUrl: preview || null,
          imageName: imageName || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast.success("Inventaris berhasil ditambahkan");
      }

      handleCloseDialog();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan inventaris");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "inventaris", id));
      toast.success("Inventaris berhasil dihapus");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus inventaris");
    }
  };

  const filteredItems = items.filter((item) => {
    const matchSearch = item.namaBarang
      .toLowerCase()
      .includes(search.toLowerCase().trim());
    const matchKondisi =
      filterKondisi === "Semua" || item.kondisi === filterKondisi;
    return matchSearch && matchKondisi;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paginatedItems = filteredItems.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage,
  );

  useEffect(() => {
    setPage(1);
  }, [search, filterKondisi]);

  return (
    <PageContainer
      title="Inventaris"
      description="Kelola data inventaris terpisah dari manajemen barang"
    >
      <Stack spacing={3}>
        <DashboardCard
          title="Daftar Inventaris SPPG Banua Rantau"
          action={
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenAdd}
            >
              Tambah Inventaris
            </Button>
          }
        >
          {/* search & filter */}
          <Box
            mb={2}
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            gap={2}
          >
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama barang..."
              fullWidth
              sx={{ maxWidth: { sm: 320 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            {/* filter kondisi */}
            <FormControl sx={{ maxWidth: { sm: 200 } }} fullWidth>
              <InputLabel id="filter-kondisi-label">Kondisi</InputLabel>
              <Select
                labelId="filter-kondisi-label"
                value={filterKondisi}
                label="Kondisi"
                onChange={(e) => setFilterKondisi(e.target.value)}
              >
                <MenuItem value="Semua">Semua</MenuItem>
                <MenuItem value="Baik">Baik</MenuItem>
                <MenuItem value="Rusak Ringan">Rusak Ringan</MenuItem>
                <MenuItem value="Rusak Berat">Rusak Berat</MenuItem>
                <MenuItem value="Dipinjam">Dipinjam</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <Typography color="text.secondary">
              Belum ada data inventaris.
            </Typography>
          ) : filteredItems.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 6,
                textAlign: "center",
              }}
            >
              <Typography color="text.secondary">
                Data tidak ditemukan.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ overflow: "auto" }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell width={60}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        No
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Foto
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Nama Barang
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Jumlah
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Satuan
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Kondisi
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Keterangan
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight={600}>
                        Aksi
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedItems.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography fontWeight={600}>
                          {(safePage - 1) * rowsPerPage + index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {item.imageUrl ? (
                          <Box
                            component="button"
                            onClick={() =>
                              handleOpenImagePreview(item.imageUrl || "", item.namaBarang)
                            }
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: 1.5,
                              overflow: "hidden",
                              border: "1px solid",
                              borderColor: "divider",
                              flexShrink: 0,
                              p: 0,
                              cursor: "pointer",
                              bgcolor: "transparent",
                              display: "block",
                            }}
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.namaBarang}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: 1.5,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor: "grey.100",
                              color: "text.secondary",
                              fontSize: 12,
                              fontWeight: 600,
                              border: "1px dashed",
                              borderColor: "divider",
                              flexShrink: 0,
                            }}
                          >
                            Foto
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>{item.namaBarang}</Typography>
                      </TableCell>
                      <TableCell>{item.jumlahBarang}</TableCell>
                      <TableCell>{item.satuan}</TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          label={statusConfig[item.kondisi].label}
                          color={statusConfig[item.kondisi].color}
                          sx={{ fontSize: "13px", height: "28px" }}
                        />
                      </TableCell>
                      <TableCell>{item.keterangan || "-"}</TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                        >
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenEdit(item)}
                            aria-label="edit"
                          >
                            <EditOutlined />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleOpenDeleteConfirm(item)}
                            aria-label="delete"
                          >
                            <DeleteOutline />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {filteredItems.length > 0 && (
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mt={2}
              gap={2}
              flexWrap="wrap"
            >
              <Typography variant="body2" color="text.secondary">
                Menampilkan {paginatedItems.length} dari {filteredItems.length} data
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage === 1}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safePage === totalPages}
                >
                  Berikutnya
                </Button>
              </Stack>
            </Box>
          )}
        </DashboardCard>
      </Stack>

      <Dialog
        open={!!deleteTarget}
        onClose={handleCloseDeleteConfirm}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Apakah kamu yakin ingin menghapus inventaris
            <strong> {deleteTarget?.namaBarang}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDeleteConfirm} variant="outlined">
            Batal
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              if (!deleteTarget) return;
              await handleDelete(deleteTarget.id);
              handleCloseDeleteConfirm();
            }}
          >
            Hapus
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!selectedImage}
        onClose={handleCloseImagePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Preview Foto</Typography>
            <IconButton onClick={handleCloseImagePreview}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedImage.name}
              </Typography>
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  display: "inline-flex",
                  maxWidth: "100%",
                  maxHeight: 480,
                }}
              >
                <img
                  src={selectedImage.src}
                  alt="Preview gambar besar"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 480,
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              {editingId ? "Edit Inventaris" : "Tambah Inventaris"}
            </Typography>
            <IconButton onClick={handleCloseDialog}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Box
            component="form"
            id="inventaris-form"
            onSubmit={handleSubmit}
            sx={{ display: "grid", gap: 2, mt: 1 }}
          >
            <TextField
              label="Nama Barang"
              value={form.namaBarang}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, namaBarang: e.target.value }))
              }
              required
              fullWidth
            />

            <Box
              sx={{
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 2,
                p: 2,
                bgcolor: "grey.50",
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Gambar Barang
              </Typography>

              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCamera />}
                fullWidth
                sx={{
                  height: 56,
                  justifyContent: "flex-start",
                  textTransform: "none",
                  borderStyle: "dashed",
                  borderWidth: 2,
                  mb: preview ? 2 : 0,
                }}
              >
                {imageName || "Pilih Gambar"}
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={handleSelectImage}
                />
              </Button>

              {preview && (
                <Box
                  sx={{
                    borderRadius: 2,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <img
                    src={preview}
                    alt="Preview"
                    style={{
                      width: "100%",
                      height: 220,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </Box>
              )}
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Jumlah Barang"
                type="number"
                value={form.jumlahBarang}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, jumlahBarang: e.target.value }))
                }
                required
                fullWidth
                inputProps={{ min: 0 }}
              />

              <TextField
                label="Satuan"
                value={form.satuan}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, satuan: e.target.value }))
                }
                required
                fullWidth
                placeholder="contoh: unit, box, pcs"
              />
            </Stack>

            <FormControl fullWidth>
              <InputLabel id="kondisi-label">Kondisi</InputLabel>
              <Select
                labelId="kondisi-label"
                value={form.kondisi}
                label="Kondisi"
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, kondisi: e.target.value }))
                }
              >
                <MenuItem value="Baik">Baik</MenuItem>
                <MenuItem value="Rusak Ringan">Rusak Ringan</MenuItem>
                <MenuItem value="Rusak Berat">Rusak Berat</MenuItem>
                <MenuItem value="Dipinjam">Dipinjam</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Keterangan"
              value={form.keterangan}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, keterangan: e.target.value }))
              }
              fullWidth
              multiline
              rows={3}
              placeholder="Opsional"
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            Batal
          </Button>
          <Button
            form="inventaris-form"
            type="submit"
            variant="contained"
            disabled={submitting}
          >
            {submitting
              ? "Menyimpan..."
              : editingId
                ? "Simpan Perubahan"
                : "Simpan"}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default InventarisPage;
