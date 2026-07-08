import { useState, type FormEvent } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import { useTranslation } from "react-i18next";
import { AuthLayout } from "../components/AuthLayout";
import { useAuth } from "../hooks/useAuth";

export function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(
        email,
        password,
        firstName.trim() || undefined,
        lastName.trim() || undefined,
      );
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error ?? t("register.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title={t("register.title")} subtitle={t("register.subtitle")}>
      <form onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5}>
            <TextField
              fullWidth
              label={t("common.firstName")}
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <TextField
              fullWidth
              label={t("common.lastName")}
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Stack>
          <TextField
            type="email"
            label={t("common.email")}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            type="password"
            label={t("common.password")}
            autoComplete="new-password"
            helperText={t("register.passwordHelper")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting}
            startIcon={<PersonAddRoundedIcon />}
            sx={{ bgcolor: "#165e83", "&:hover": { bgcolor: "#124f6e" } }}
          >
            {submitting ? t("register.submitting") : t("register.submit")}
          </Button>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center" }}
          >
            {t("register.haveAccount")}{" "}
            <Link component={RouterLink} to="/login" sx={{ fontWeight: 600 }}>
              {t("register.loginLink")}
            </Link>
          </Typography>
        </Stack>
      </form>
    </AuthLayout>
  );
}
