import { useEffect, useRef, useState } from "react";

import type { TelegramLoginPayload } from "../hooks";

export type TelegramAuthData = TelegramLoginPayload;

declare global {
  interface Window {
    __mpsTelegramAuth?: (payload: TelegramAuthData) => void;
  }
}

type TelegramLoginProps = {
  botUsername: string;
  onAuth: (payload: TelegramAuthData) => Promise<unknown>;
  onError: (message: string) => void;
};

export function TelegramLogin({ botUsername, onAuth, onError }: TelegramLoginProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const username = botUsername.trim().replace(/^@/, "");
    if (!host || !username) return;

    const callback = (payload: TelegramAuthData) => {
      setSubmitting(true);
      void onAuth(payload)
        .catch((cause) => onError(cause instanceof Error ? cause.message : "Не удалось войти через Telegram"))
        .finally(() => setSubmitting(false));
    };
    window.__mpsTelegramAuth = callback;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.dataset.telegramLogin = username;
    script.dataset.size = "large";
    script.dataset.userpic = "false";
    script.dataset.requestAccess = "write";
    script.dataset.onauth = "__mpsTelegramAuth(user)";
    script.onerror = () => onError("Не удалось загрузить вход через Telegram");
    host.appendChild(script);

    return () => {
      script.remove();
      if (window.__mpsTelegramAuth === callback) delete window.__mpsTelegramAuth;
    };
  }, [botUsername, onAuth, onError]);

  if (!botUsername.trim()) {
    return <p className="telegram-widget-unavailable">Вход через Telegram временно недоступен</p>;
  }

  return (
    <div className="telegram-widget-host" ref={hostRef} aria-busy={submitting}>
      {submitting && <span>Входим через Telegram…</span>}
    </div>
  );
}
