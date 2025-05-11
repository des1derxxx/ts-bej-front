import "@/styles/globals.css";
import type { AppProps } from "next/app";
import "@mantine/core/styles.css";
import { createTheme, MantineProvider } from "@mantine/core";
import { useEffect, useState } from "react";
import { requestFullscreenMode } from "@/utils/telegram";

// Create a theme that respects Telegram's theme colors
const createTelegramTheme = (tg: any) => {
  const params = tg?.themeParams || {};

  return createTheme({
    colors: {
      // You can use Telegram's theme colors to create a matching experience
      primary: [
        params.button_color || "#2AABEE",
        params.button_color || "#2AABEE",
        params.button_color || "#2AABEE",
        params.button_color || "#2AABEE",
        params.button_color || "#2AABEE",
        params.button_color || "#2AABEE",
        params.button_color || "#2AABEE",
        params.button_color || "#2AABEE",
        params.button_color || "#2AABEE",
        params.button_color || "#2AABEE",
      ],
    },
    primaryColor: "primary",
  });
};

export default function App({ Component, pageProps }: AppProps) {
  const [theme, setTheme] = useState(createTheme({}));
  const [telegramReady, setTelegramReady] = useState(false);

  // Initialize Telegram WebApp
  useEffect(() => {
    // Check if app is running inside Telegram WebApp
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;

      // Request fullscreen mode using proper method based on platform
      if (tg.requestFullscreen) {
        // Используем прямой метод если он доступен
        tg.requestFullscreen();
      } else {
        // Используем универсальный метод через SDK или напрямую через postEvent
        requestFullscreenMode();
      }

      // Раскрываем приложение на максимальную высоту
      tg.expand();

      // Включаем подтверждение закрытия (предотвращает закрытие свайпом)
      tg.enableClosingConfirmation();

      // Create a theme based on Telegram colors
      setTheme(createTelegramTheme(tg));

      // Setup event listeners if needed
      tg.onEvent("viewportChanged", () => {
        // Handle viewport changes
      });

      // Mark Telegram as ready
      setTelegramReady(true);

      // Cleanup
      return () => {
        tg.offEvent("viewportChanged", () => {});
      };
    }
  }, []);

  return (
    <MantineProvider theme={theme}>
      <Component {...pageProps} telegramReady={telegramReady} />
    </MantineProvider>
  );
}
