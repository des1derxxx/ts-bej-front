export function requestFullscreenMode() {
  if (typeof window === "undefined") return;

  const data = JSON.stringify({
    eventType: "web_app_request_fullscreen",
    eventData: {},
  });

  // Web version
  if (window.parent && window.parent.postMessage) {
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
  const external = window.external as { notify?: (data: string) => void };
  if (external?.notify) {
    external.notify(data);
  }
}
