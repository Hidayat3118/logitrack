'use client';
import {
  Typography,
  Grid,
  Box,
  Button,
  Chip,
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
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { IconPlus, IconArrowUp, IconArrowDown } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
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
  kategoriNama: string;
}

interface Pemasok {
  id: string;
  nama: string;
}

interface Transaksi {
  id: string;
  tipe: 'masuk' | 'keluar';
  barangId: string;
  namaBarang: string;
  kodeBarang: string;
  kategoriNama: string;
  jumlah: number;
  stokSebelum: number;
  stokSesudah: number;
  pemasokId?: string;
  namaPemasok?: string;
  createdAt: any;
}

interface TransaksiForm {
  tipe: 'masuk' | 'keluar';
  barangId: string;
  jumlah: number;
  pemasokId: string;
}

const defaultForm: TransaksiForm = {
  tipe: 'masuk',
  barangId: '',
  jumlah: 0,
  pemasokId: '',
};

// ============ COMPONENT ============
const TransaksiPage = () => {
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [pemasokList, setPemasokList] = useState<Pemasok[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipe, setFilterTipe] = useState<'semua' | 'masuk' | 'keluar'>('semua');

  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState<TransaksiForm>(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  // ============ LISTENERS ============
  useEffect(() => {
    // transaksi — diurutkan dari terbaru
    const unsubTransaksi = onSnapshot(
      query(collection(db, 'transaksi'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const data: Transaksi[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Transaksi, 'id'>),
        }));
        setTransaksiList(data);
        setLoading(false);
      }
    );

    // barang untuk dropdown
    const unsubBarang = onSnapshot(collection(db, 'barang'), (snapshot) => {
      const data: Barang[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        nama: doc.data().nama,
        kode: doc.data().kode,
        stok: doc.data().stok,
        kategoriNama: doc.data().kategoriNama ?? '',
      }));
      setBarangList(data);
    });

    // pemasok untuk dropdown
    const unsubPemasok = onSnapshot(collection(db, 'pemasok'), (snapshot) => {
      const data: Pemasok[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        nama: doc.data().nama,
      }));
      setPemasokList(data);
    });

    return () => {
      unsubTransaksi();
      unsubBarang();
      unsubPemasok();
    };
  }, []);

  // ============ FILTER ============
  const filtered = transaksiList.filter((t) =>
    filterTipe === 'semua' ? true : t.tipe === filterTipe
  );

  // barang yang dipilih saat ini
  const selectedBarang = barangList.find((b) => b.id === form.barangId);

  // ============ HANDLERS ============
  const handleOpenDialog = (tipe: 'masuk' | 'keluar') => {
    setForm({ ...defaultForm, tipe });
    setOpenDialog(true);
  };

  const handleSimpan = async () => {
    if (!selectedBarang) return;
    if (form.jumlah <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    // validasi stok kalau keluar
    if (form.tipe === 'keluar' && form.jumlah > selectedBarang.stok) {
      toast.error(`Stok tidak cukup. Stok tersedia: ${selectedBarang.stok}`);
      return;
    }

    setSubmitting(true);

    const stokSebelum = selectedBarang.stok;
    const stokSesudah =
      form.tipe === 'masuk'
        ? stokSebelum + form.jumlah
        : stokSebelum - form.jumlah;

    // hitung status baru
    const getStatus = (stok: number) => {
      if (stok === 0) return 'habis';
      if (stok < 10) return 'menipis';
      return 'aman';
    };

    const pemasok = pemasokList.find((p) => p.id === form.pemasokId);

    try {
      // 1. simpan transaksi
      await addDoc(collection(db, 'transaksi'), {
        tipe: form.tipe,
        barangId: selectedBarang.id,
        namaBarang: selectedBarang.nama,
        kodeBarang: selectedBarang.kode,
        kategoriNama: selectedBarang.kategoriNama,
        jumlah: form.jumlah,
        stokSebelum,
        stokSesudah,
        // pemasok hanya kalau masuk
        ...(form.tipe === 'masuk' && pemasok
          ? { pemasokId: pemasok.id, namaPemasok: pemasok.nama }
          : {}),
        createdAt: serverTimestamp(),
      });

      // 2. update stok barang
      await updateDoc(doc(db, 'barang', selectedBarang.id), {
        stok: stokSesudah,
        status: getStatus(stokSesudah),
      });

      toast.success(
        form.tipe === 'masuk'
          ? `Stok bertambah ${form.jumlah} unit`
          : `Stok berkurang ${form.jumlah} unit`
      );
      setOpenDialog(false);
      setForm(defaultForm);
    } catch (err) {
      toast.error('Gagal menyimpan transaksi');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // format tanggal
  const formatTanggal = (timestamp: any) => {
    if (!timestamp) return '—';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <PageContainer title="Transaksi" description="Riwayat transaksi barang">
      <Grid container spacing={3}>
        <Grid size={{ sm: 12 }}>
          <DashboardCard
            title="Transaksi Barang"
            action={
              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<IconArrowUp size={20} />}
                  onClick={() => handleOpenDialog('keluar')}
                >
                  Barang Keluar
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<IconArrowDown size={20} />}
                  onClick={() => handleOpenDialog('masuk')}
                >
                  Barang Masuk
                </Button>
              </Box>
            }
          >
            {/* ---- Filter Tipe ---- */}
            <Box mb={3}>
              <ToggleButtonGroup
                value={filterTipe}
                exclusive
                onChange={(_, val) => val && setFilterTipe(val)}
                size="small"
              >
                <ToggleButton value="semua">
                  <Typography variant="body1">Semua</Typography>
                </ToggleButton>
                <ToggleButton value="masuk">
                  <Typography variant="body1">Masuk</Typography>
                </ToggleButton>
                <ToggleButton value="keluar">
                  <Typography variant="body1">Keluar</Typography>
                </ToggleButton>
              </ToggleButtonGroup>
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
                      {['Waktu', 'Barang', 'Kategori', 'Tipe', 'Jumlah', 'Stok Sesudah', 'Pemasok'].map(
                        (col) => (
                          <TableCell key={col} sx={{ py: 2 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {col}
                            </Typography>
                          </TableCell>
                        )
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body1" color="textSecondary" py={4}>
                            Belum ada transaksi
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((t) => (
                        <TableRow key={t.id} hover>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body2" color="textSecondary">
                              {formatTanggal(t.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body1" fontWeight={500}>
                              {t.namaBarang}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" fontFamily="monospace">
                              {t.kodeBarang}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body1" color="textSecondary">
                              {t.kategoriNama || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Chip
                              label={t.tipe === 'masuk' ? 'Masuk' : 'Keluar'}
                              color={t.tipe === 'masuk' ? 'success' : 'error'}
                              size="small"
                              sx={{ fontSize: '13px', height: '28px' }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography
                              variant="body1"
                              fontWeight={500}
                              color={t.tipe === 'masuk' ? 'success.main' : 'error.main'}
                            >
                              {t.tipe === 'masuk' ? `+${t.jumlah}` : `-${t.jumlah}`}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body1">{t.stokSesudah}</Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body1" color="textSecondary">
                              {t.namaPemasok || '—'}
                            </Typography>
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

      {/* ===== Dialog Transaksi ===== */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '20px', fontWeight: 600, pt: 3, px: 3 }}>
          {form.tipe === 'masuk' ? 'Barang Masuk' : 'Barang Keluar'}
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>

            {/* pilih barang */}
            <TextField
              select
              label="Pilih Barang"
              fullWidth
              value={form.barangId}
              onChange={(e) => setForm({ ...form, barangId: e.target.value })}
            >
              {barangList.length === 0 ? (
                <MenuItem disabled>
                  <Typography variant="body1" color="textSecondary">
                    Belum ada barang
                  </Typography>
                </MenuItem>
              ) : (
                barangList.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    <Box>
                      <Typography variant="body1">{b.nama}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Stok saat ini: {b.stok} — {b.kode}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
            </TextField>

            {/* pilih pemasok — hanya kalau masuk */}
            {form.tipe === 'masuk' && (
              <TextField
                select
                label="Pilih Pemasok"
                fullWidth
                value={form.pemasokId}
                onChange={(e) => setForm({ ...form, pemasokId: e.target.value })}
              >
                {pemasokList.length === 0 ? (
                  <MenuItem disabled>
                    <Typography variant="body1" color="textSecondary">
                      Belum ada pemasok
                    </Typography>
                  </MenuItem>
                ) : (
                  pemasokList.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      <Typography variant="body1">{p.nama}</Typography>
                    </MenuItem>
                  ))
                )}
              </TextField>
            )}

            {/* jumlah */}
            <TextField
              label="Jumlah"
              fullWidth
              type="number"
              value={form.jumlah}
              onChange={(e) => setForm({ ...form, jumlah: Number(e.target.value) })}
              helperText={
                selectedBarang
                  ? `Stok saat ini: ${selectedBarang.stok} unit`
                  : ' '
              }
            />

            {/* preview stok sesudah */}
            {selectedBarang && form.jumlah > 0 && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: form.tipe === 'masuk' ? 'success.light' : 'error.light',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" fontWeight={500}>
                  Stok sesudah transaksi:
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {form.tipe === 'masuk'
                    ? selectedBarang.stok + form.jumlah
                    : selectedBarang.stok - form.jumlah}{' '}
                  unit
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit" size="large">
            Batal
          </Button>
          <Button
            onClick={handleSimpan}
            variant="contained"
            color={form.tipe === 'masuk' ? 'success' : 'error'}
            size="large"
            disabled={
              !form.barangId ||
              form.jumlah <= 0 ||
              (form.tipe === 'masuk' && !form.pemasokId) ||
              submitting
            }
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {form.tipe === 'masuk' ? 'Konfirmasi Masuk' : 'Konfirmasi Keluar'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default TransaksiPage;