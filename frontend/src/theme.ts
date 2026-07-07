import { createTheme } from "@mui/material/styles";

/**
 * 應用程式共用的 MUI 主題。
 * 採用日本傳統青色色系（瑠璃色、紺色、露草色、浅葱色），
 * 搭配較大的圓角與柔和陰影，營造沉穩清爽的現代感。
 */
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1e50a2", // 瑠璃色
      dark: "#223a70", // 紺色
      light: "#38a1db", // 露草色
    },
    secondary: {
      main: "#00a3af", // 浅葱色
    },
    background: {
      default: "#eef2f8", // 淡水色
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily:
      '"Inter", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
    h4: {
      fontWeight: 700,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          paddingBlock: 10,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true,
        variant: "outlined",
      },
    },
  },
});
