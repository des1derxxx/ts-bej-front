"use client"; // если используешь App Router

import { useEffect } from "react";

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
