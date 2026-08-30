import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Layout } from "./Layout";

const SCRIPT_ID = "mps-svyazio-widget-script";
const STYLE_ID = "mps-svyazio-mobile-offsets";
const HOST_ID = "svyazio-widget-container";

type SvyazioWindow = Window & {
  Svyazio?: unknown;
  SvyazioConfig?: { orgId?: string; serverUrl?: string };
};

const callbacks = {
  onNavigate: () => {}, onThemeToggle: () => {}, onOpenQA: () => {}, onOpenProfile: () => {},
  onToggleNotifications: () => {}, onOpenPrivacy: () => {}, onOpenTerms: () => {},
};

function renderLayout() {
  return render(
    <Layout
      {...callbacks}
      page="feed"
      theme="light"
      notificationsOpen={false}
      unreadCount={0}
      userName="Гость"
      online={[]}
      publicSettings={null}
    >
      <main>Лента</main>
    </Layout>,
  );
}

function createWidgetHost() {
  const host = document.createElement("div");
  host.id = HOST_ID;
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = '<button class="svyazio-launcher"></button><div class="svyazio-teaser"></div><div class="svyazio-window"></div>';
  document.body.appendChild(host);
  return { host, shadow };
}

afterEach(() => {
  cleanup();
  document.getElementById(SCRIPT_ID)?.remove();
  document.getElementById(HOST_ID)?.remove();
  delete (window as SvyazioWindow).Svyazio;
  delete (window as SvyazioWindow).SvyazioConfig;
});

describe("WIDG-2 Svyazio bootstrap", () => {
  it("configures and loads the global async script exactly once across Layout mounts", () => {
    const first = renderLayout();
    const second = renderLayout();
    const scripts = document.querySelectorAll<HTMLScriptElement>(`#${SCRIPT_ID}`);

    expect(scripts).toHaveLength(1);
    expect(scripts[0].async).toBe(true);
    expect(scripts[0].src).toBe("https://app.svyazio.ru/widget/svyazio.js");
    expect((window as SvyazioWindow).SvyazioConfig).toEqual({
      orgId: "dde2db8e-7ba2-45d9-9536-8bca0d8ea666",
      serverUrl: "https://app.svyazio.ru",
    });

    first.unmount();
    second.unmount();
    expect(document.querySelectorAll(`#${SCRIPT_ID}`)).toHaveLength(1);
  });

  it("scopes launcher and teaser offsets to mobile without changing the fullscreen window or desktop", async () => {
    renderLayout();
    const { shadow } = createWidgetHost();

    await waitFor(() => expect(shadow.getElementById(STYLE_ID)).not.toBeNull());
    const css = shadow.getElementById(STYLE_ID)?.textContent ?? "";

    expect(css).toMatch(/@media\s*\(max-width:\s*767px\)/);
    expect(css).toMatch(/\.svyazio-launcher[\s\S]*\.svyazio-teaser[\s\S]*bottom:\s*calc\(74px \+ env\(safe-area-inset-bottom\)\)/);
    expect(css).not.toContain(".svyazio-window");
    expect(css).not.toMatch(/min-width|@media\s*\(min-width/);
  });

  it("reapplies the dedicated style after shadow redraw and host replacement", async () => {
    renderLayout();
    const first = createWidgetHost();
    await waitFor(() => expect(first.shadow.getElementById(STYLE_ID)).not.toBeNull());

    first.shadow.getElementById(STYLE_ID)?.remove();
    await waitFor(() => expect(first.shadow.getElementById(STYLE_ID)).not.toBeNull());

    first.host.remove();
    const second = createWidgetHost();
    await waitFor(() => expect(second.shadow.getElementById(STYLE_ID)).not.toBeNull());
  });
});
