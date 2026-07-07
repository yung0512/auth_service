import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "../i18n";

const LABELS: Record<SupportedLanguage, string> = {
  en: "EN",
  ja: "日本語",
};

interface LanguageSwitcherProps {
  /** 深色背景（如 AppBar / 認證頁）上使用時，改用亮色文字 */
  contrast?: boolean;
}

/**
 * 語言切換按鈕組，變更後由 i18next 寫入 localStorage。
 */
export function LanguageSwitcher({ contrast = false }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const current = (SUPPORTED_LANGUAGES as readonly string[]).includes(
    i18n.resolvedLanguage ?? "",
  )
    ? (i18n.resolvedLanguage as SupportedLanguage)
    : "en";

  function handleChange(_: unknown, next: SupportedLanguage | null) {
    if (next) {
      void i18n.changeLanguage(next);
    }
  }

  return (
    <ToggleButtonGroup
      value={current}
      exclusive
      size="small"
      onChange={handleChange}
      aria-label="language"
      sx={
        contrast
          ? {
              "& .MuiToggleButton-root": {
                color: "rgba(255,255,255,0.75)",
                borderColor: "rgba(255,255,255,0.4)",
              },
              "& .Mui-selected": {
                color: "#ffffff",
                bgcolor: "rgba(255,255,255,0.18)",
              },
            }
          : undefined
      }
    >
      {SUPPORTED_LANGUAGES.map((lng) => (
        <ToggleButton key={lng} value={lng}>
          {LABELS[lng]}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
