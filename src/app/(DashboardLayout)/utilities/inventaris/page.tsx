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
import { Add, Close, DeleteOutline, EditOutlined, Search } from "@mui/icons-material";
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
  Baik: { label: 'Baik', color: 'success' },
  'Rusak Ringan': { label: 'Rusak Ringan', color: 'warning' },
  'Rusak Berat': { label: 'Rusak Berat', color: 'error' },
  Dipinjam: { label: 'Dipinjam', color: 'info' },
};

const InventarisPage = () => {
  const [items, setItems] = useState<InventarisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InventarisForm>(emptyForm);
  const [search, setSearch] = useState("");

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

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

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
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
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

  const filteredItems = items.filter((item) =>
    item.namaBarang.toLowerCase().includes(search.toLowerCase().trim())
  );

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
            {/* serch */}
          <Box mb={2}>
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
            <Typography color="text.secondary">
              Tidak ada barang yang cocok dengan pencarian "{search}".
            </Typography>
          ) : (
            <Box sx={{ overflow: "auto" }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
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
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.namaBarang}</TableCell>
                      <TableCell>{item.jumlahBarang}</TableCell>
                      <TableCell>{item.satuan}</TableCell>
                      <TableCell sx={{ py: 2 }}>
                            <Chip
                              label={statusConfig[item.kondisi].label}
                              color={statusConfig[item.kondisi].color}
                              sx={{ fontSize: '13px', height: '28px' }}
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
                            onClick={() => handleDelete(item.id)}
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
        </DashboardCard>
      </Stack>

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
            <IconButton onClick={handleCloseDialog} >
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

            <FormControl fullWidth >
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