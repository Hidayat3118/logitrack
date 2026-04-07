'use client';
import {
  Typography,
  Grid,
  Box,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
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
interface Barang {
  id: string;
  nama: string;
  kode: string;
  stok: number;
  status: 'aman' | 'menipis' | 'habis';
  kategoriId: string;
  kategoriNama: string;
}

interface BarangForm {
  nama: string;
  kode: string;
  stok: number;
  kategoriId: string;
  kategoriNama: string;
}

interface Kategori {
  id: string;
  nama: string;
}

// ============ HELPER ============
const getStatus = (stok: number): Barang['status'] => {
  if (stok === 0) return 'habis';
  if (stok < 10) return 'menipis';
  return 'aman';
};

const statusConfig = {
  aman:    { label: 'Aman',    color: 'success' as const },
  menipis: { label: 'Menipis', color: 'warning' as const },
  habis:   { label: 'Habis',   color: 'error'   as const },
};

const defaultForm: BarangForm = {
  nama: '',
  kode: '',
  stok: 0,
  kategoriId: '',
  kategoriNama: '',
};

// ============ COMPONENT ============
const DataBarangPage = () => {
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);  // ✅ list kategori
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');

  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<BarangForm>(defaultForm);
  const [isEdit, setIsEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ============ REALTIME LISTENER ============
  useEffect(() => {
    // listener barang
    const unsubBarang = onSnapshot(collection(db, 'barang'), (snapshot) => {
      const data: Barang[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Barang, 'id'>),
      }));
      setBarangList(data);
      setLoading(false);
    });

    // ✅ listener kategori untuk dropdown
    const unsubKategori = onSnapshot(collection(db, 'kategori'), (snapshot) => {
      const data: Kategori[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        nama: doc.data().nama,
      }));
      setKategoriList(data);
    });

    return () => {
      unsubBarang();
      unsubKategori();
    };
  }, []);

  // ============ FILTER ============
  const filtered = barangList.filter((b) => {
    const matchSearch =
      b.nama.toLowerCase().includes(search.toLowerCase()) ||
      b.kode.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'semua' || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ============ HANDLERS ============
  const handleOpenTambah = () => {
    setIsEdit(false);
    setForm(defaultForm);
    setOpenDialog(true);
  };

  const handleOpenEdit = (barang: Barang) => {
    setIsEdit(true);
    setSelectedId(barang.id);
    setForm({
      nama: barang.nama,
      kode: barang.kode,
      stok: barang.stok,
      kategoriId: barang.kategoriId,
      kategoriNama: barang.kategoriNama,
    });
    setOpenDialog(true);
  };

  // ✅ handle pilih kategori — simpan id dan nama sekaligus
  const handlePilihKategori = (kategoriId: string) => {
    const kategori = kategoriList.find((k) => k.id === kategoriId);
    setForm({
      ...form,
      kategoriId,
      kategoriNama: kategori?.nama ?? '',
    });
  };

  const handleSimpan = async () => {
    setSubmitting(true);
    const status = getStatus(form.stok);
    try {
      if (isEdit && selectedId) {
        await updateDoc(doc(db, 'barang', selectedId), {
          nama: form.nama,
          kode: form.kode,
          stok: form.stok,
          status,
          kategoriId: form.kategoriId,
          kategoriNama: form.kategoriNama,
        });
        toast.success('Barang berhasil diupdate');
      } else {
        await addDoc(collection(db, 'barang'), {
          nama: form.nama,
          kode: form.kode,
          stok: form.stok,
          status,
          kategoriId: form.kategoriId,
          kategoriNama: form.kategoriNama,
          createdAt: serverTimestamp(),
        });
        toast.success('Barang berhasil ditambahkan');
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
      await deleteDoc(doc(db, 'barang', selectedId));
      toast.success('Barang berhasil dihapus');
      setOpenDeleteDialog(false);
    } catch (err) {
      toast.error('Gagal menghapus data');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer title="Data Barang" description="Manajemen data barang">
      <Grid container spacing={3}>
        <Grid size={{ sm: 12 }}>
          <DashboardCard
            title="Data Barang"
            action={
              <Button
                variant="contained"
                startIcon={<IconPlus size={20} />}
                onClick={handleOpenTambah}
              >
                Tambah Barang
              </Button>
            }
          >
            {/* ---- Search & Filter ---- */}
            <Box display="flex" gap={2} mb={3}>
              <TextField
                placeholder="Cari nama atau kode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <IconSearch size={20} style={{ marginRight: 8, opacity: 0.5 }} />
                  ),
                }}
                sx={{ width: 300 }}
              />
              <TextField
                select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                sx={{ width: 200 }}
              >
                <MenuItem value="semua"><Typography variant="body1">Semua Status</Typography></MenuItem>
                <MenuItem value="aman"><Typography variant="body1">Aman</Typography></MenuItem>
                <MenuItem value="menipis"><Typography variant="body1">Menipis</Typography></MenuItem>
                <MenuItem value="habis"><Typography variant="body1">Habis</Typography></MenuItem>
              </TextField>
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
                      {['Nama Barang', 'Kode', 'Kategori', 'Stok', 'Status', 'Aksi'].map((col) => (
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
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body1" color="textSecondary" py={4}>
                            Tidak ada data barang
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((barang) => (
                        <TableRow key={barang.id} hover>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body1" fontWeight={500}>
                              {barang.nama}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body1" color="textSecondary" fontFamily="monospace">
                              {barang.kode}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body1" color="textSecondary">
                              {barang.kategoriNama || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body1">{barang.stok}</Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Chip
                              label={statusConfig[barang.status].label}
                              color={statusConfig[barang.status].color}
                              sx={{ fontSize: '13px', height: '28px' }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Box display="flex" gap={1}>
                              <IconButton color="primary" onClick={() => handleOpenEdit(barang)}>
                                <IconPencil size={22} />
                              </IconButton>
                              <IconButton color="error" onClick={() => handleOpenDelete(barang.id)}>
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
          {isEdit ? 'Edit Barang' : 'Tambah Barang'}
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <TextField
              label="Nama Barang"
              fullWidth
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
            />
            <TextField
              label="Kode Barang"
              fullWidth
              value={form.kode}
              onChange={(e) => setForm({ ...form, kode: e.target.value })}
              placeholder="contoh: BRG-001"
            />

            {/* ✅ dropdown kategori */}
            <TextField
              select
              label="Kategori"
              fullWidth
              value={form.kategoriId}
              onChange={(e) => handlePilihKategori(e.target.value)}
            >
              {kategoriList.length === 0 ? (
                <MenuItem disabled>
                  <Typography variant="body1" color="textSecondary">
                    Belum ada kategori — tambah dulu di menu Kategori
                  </Typography>
                </MenuItem>
              ) : (
                kategoriList.map((k) => (
                  <MenuItem key={k.id} value={k.id}>
                    <Typography variant="body1">{k.nama}</Typography>
                  </MenuItem>
                ))
              )}
            </TextField>

            <TextField
              label="Stok Awal"
              fullWidth
              type="number"
              value={form.stok}
              onChange={(e) => setForm({ ...form, stok: Number(e.target.value) })}
            />
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body1" color="textSecondary">
                Status otomatis:
              </Typography>
              <Chip
                label={statusConfig[getStatus(form.stok)].label}
                color={statusConfig[getStatus(form.stok)].color}
                sx={{ fontSize: '13px', height: '28px' }}
              />
            </Box>
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
            disabled={!form.nama || !form.kode || !form.kategoriId || submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {isEdit ? 'Simpan Perubahan' : 'Tambah'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Dialog Hapus ===== */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '20px', fontWeight: 600, pt: 3, px: 3 }}>
          Hapus Barang?
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Typography variant="body1" color="textSecondary">
            Data barang yang dihapus tidak bisa dikembalikan.
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

export default DataBarangPage;