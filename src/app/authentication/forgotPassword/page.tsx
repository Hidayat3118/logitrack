"use client";
import Link from "next/link";
import {
  Grid,
  Box,
  Card,
  Stack,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import Logo from "@/app/(DashboardLayout)/layout/shared/logo/Logo";
import { IconArrowLeft, IconMail } from "@tabler/icons-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [terkirim, setTerkirim] = useState(false);

  const handleReset = async () => {
    if (!email) {
      toast.error("Masukkan email terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setTerkirim(true);
      toast.success("Email reset password berhasil dikirim");
    } catch (err: any) {
      switch (err.code) {
        case "auth/user-not-found":
          toast.error("Email tidak ditemukan");
          break;
        case "auth/invalid-email":
          toast.error("Format email tidak valid");
          break;
        case "auth/too-many-requests":
          toast.error("Terlalu banyak percobaan, coba lagi nanti");
          break;
        default:
          toast.error("Gagal mengirim email reset password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Lupa Password" description="Reset password LogiTrack">
      <Box
        sx={{
          position: "relative",
          "&:before": {
            content: '""',
            background: "radial-gradient(#d2f1df, #d3d7fa, #bad8f4)",
            backgroundSize: "400% 400%",
            animation: "gradient 15s ease infinite",
            position: "absolute",
            height: "100%",
            width: "100%",
            opacity: "0.3",
          },
        }}
      >
        <Grid
          container
          spacing={0}
          justifyContent="center"
          sx={{ height: "100vh" }}
        >
          <Grid
            display="flex"
            justifyContent="center"
            alignItems="center"
            size={{ xs: 12, sm: 12, lg: 4, xl: 3 }}
          >
            <Card
              elevation={9}
              sx={{ p: 4, zIndex: 1, width: "100%", maxWidth: "500px" }}
            >
              {/* Logo */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  py: 2,
                  textDecoration: "none",
                }}
              >
                <img src="/icon.svg" width={46} height={46} />
                <Typography fontSize={24} fontWeight={600}>
                  LogiTrack
                </Typography>
              </Box>

              {/* Belum terkirim — tampilkan form */}
              {!terkirim ? (
                <>
                  <Typography
                    variant="body1"
                    color="textSecondary"
                    textAlign="center"
                    mb={3}
                  >
                    Masukkan email kamu dan kami akan kirimkan link untuk reset
                    password
                  </Typography>

                  <Box display="flex" flexDirection="column" gap={3}>
                    <TextField
                      label="Email"
                      fullWidth
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleReset()}
                      placeholder="contoh: kamu@email.com"
                    />

                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      onClick={handleReset}
                      disabled={!email || loading}
                      startIcon={
                        loading ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <IconMail size={20} />
                        )
                      }
                    >
                      {loading ? "Mengirim..." : "Kirim Link Reset"}
                    </Button>
                  </Box>

                  <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    mt={3}
                    gap={1}
                  >
                    <Typography color="textSecondary" variant="body1">
                      Ingat password kamu?
                    </Typography>
                    <Typography
                      component={Link}
                      href="/authentication/login"
                      variant="body1"
                      fontWeight={500}
                      sx={{ textDecoration: "none", color: "primary.main" }}
                    >
                      Masuk di sini
                    </Typography>
                  </Stack>
                </>
              ) : (
                // ✅ Sudah terkirim — tampilkan konfirmasi
                <>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      bgcolor: "#E1F5EE",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 3,
                    }}
                  >
                    <IconMail size={32} color="#0F6E56" />
                  </Box>

                  <Typography
                    variant="h4"
                    fontWeight={600}
                    textAlign="center"
                    mb={1}
                  >
                    Email Terkirim!
                  </Typography>

                  <Typography
                    variant="body1"
                    color="textSecondary"
                    textAlign="center"
                    mb={1}
                  >
                    Link reset password sudah dikirim ke
                  </Typography>

                  <Typography
                    variant="body1"
                    fontWeight={600}
                    textAlign="center"
                    color="primary.main"
                    mb={3}
                  >
                    {email}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="textSecondary"
                    textAlign="center"
                    mb={4}
                  >
                    Cek inbox atau folder spam kamu. Link akan kadaluarsa dalam
                    1 jam.
                  </Typography>

                  {/* kirim ulang */}
                  <Button
                    variant="outlined"
                    fullWidth
                    size="large"
                    onClick={() => {
                      setTerkirim(false);
                      setEmail("");
                    }}
                    sx={{ mb: 2 }}
                  >
                    Kirim ke email lain
                  </Button>

                  <Button
                    component={Link}
                    href="/authentication/login"
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<IconArrowLeft size={20} />}
                  >
                    Kembali ke Login
                  </Button>
                </>
              )}
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default ForgotPassword;
