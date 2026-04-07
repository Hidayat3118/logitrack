import { Box, Typography, Button } from "@mui/material";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export const Upgrade = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  // ambil inisial dari email
  const initial = user?.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <Box
      sx={{
        mt: 3,
        p: "20px",
        bgcolor: "#E6F1FB",
        borderRadius: "16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* lingkaran dekorasi */}
      <Box
        sx={{
          position: "absolute",
          top: -20,
          right: -10,
          width: 100,
          height: 100,
          bgcolor: "#B5D4F4",
          borderRadius: "50%",
          opacity: 0.4,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -30,
          right: 20,
          width: 70,
          height: 70,
          bgcolor: "#B5D4F4",
          borderRadius: "50%",
          opacity: 0.3,
        }}
      />

      {/* avatar + nama */}
      <Box display="flex" alignItems="center" gap="12px" mb={2} sx={{ position: "relative" }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            bgcolor: "#185FA5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 500,
            color: "#E6F1FB",
            flexShrink: 0,
          }}
        >
          {initial}
        </Box>
        <Box>
          <Typography fontSize="15px" fontWeight={500} color="#0C447C">
            Selamat datang
          </Typography>
          <Typography fontSize="12px" color="#185FA5">
            {user?.email}
          </Typography>
        </Box>
      </Box>

      {/* rocket image */}
      <Box display="flex" justifyContent="center" mb={2} sx={{ position: "relative" }}>
        <Image
          alt="rocket"
          src="/images/backgrounds/rocket.png"
          width={80}
          height={80}
        />
      </Box>
    </Box>
  );
};