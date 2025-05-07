import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <script src="https://telegram.org/js/telegram-web-app.js"></script>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
