import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import Link from "next/link";
import CustomTextField from "@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField";
import { Stack } from "@mui/system";
// type
import { RegisterForm } from "@/types/forms";
// firebase
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

interface registerType {
  title?: string;
  subtitle?: React.ReactNode;
  subtext?: React.ReactNode;
}

const AuthRegister = ({ title, subtitle, subtext }: registerType) => {
  const [form, setForm] = useState<RegisterForm>({
    nama: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState<Boolean>(false);
  const [error, setError] = useState<string | null>(null);

//   const handleRegister = async () => {
//     try {
//       const userCredential = await createUserWithEmailAndPassword(
//         auth,
//         form.email,
//         form.password,
//       );

      
//       const user = userCredential.user;
//       console.log("Register berhasil:", user);
//       toast.success("Berhasil register");
//       return user;
//     } catch (err: any) {
//       switch (err.code) {
//         case "auth/email-already-in-use":
//           setError("Email sudah dipakai akun lain");
//           toast.error("Email sudah dipakai akun lain");
//           break;
//         case "auth/invalid-email":
//           setError("Format email tidak valid");
//           toast.error("Format email tidak valid");
//           break;
//         case "auth/weak-password":
//           setError("Password minimal 6 karakter");
//           toast.error("Password minimal 6 karakter");
//           break;
//         default:
//           setError("Register gagal, coba lagi");
//           toast.error("Register gagal, coba lagi");
//       }
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   };

  return (
    <>
      {title ? (
        <Typography fontWeight="700" variant="h2" mb={1}>
          {title}
        </Typography>
      ) : null}

      {subtext}

      <Box>
        <Stack mb={3}>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            component="label"
            htmlFor="name"
            mb="5px"
          >
            Name
          </Typography>
          <CustomTextField id="name" variant="outlined" fullWidth />

          <Typography
            variant="subtitle1"
            fontWeight={600}
            component="label"
            htmlFor="email"
            mb="5px"
            mt="25px"
          >
            Email Address
          </Typography>
          <CustomTextField id="email" variant="outlined" fullWidth />

          <Typography
            variant="subtitle1"
            fontWeight={600}
            component="label"
            htmlFor="password"
            mb="5px"
            mt="25px"
          >
            Password
          </Typography>
          <CustomTextField id="password" variant="outlined" fullWidth />
        </Stack>
        <Button
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          component={Link}
          href="/authentication/login"
        >
          Sign Up
        </Button>
      </Box>
      {subtitle}
    </>
  );
};

export default AuthRegister;
