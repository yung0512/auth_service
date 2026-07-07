import type { ReactNode } from "react";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/**
 * 置中的認證頁面外框：漸層背景 + 卡片 + 標題區塊。
 * 供 Login / Register 共用，維持一致的視覺風格。
 */
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        bgcolor: "#165e83", // 藍色（純色，無漸層）
      }}
    >
      <Card
        elevation={10}
        sx={{ width: "100%", maxWidth: 420, borderRadius: 4 }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <LanguageSwitcher />
          </Box>
          <Stack spacing={1.5} sx={{ mb: 3, alignItems: "center" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#165e83", // 藍色（あいいろ）
                color: "#ffffff",
              }}
            >
              <LockRoundedIcon />
            </Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{ textAlign: "center" }}
            >
              {title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center" }}
            >
              {subtitle}
            </Typography>
          </Stack>
          {children}
        </CardContent>
      </Card>
    </Box>
  );
}
