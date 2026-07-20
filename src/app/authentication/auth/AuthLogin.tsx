import React, { useState } from "react";
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Button,
  Stack,
  Checkbox,
  TextField,
  InputAdornment,
  IconButton
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import Link from "next/link";
import CustomTextField from "@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField";
import { LoginForm } from "@/types/forms";
import { useRouter } from "next/navigation";
// firebase
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

interface LoginType {
  title?: string;
  subtitle?: React.ReactNode;
  subtext?: React.ReactNode;
}
const AuthLogin = ({ title, subtitle, subtext }: LoginType) => {
  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const router = useRouter();

  const handleClickShowPassword = () => setShowPassword((prev) => !prev);
  const handleMouseDownPassword = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };

  // handle login
  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      console.log("login berhasil");
      toast.success("Berhasi login");
      router.push("/utilities/inventaris");
    } catch (err: any) {
      switch (err.code) {
        case "auth/user-not-found": // legacy, jarang muncul lagi
          setError("Email tidak ditemukan");
          toast.error("Email tidak ditemukan");
          break;

        case "auth/wrong-password": // legacy, jarang muncul lagi
          setError("Password salah");
          toast.error("Password salah");
          break;

        case "auth/invalid-credential": // ✅ ini yang sekarang dipakai Firebase
          setError("Email atau password salah");
          toast.error("Email atau password salah");
          break;

        case "auth/invalid-email":
          setError("Format email tidak valid");
          toast.error("Format email tidak valid");
          break;

        case "auth/too-many-requests":
          setError("Terlalu banyak percobaan, coba lagi nanti");
          toast.error("Terlalu banyak percobaan, coba lagi nanti");
          break;

        default:
          setError("Login gagal, coba lagi");
          toast.error("Login gagal, coba lagi");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const testing = () => {
    toast.success("norif berhasil");
  };

  return (
    <>
      {title ? (
        <Typography fontWeight="700" variant="h2" mb={1}>
          {title}
        </Typography>
      ) : null}

      {subtext}

      <Stack>
        <Box>
          <TextField
            label="Email"
            variant="outlined"
            type="email"
            placeholder="Contoh: user@example.com"
            fullWidth
            value={form.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, email: e.target.value })
            }
          />
        </Box>
        <Box mt="25px">
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            fullWidth
            value={form.password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, password: e.target.value })
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Stack
          justifyContent="space-between"
          direction="row"
          alignItems="center"
          my={2}
        >
          <FormGroup>
            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="Remeber this Device"
            />
          </FormGroup>
        </Stack>
      </Stack>

      <Box>
        <Button
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          onClick={handleLogin}
          disabled={loading}
          type="button"
        >
          {loading ? "Loading..." : "Sign In"}
        </Button>
      </Box>

      {subtitle}
    </>
  );
};

export default AuthLogin;