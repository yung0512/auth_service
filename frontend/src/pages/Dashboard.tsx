import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useAuth } from "../hooks/useAuth";

export function Dashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const fullName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const initial = (fullName || user?.email || "?").charAt(0).toUpperCase();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: "#165e83" }}>
        <Toolbar>
          <ShieldRoundedIcon sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: 700 }}
          >
            {t("common.appName")}
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <LanguageSwitcher contrast />
            <Button
              color="inherit"
              onClick={logout}
              startIcon={<LogoutRoundedIcon />}
            >
              {t("dashboard.logout")}
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Card elevation={4} sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Stack
              spacing={2.5}
              sx={{ alignItems: "center", textAlign: "center" }}
            >
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: "#165e83",
                  fontSize: 32,
                  fontWeight: 700,
                }}
              >
                {initial}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {t("dashboard.welcome")}
                </Typography>
                {fullName && (
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {fullName}
                  </Typography>
                )}
                <Typography variant="body1" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t("dashboard.protectedMessage")}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
