"use client"; // если используешь App Router

import { useEffect } from "react";

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: object;
        version: string;
        platform: string;
        colorScheme: string;
        isExpanded: boolean;
        isClosingConfirmationEnabled: boolean;
        themeParams: object;
        sendData: (data: string) => void;
        close: () => void;
        expand: () => void;
        onEvent: (eventType: string, callback: Function) => void;
        offEvent: (eventType: string, callback: Function) => void;
        MainButton?: any; // если будешь использовать кнопку Telegram
      };
    };
  }
}

const isTelegramWebApp = () => {
  return (
    typeof window !== "undefined" &&
    window.navigator.userAgent.indexOf("TelegramWebApp") > -1
  );
};

export default function TelegramWebApp() {
  useEffect(() => {
    const tg = window.Telegram.WebApp;
    tg.expand(); // развернуть WebView

    const button = document.getElementById("send-btn");
    if (button) {
      button.addEventListener("click", () => {
        tg.sendData("some custom data from React"); // отправка данных в бота
      });
    }

    return () => {
      // очистка
      if (button) {
        button.removeEventListener("click", () => {});
      }
    };
  }, []);
}
