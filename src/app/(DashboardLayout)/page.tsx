"use client";
import { Grid, Box, Typography, CircularProgress } from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useRequireAuth } from "@/hooks/useRequereAuth";
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";
import {
  IconPackage,
  IconStack2,
  IconArrowDown,
  IconArrowUp,
  IconAlertTriangle,
} from "@tabler/icons-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";

// ============ TYPES ============
interface Barang {
  id: string;
  nama: string;
  kode: string;
  stok: number;
  status: "aman" | "menipis" | "habis";
}

interface Transaksi {
  id: string;
  tipe: "masuk" | "keluar";
  namaBarang: string;
  kodeBarang: string;
  jumlah: number;
  namaPemasok?: string;
  createdAt: Timestamp;
}

// ============ STAT CARD ============
interface StatCardProps {
  title: string;
  value: number | string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const StatCard = ({ title, value, sub, icon, color, bgColor }: StatCardProps) => (
  <Box
    sx={{
      bgcolor: bgColor,
      borderRadius: 3,
      p: 3,
      display: "flex",
      alignItems: "center",
      gap: 2,
      height: "100%",
    }}
  >
    <Box
      sx={{
        width: 52,
        height: 52,
        borderRadius: 2,
        bgcolor: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: "#fff",
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="body2" color="textSecondary" mb={0.5}>
        {title}
      </Typography>
      <Typography variant="h4" fontWeight={600}>
        {value}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        {sub}
      </Typography>
    </Box>
  </Box>
);

// ============ DASHBOARD ============
const Dashboard = () => {
  const { user, loading: authLoading } = useRequireAuth();

  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [transaksiHariIni, setTransaksiHariIni] = useState<Transaksi[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    // listener barang
    const unsubBarang = onSnapshot(collection(db, "barang"), (snapshot) => {
      const data: Barang[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Barang, "id">),
      }));
      setBarangList(data);
    });

    // listener transaksi — 10 terbaru untuk riwayat
    const unsubTransaksi = onSnapshot(
      query(collection(db, "transaksi"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const data: Transaksi[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Transaksi, "id">),
        }));
        setTransaksiList(data);

        // filter hari ini
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const hariIni = data.filter((t) => {
          if (!t.createdAt) return false;
          return t.createdAt.toDate() >= today;
        });
        setTransaksiHariIni(hariIni);
        setLoadingData(false);
      }
    );

    return () => {
      unsubBarang();
      unsubTransaksi();
    };
  }, []);

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  // ============ KALKULASI STATISTIK ============
  const totalBarang = barangList.length;
  const totalStok = barangList.reduce((acc, b) => acc + b.stok, 0);
  const masukHariIni = transaksiHariIni
    .filter((t) => t.tipe === "masuk")
    .reduce((acc, t) => acc + t.jumlah, 0);
  const keluarHariIni = transaksiHariIni
    .filter((t) => t.tipe === "keluar")
    .reduce((acc, t) => acc + t.jumlah, 0);
  const barangMenipis = barangList.filter(
    (b) => b.status === "menipis" || b.status === "habis"
  );

  // ============ DATA GRAFIK — 7 hari terakhir ============
  const getGrafikData = () => {
    const days: { label: string; masuk: number; keluar: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const label = date.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
      });

      const masuk = transaksiList
        .filter((t) => {
          if (!t.createdAt) return false;
          const d = t.createdAt.toDate();
          return t.tipe === "masuk" && d >= date && d < nextDate;
        })
        .reduce((acc, t) => acc + t.jumlah, 0);

      const keluar = transaksiList
        .filter((t) => {
          if (!t.createdAt) return false;
          const d = t.createdAt.toDate();
          return t.tipe === "keluar" && d >= date && d < nextDate;
        })
        .reduce((acc, t) => acc + t.jumlah, 0);

      days.push({ label, masuk, keluar });
    }
    return days;
  };

  const statusConfig = {
    aman:    { label: "Aman",    color: "success" as const },
    menipis: { label: "Menipis", color: "warning" as const },
    habis:   { label: "Habis",   color: "error"   as const },
  };

  const formatTanggal = (timestamp: Timestamp) => {
    if (!timestamp) return "—";
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(timestamp.toDate());
  };

  return (
    <PageContainer title="Dashboard" description="Dashboard LogiTrack">
      <Box>
        <Grid container spacing={3}>

          {/* ============ STAT CARDS ============ */}
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Total Barang"
              value={totalBarang}
              sub="jenis barang"
              icon={<IconPackage size={26} />}
              color="#185FA5"
              bgColor="#E6F1FB"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Total Stok"
              value={totalStok.toLocaleString("id-ID")}
              sub="unit keseluruhan"
              icon={<IconStack2 size={26} />}
              color="#534AB7"
              bgColor="#EEEDFE"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Masuk Hari Ini"
              value={`+${masukHariIni}`}
              sub="unit masuk"
              icon={<IconArrowDown size={26} />}
              color="#0F6E56"
              bgColor="#E1F5EE"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              title="Keluar Hari Ini"
              value={`-${keluarHariIni}`}
              sub="unit keluar"
              icon={<IconArrowUp size={26} />}
              color="#993C1D"
              bgColor="#FAECE7"
            />
          </Grid>

          {/* ============ GRAFIK 7 HARI ============ */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <DashboardCard title="Tren Masuk vs Keluar (7 Hari Terakhir)">
              {loadingData ? (
                <Box display="flex" justifyContent="center" py={6}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getGrafikData()} barSize={20}>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 13, borderRadius: 8 }}
                      cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                    <Bar dataKey="masuk" name="Masuk" fill="#1D9E75" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="keluar" name="Keluar" fill="#D85A30" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </DashboardCard>
          </Grid>

          {/* ============ ALERT STOK MENIPIS ============ */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <DashboardCard title="Perhatian Stok">
              {loadingData ? (
                <Box display="flex" justifyContent="center" py={6}>
                  <CircularProgress />
                </Box>
              ) : barangMenipis.length === 0 ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  py={4}
                  gap={1}
                >
                  <Typography variant="body1" color="success.main" fontWeight={500}>
                    Semua stok aman
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Tidak ada barang yang perlu diperhatikan
                  </Typography>
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={2}>
                  {barangMenipis.map((b) => (
                    <Box
                      key={b.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: b.status === "habis" ? "#FCEBEB" : "#FAEEDA",
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <IconAlertTriangle
                          size={18}
                          color={b.status === "habis" ? "#A32D2D" : "#854F0B"}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {b.nama}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {b.kode}
                          </Typography>
                        </Box>
                      </Box>
                      <Box textAlign="right">
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color={b.status === "habis" ? "error.main" : "warning.main"}
                        >
                          {b.stok} unit
                        </Typography>
                        <Chip
                          label={statusConfig[b.status].label}
                          color={statusConfig[b.status].color}
                          size="small"
                          sx={{ fontSize: "11px", height: "22px", mt: 0.5 }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </DashboardCard>
          </Grid>

          {/* ============ RIWAYAT TRANSAKSI TERBARU ============ */}
          <Grid size={12}>
            <DashboardCard title="Transaksi Terbaru">
              {loadingData ? (
                <Box display="flex" justifyContent="center" py={6}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {["Waktu", "Barang", "Tipe", "Jumlah", "Pemasok"].map((col) => (
                          <TableCell key={col} sx={{ py: 2 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {col}
                            </Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transaksiList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography variant="body1" color="textSecondary" py={4}>
                              Belum ada transaksi
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        transaksiList.slice(0, 8).map((t) => (
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
                              <Typography
                                variant="body2"
                                color="textSecondary"
                                fontFamily="monospace"
                              >
                                {t.kodeBarang}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 2 }}>
                              <Chip
                                label={t.tipe === "masuk" ? "Masuk" : "Keluar"}
                                color={t.tipe === "masuk" ? "success" : "error"}
                                size="small"
                                sx={{ fontSize: "13px", height: "28px" }}
                              />
                            </TableCell>
                            <TableCell sx={{ py: 2 }}>
                              <Typography
                                variant="body1"
                                fontWeight={500}
                                color={t.tipe === "masuk" ? "success.main" : "error.main"}
                              >
                                {t.tipe === "masuk" ? `+${t.jumlah}` : `-${t.jumlah}`}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 2 }}>
                              <Typography variant="body1" color="textSecondary">
                                {t.namaPemasok || "—"}
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
      </Box>
    </PageContainer>
  );
};

export default Dashboard;