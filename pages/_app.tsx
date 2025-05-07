import "@/styles/globals.css";
import type { AppProps } from "next/app";
import "@mantine/core/styles.css";
import { createTheme, MantineProvider } from "@mantine/core";
import { useEffect, useState } from "react";

// Type declaration for Telegram WebApp object
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          auth_date?: string;
          hash?: string;
        };
        version: string;
        platform: string;
        colorScheme: string;
        isExpanded: boolean;
        isClosingConfirmationEnabled: boolean;
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        sendData: (data: string) => void;
        close: () => void;
        expand: () => void;
        requestFullscreen?: () => void;
        onEvent: (eventType: string, callback: Function) => void;
        offEvent: (eventType: string, callback: Function) => void;
        enableClosingConfirmation: () => void; // Добавлен этот метод
        disableClosingConfirmation: () => void; // Добавлен этот метод
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (callback: Function) => void;
          offClick: (callback: Function) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive: boolean) => void;
          hideProgress: () => void;
        };
        BackButton: {
          isVisible: boolean;
          onClick: (callback: Function) => void;
          offClick: (callback: Function) => void;
          show: () => void;
          hide: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: string) => void;
          notificationOccurred: (type: string) => void;
          selectionChanged: () => void;
        };
      };
    };
    TelegramWebviewProxy?: {
      postEvent: (eventType: string, eventData: string) => void;
    };
    external?: {
      notify: (data: string) => void;
    };
  }
}

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

  // Функция для запроса полноэкранного режима с учетом разных платформ
  function requestFullscreenMode() {
    // Для веб-версии
    if (typeof window !== "undefined") {
      // Web version
      if (window.parent && window.parent.postMessage) {
        const data = JSON.stringify({
          eventType: "web_app_request_fullscreen",
          eventData: {},
        });
        window.parent.postMessage(data, "https://web.telegram.org");
      }

      // Desktop and Mobile
      if (window.TelegramWebviewProxy?.postEvent) {
        window.TelegramWebviewProxy.postEvent(
          "web_app_request_fullscreen",
          JSON.stringify({})
        );
      }

      // Windows Phone
      if (window.external?.notify) {
        const data = JSON.stringify({
          eventType: "web_app_request_fullscreen",
          eventData: {},
        });
        window.external.notify(data);
      }
    }
  }

  return (
    <MantineProvider theme={theme}>
      <Component {...pageProps} telegramReady={telegramReady} />
    </MantineProvider>
  );
}
