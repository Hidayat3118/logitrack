"use client";
import {
  Typography,
  Grid,
  Box,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import {
  IconPencil,
  IconTrash,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";

// ============ TYPES ============
interface Pemasok {
  id: string;
  nama: string;
  kontak: string;
  email: string;
  alamat: string;
}

interface PemasokForm {
  nama: string;
  kontak: string;
  email: string;
  alamat: string;
}

const defaultForm: PemasokForm = {
  nama: "",
  kontak: "",
  email: "",
  alamat: "",
};

// ============ COMPONENT ============
const PemasokPage = () => {
  const [pemasokList, setPemasokList] = useState<Pemasok[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<PemasokForm>(defaultForm);
  const [isEdit, setIsEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ============ REALTIME LISTENER ============
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pemasok"), (snapshot) => {
      const data: Pemasok[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Pemasok, "id">),
      }));
      setPemasokList(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // ============ FILTER ============
  const filtered = pemasokList.filter(
    (p) =>
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.kontak.includes(search) ||
      p.email.toLowerCase().includes(search.toLowerCase()),
  );

  // ============ HANDLERS ============
  const handleOpenTambah = () => {
    setIsEdit(false);
    setForm(defaultForm);
    setOpenDialog(true);
  };

  const handleOpenEdit = (pemasok: Pemasok) => {
    setIsEdit(true);
    setSelectedId(pemasok.id);
    setForm({
      nama: pemasok.nama,
      kontak: pemasok.kontak,
      email: pemasok.email,
      alamat: pemasok.alamat,
    });
    setOpenDialog(true);
  };

  const handleSimpan = async () => {
    setSubmitting(true);
    try {
      if (isEdit && selectedId) {
        await updateDoc(doc(db, "pemasok", selectedId), { ...form });
        toast.success("Pemasok berhasil diupdate");
      } else {
        await addDoc(collection(db, "pemasok"), {
          ...form,
          createdAt: serverTimestamp(),
        });
        toast.success("Pemasok berhasil ditambahkan");
      }
      setOpenDialog(false);
      setForm(defaultForm);
    } catch (err) {
      toast.error("Gagal menyimpan data");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (id: string) => {
    setSelectedId(id);
    setOpenDeleteDialog(true);
  };

  const handleHapus = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      await deleteDoc(doc(db, "pemasok", selectedId));
      toast.success("Pemasok berhasil dihapus");
      setOpenDeleteDialog(false);
    } catch (err) {
      toast.error("Gagal menghapus data");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = form.nama && form.kontak && form.email && form.alamat;

  return (
    <PageContainer title="Pemasok" description="Manajemen data pemasok">
      <Grid container spacing={3}>
        <Grid size={{ sm: 12 }}>
          <DashboardCard
            title="Data Pemasok"
            action={
              <Button
                variant="contained"
                startIcon={<IconPlus size={20} />}
                onClick={handleOpenTambah}
              >
                Tambah Supplier
              </Button>
            }
          >
            {/* ---- Search ---- */}
            <Box display="flex" mb={3}>
              <TextField
                size="medium"
                placeholder="Cari nama, kontak, atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <IconSearch
                      size={20}
                      style={{ marginRight: 8, opacity: 0.5 }}
                    />
                  ),
                }}
                sx={{ width: 340 }}
              />
            </Box>

            {/* ---- Tabel ---- */}
            {loading ? (
              <Box display="flex" justifyContent="center" py={6}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {[
                        "Nama Pemasok",
                        "Kontak",
                        "Email",
                        "Alamat",
                        "Aksi",
                      ].map((col) => (
                        <TableCell key={col} sx={{ py: 2 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {col}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography
                            variant="body1"
                            color="textSecondary"
                            py={4}
                          >
                            Tidak ada data pemasok
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((pemasok) => (
                        <TableRow key={pemasok.id} hover>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body1" fontWeight={500}>
                              {pemasok.nama}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body1">
                              {pemasok.kontak}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body1" color="textSecondary">
                              {pemasok.email}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body1" color="textSecondary">
                              {pemasok.alamat}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Box display="flex" gap={1}>
                              <IconButton
                                color="primary"
                                onClick={() => handleOpenEdit(pemasok)}
                              >
                                <IconPencil size={22} />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => handleOpenDelete(pemasok.id)}
                              >
                                <IconTrash size={22} />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DashboardCard>
        </Grid>
      </Grid>

      {/* ===== Dialog Tambah / Edit ===== */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: "20px", fontWeight: 600, pt: 3, px: 3 }}>
          {isEdit ? "Edit Pemasok" : "Tambah Pemasok"}
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <TextField
              label="Nama Pemasok"
              fullWidth
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="contoh: PT. Maju Jaya"
            />
            <TextField
              label="Nomor Kontak"
              fullWidth
              value={form.kontak}
              onChange={(e) => setForm({ ...form, kontak: e.target.value })}
              placeholder="contoh: 081234567890"
            />
            <TextField
              label="Email"
              fullWidth
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contoh: pemasok@email.com"
            />
            <TextField
              label="Alamat"
              fullWidth
              multiline
              rows={3}
              value={form.alamat}
              onChange={(e) => setForm({ ...form, alamat: e.target.value })}
              placeholder="contoh: Jl. Industri No. 5, Banjarmasin"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            color="inherit"
            size="large"
          >
            Batal
          </Button>
          <Button
            onClick={handleSimpan}
            variant="contained"
            size="large"
            disabled={!isFormValid || submitting}
            startIcon={
              submitting ? <CircularProgress size={18} color="inherit" /> : null
            }
          >
            {isEdit ? "Simpan Perubahan" : "Tambah"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Dialog Hapus ===== */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: "20px", fontWeight: 600, pt: 3, px: 3 }}>
          Hapus Pemasok?
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Typography variant="body1" color="textSecondary">
            Data pemasok yang dihapus tidak bisa dikembalikan.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            color="inherit"
            size="large"
          >
            Batal
          </Button>
          <Button
            onClick={handleHapus}
            variant="contained"
            color="error"
            size="large"
            disabled={submitting}
            startIcon={
              submitting ? <CircularProgress size={18} color="inherit" /> : null
            }
          >
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default PemasokPage;
