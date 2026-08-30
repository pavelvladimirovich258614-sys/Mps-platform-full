import { useEffect } from "react";

const SVYAZIO_ORG_ID = "dde2db8e-7ba2-45d9-9536-8bca0d8ea666";
const SVYAZIO_SERVER_URL = "https://app.svyazio.ru";
const SVYAZIO_SCRIPT_URL = `${SVYAZIO_SERVER_URL}/widget/svyazio.js`;
const SVYAZIO_SCRIPT_ID = "mps-svyazio-widget-script";
const SVYAZIO_HOST_ID = "svyazio-widget-container";
const MOBILE_OFFSET_STYLE_ID = "mps-svyazio-mobile-offsets";

const MOBILE_OFFSET_CSS = `
@media (max-width: 767px) {
  .svyazio-launcher,
  .svyazio-teaser {
    bottom: calc(74px + env(safe-area-inset-bottom)) !important;
  }
}
`;

type SvyazioCommand = ((...args: unknown[]) => void) & { q?: unknown[][] };

declare global {
  interface Window {
    Svyazio?: SvyazioCommand;
    SvyazioConfig?: {
      orgId: string;
      serverUrl: string;
    };
  }
}

function ensureSvyazioBootstrap() {
  window.SvyazioConfig = {
    orgId: SVYAZIO_ORG_ID,
    serverUrl: SVYAZIO_SERVER_URL,
  };

  if (typeof window.Svyazio !== "function") {
    const queue: SvyazioCommand = (...args: unknown[]) => {
      queue.q = queue.q ?? [];
      queue.q.push(args);
    };
    window.Svyazio = queue;
  }

  if (document.getElementById(SVYAZIO_SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = SVYAZIO_SCRIPT_ID;
  script.async = true;
  script.src = SVYAZIO_SCRIPT_URL;
  document.head.appendChild(script);
}

export function SvyazioWidget() {
  useEffect(() => {
    ensureSvyazioBootstrap();

    let observedShadow: ShadowRoot | null = null;
    let shadowObserver: MutationObserver | null = null;

    const applyMobileOffset = () => {
      const host = document.getElementById(SVYAZIO_HOST_ID);
      const shadow = host?.shadowRoot ?? null;

      if (shadow !== observedShadow) {
        shadowObserver?.disconnect();
        observedShadow = shadow;
        shadowObserver = null;
        if (shadow) {
          shadowObserver = new MutationObserver(applyMobileOffset);
          shadowObserver.observe(shadow, { childList: true });
        }
      }

      if (!shadow || shadow.getElementById(MOBILE_OFFSET_STYLE_ID)) return;

      const style = document.createElement("style");
      style.id = MOBILE_OFFSET_STYLE_ID;
      style.textContent = MOBILE_OFFSET_CSS;
      shadow.appendChild(style);
    };

    const documentObserver = new MutationObserver(applyMobileOffset);
    documentObserver.observe(document.body, { childList: true, subtree: true });
    applyMobileOffset();

    return () => {
      documentObserver.disconnect();
      shadowObserver?.disconnect();
    };
  }, []);

  return null;
}
