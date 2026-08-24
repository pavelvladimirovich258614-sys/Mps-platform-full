import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setAccessToken } from "../api/client";
import { useAuth } from ".";

const jsonResponse = (status: number, body: unknown) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json" },
});

describe("useAuth Telegram login", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    setAccessToken(null);
    localStorage.clear();
    sessionStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("posts the widget payload, keeps JWT in memory and reloads /me", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { detail: "Требуется авторизация" }))
      .mockResolvedValueOnce(jsonResponse(401, { detail: "Недействительный токен" }));
    const auth = renderHook(() => useAuth());
    await waitFor(() => expect(auth.result.current.loading).toBe(false));
    fetchMock.mockClear();
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { access_token: "telegram-access-token" }))
      .mockResolvedValueOnce(jsonResponse(200, {
        id: 42,
        email: null,
        name: "Павел",
        avatar_url: null,
        bio: null,
        role: "reader",
        is_anonymous: false,
      }));

    await act(async () => {
      await auth.result.current.loginTelegram({
        id: 42,
        first_name: "Павел",
        auth_date: 1_725_000_000,
        hash: "signed-hash",
      });
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [loginUrl, loginInit] = fetchMock.mock.calls[0];
    expect(loginUrl).toBe("https://mir.pod-solncem.ru/api/v1/auth/telegram");
    expect(loginInit?.method).toBe("POST");
    expect(JSON.parse(String(loginInit?.body))).toMatchObject({ id: 42, hash: "signed-hash" });
    const [meUrl, meInit] = fetchMock.mock.calls[1];
    expect(meUrl).toBe("https://mir.pod-solncem.ru/api/v1/me");
    expect(new Headers(meInit?.headers).get("Authorization")).toBe("Bearer telegram-access-token");
    expect(auth.result.current.user?.role).toBe("reader");
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(sessionStorage.getItem("access_token")).toBeNull();
  });

  it("clears the client session through the logout endpoint", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { detail: "Требуется авторизация" }))
      .mockResolvedValueOnce(jsonResponse(401, { detail: "Недействительный токен" }));
    const auth = renderHook(() => useAuth());
    await waitFor(() => expect(auth.result.current.loading).toBe(false));
    fetchMock.mockClear();
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await act(async () => {
      await auth.result.current.logout();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://mir.pod-solncem.ru/api/v1/auth/logout",
      expect.objectContaining({ method: "POST" }),
    );
    expect(auth.result.current.user).toBeNull();
  });

  it("uploads an avatar as multipart data and saves its URL in the profile", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { detail: "Требуется авторизация" }))
      .mockResolvedValueOnce(jsonResponse(401, { detail: "Недействительный токен" }));
    const auth = renderHook(() => useAuth());
    await waitFor(() => expect(auth.result.current.loading).toBe(false));
    fetchMock.mockClear();
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { url: "/media/avatar.png" }))
      .mockResolvedValueOnce(jsonResponse(200, {
        id: 42, email: null, name: "Павел", avatar_url: "/media/avatar.png", bio: null, role: "reader", is_anonymous: false,
      }));

    await act(async () => {
      await auth.result.current.uploadAvatar(new File(["avatar"], "avatar.png", { type: "image/png" }));
    });

    const [uploadUrl, uploadInit] = fetchMock.mock.calls[0];
    expect(uploadUrl).toBe("https://mir.pod-solncem.ru/api/v1/media");
    expect(uploadInit?.method).toBe("POST");
    expect(uploadInit?.body).toBeInstanceOf(FormData);
    expect(new Headers(uploadInit?.headers).has("Content-Type")).toBe(false);
    expect(fetchMock.mock.calls[1][0]).toBe("https://mir.pod-solncem.ru/api/v1/me");
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({ avatar_url: "/media/avatar.png" });
    expect(auth.result.current.user?.avatar_url).toBe("/media/avatar.png");
  });
});
