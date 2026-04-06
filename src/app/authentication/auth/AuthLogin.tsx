import React, { useState } from "react";
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Button,
  Stack,
  Checkbox,
} from "@mui/material";
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
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter()
  // handle login
  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      console.log("login berhasil");
      toast.success("Berhasi login");
      router.push("/");
    } catch (err: any) {
      // Pesan error yang lebih ramah
      switch (err.code) {
        case "auth/user-not-found":
          setError("Email tidak ditemukan");
          break;
        case "auth/wrong-password":
          setError("Password salah");
          break;
        case "auth/invalid-email":
          setError("Format email tidak valid");
          break;
        case "auth/too-many-requests":
          setError("Terlalu banyak percobaan, coba lagi nanti");
          break;
        default:
          setError("Login gagal, coba lagi");
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
          <Typography
            variant="subtitle1"
            fontWeight={600}
            component="label"
            htmlFor="username"
            mb="5px"
          >
            Email
          </Typography>
          <CustomTextField
            variant="outlined"
            fullWidth
            value={form.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, email: e.target.value })
            }
          />
        </Box>
        <Box mt="25px">
          <Typography
            variant="subtitle1"
            fontWeight={600}
            component="label"
            htmlFor="password"
            mb="5px"
          >
            Password
          </Typography>
          <CustomTextField
            type="password"
            variant="outlined"
            fullWidth
            value={form.password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, password: e.target.value })
            }
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
          <Typography
            component={Link}
            href="/"
            fontWeight="500"
            sx={{ textDecoration: "none", color: "primary.main" }}
          >
            Forgot Password ?
          </Typography>
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
