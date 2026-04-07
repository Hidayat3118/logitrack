'use client';
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
} from '@mui/material';
import { IconPencil, IconTrash, IconPlus, IconSearch } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

// ============ TYPES ============
interface Kategori {
  id: string;
  nama: string;
  deskripsi: string;
}

interface KategoriForm {
  nama: string;
  deskripsi: string;
}

const defaultForm: KategoriForm = {
  nama: '',
  deskripsi: '',
};

// ============ COMPONENT ============
const KategoriPage = () => {
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<KategoriForm>(defaultForm);
  const [isEdit, setIsEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ============ REALTIME LISTENER ============
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'kategori'), (snapshot) => {
      const data: Kategori[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Kategori, 'id'>),
      }));
      setKategoriList(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // ============ FILTER ============
  const filtered = kategoriList.filter((k) =>
    k.nama.toLowerCase().includes(search.toLowerCase()) ||
    k.deskripsi.toLowerCase().includes(search.toLowerCase())
  );

  // ============ HANDLERS ============
  const handleOpenTambah = () => {
    setIsEdit(false);
    setForm(defaultForm);
    setOpenDialog(true);
  };

  const handleOpenEdit = (kategori: Kategori) => {
    setIsEdit(true);
    setSelectedId(kategori.id);
    setForm({
      nama: kategori.nama,
      deskripsi: kategori.deskripsi,
    });
    setOpenDialog(true);
  };

  const handleSimpan = async () => {
    setSubmitting(true);
    try {
      if (isEdit && selectedId) {
        await updateDoc(doc(db, 'kategori', selectedId), { ...form });
        toast.success('Kategori berhasil diupdate');
      } else {
        await addDoc(collection(db, 'kategori'), {
          ...form,
          createdAt: serverTimestamp(),
        });
        toast.success('Kategori berhasil ditambahkan');
      }
      setOpenDialog(false);
      setForm(defaultForm);
    } catch (err) {
      toast.error('Gagal menyimpan data');
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
      await deleteDoc(doc(db, 'kategori', selectedId));
      toast.success('Kategori berhasil dihapus');
      setOpenDeleteDialog(false);
    } catch (err) {
      toast.error('Gagal menghapus data');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer title="Kategori" description="Manajemen kategori barang">
      <Grid container spacing={3}>
        <Grid size={{ sm: 12 }}>
          <DashboardCard
            title="Data Kategori"
            action={
              <Button
                variant="contained"
                startIcon={<IconPlus size={20} />}
                onClick={handleOpenTambah}
              >
                Tambah Kategori
              </Button>
            }
          >
            {/* ---- Search ---- */}
            <Box display="flex" mb={3}>
              <TextField
                placeholder="Cari nama atau deskripsi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <IconSearch size={20} style={{ marginRight: 8, opacity: 0.5 }} />
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
                      {['No', 'Nama Kategori', 'Deskripsi', 'Aksi'].map((col) => (
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
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body1" color="textSecondary" py={4}>
                            Tidak ada data kategori
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((kategori, index) => (
                        <TableRow key={kategori.id} hover>
                          <TableCell sx={{ py: 2, width: 60 }}>
                            <Typography variant="body1" color="textSecondary">
                              {index + 1}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body1" fontWeight={500}>
                              {kategori.nama}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body1" color="textSecondary">
                              {kategori.deskripsi || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Box display="flex" gap={1}>
                              <IconButton
                                color="primary"
                                onClick={() => handleOpenEdit(kategori)}
                              >
                                <IconPencil size={22} />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => handleOpenDelete(kategori.id)}
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
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '20px', fontWeight: 600, pt: 3, px: 3 }}>
          {isEdit ? 'Edit Kategori' : 'Tambah Kategori'}
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <TextField
              label="Nama Kategori"
              fullWidth
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="contoh: Elektronik, Alat Tulis, dll"
            />
            <TextField
              label="Deskripsi"
              fullWidth
              multiline
              rows={3}
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              placeholder="Deskripsi singkat kategori (opsional)"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit" size="large">
            Batal
          </Button>
          <Button
            onClick={handleSimpan}
            variant="contained"
            size="large"
            disabled={!form.nama || submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {isEdit ? 'Simpan Perubahan' : 'Tambah'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Dialog Hapus ===== */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '20px', fontWeight: 600, pt: 3, px: 3 }}>
          Hapus Kategori?
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Typography variant="body1" color="textSecondary">
            Data kategori yang dihapus tidak bisa dikembalikan.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button onClick={() => setOpenDeleteDialog(false)} color="inherit" size="large">
            Batal
          </Button>
          <Button
            onClick={handleHapus}
            variant="contained"
            color="error"
            size="large"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
          >
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default KategoriPage;