import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useOnline } from ".";

const jsonResponse = (body: unknown) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});

describe("useOnline", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn<typeof fetch>());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("reloads after authentication and refreshes the presence list every 30 seconds", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([{ id: 7, name: "Мария", avatar_url: "/media/maria.webp" }]))
      .mockResolvedValueOnce(jsonResponse([{ id: 8, name: "Антон", avatar_url: null }]));
    const { result, rerender, unmount } = renderHook(({ viewerId }: { viewerId?: number }) => useOnline(viewerId), { initialProps: {} });

    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    rerender({ viewerId: 42 });
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.value).toEqual([{ id: 7, name: "Мария", avatar_url: "/media/maria.webp" }]);

    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    unmount();
  });
});
