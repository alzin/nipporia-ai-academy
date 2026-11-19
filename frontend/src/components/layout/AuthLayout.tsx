import { Box, Container, Typography } from "@mui/material";
import { Link } from "react-router-dom";

export const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <Box
    sx={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      bgcolor: "background.default",
    }}
  >
    <Box
      component="header"
      sx={{
        borderBottom: "1px solid",
        borderColor: "#CFC6B8",
        px: { xs: 2, sm: 3 },
        height: 64,
        display: "flex",
        alignItems: "center",
      }}
    >
      <Typography
        component={Link}
        to="/dashboard"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          minHeight: 44,
          fontWeight: 700,
          fontSize: "1.05rem",
          letterSpacing: "0.04em",
          color: "text.primary",
          textDecoration: "none",
          borderRadius: 1,
        }}
      >
        Nipporia AI Academy
      </Typography>
    </Box>

    <Box
      component="main"
      sx={{
        flex: 1,
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        py: { xs: 3, sm: 6 },
      }}
    >
      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
        {children}
      </Container>
    </Box>
  </Box>
);
