import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  HIDDEN_RECOMMENDATION_TTL_MS,
  useDiscoverySearch,
  useHiddenRecommendationIds,
  useRecommendedAuthors,
} from "./index";

const emptySearch = { articles: [], authors: [], forum_topics: [] };

function jsonResponse(body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }));
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("discovery hooks", () => {
  it("debounces journal search and sends only a useful query", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => jsonResponse(emptySearch));
    const { rerender } = renderHook(({ query }) => useDiscoverySearch(query), {
      initialProps: { query: "м" },
    });

    rerender({ query: "мар" });
    await act(async () => { await vi.advanceTimersByTimeAsync(299); });
    expect(fetchMock).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0][0])).toContain("/discovery/search?q=%D0%BC%D0%B0%D1%80&limit=5");
  });

  it("aborts an obsolete request and ignores its stale response", async () => {
    vi.useFakeTimers();
    let resolveFirst: ((response: Response) => void) | undefined;
    let firstSignal: AbortSignal | undefined;
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockImplementationOnce((_, init) => {
        firstSignal = init?.signal ?? undefined;
        return new Promise<Response>((resolve) => { resolveFirst = resolve; });
      })
      .mockImplementationOnce(() => jsonResponse({
        ...emptySearch,
        authors: [{ id: 9, name: "Новый ответ", avatar_url: null, bio: null }],
      }));
    const { result, rerender } = renderHook(({ query }) => useDiscoverySearch(query), {
      initialProps: { query: "старый" },
    });

    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    expect(fetchMock).toHaveBeenCalledOnce();
    rerender({ query: "новый" });
    expect(firstSignal?.aborted).toBe(true);
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    await act(async () => { await Promise.resolve(); });
    expect(result.current.results.authors[0]?.name).toBe("Новый ответ");

    await act(async () => {
      resolveFirst?.(await jsonResponse({
        ...emptySearch,
        authors: [{ id: 1, name: "Устаревший ответ", avatar_url: null, bio: null }],
      }));
      await Promise.resolve();
    });
    expect(result.current.results.authors[0]?.name).toBe("Новый ответ");
  });

  it("passes capped hidden IDs to recommendations and expires local entries after 30 days", async () => {
    const now = new Date("2026-08-30T12:00:00Z").getTime();
    vi.spyOn(Date, "now").mockReturnValue(now);
    localStorage.setItem("mps-hidden-recommendations:42", JSON.stringify([
      { id: 1, hiddenAt: now - HIDDEN_RECOMMENDATION_TTL_MS - 1 },
      { id: 2, hiddenAt: now - 1000 },
    ]));
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => jsonResponse({
      items: [],
      activity_window_days: 30,
    }));

    const hidden = renderHook(() => useHiddenRecommendationIds(42));
    expect(hidden.result.current.hiddenIds).toEqual([2]);
    act(() => hidden.result.current.dismiss(3));
    expect(hidden.result.current.hiddenIds).toEqual([2, 3]);
    expect(JSON.parse(localStorage.getItem("mps-hidden-recommendations:42") ?? "[]"))
      .toEqual([{ id: 2, hiddenAt: now - 1000 }, { id: 3, hiddenAt: now }]);

    renderHook(() => useRecommendedAuthors(true, Array.from({ length: 55 }, (_, index) => index + 1)));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const url = new URL(String(fetchMock.mock.calls.at(-1)?.[0]));
    expect(url.searchParams.getAll("exclude_ids")).toHaveLength(50);
    expect(url.searchParams.getAll("exclude_ids").at(-1)).toBe("50");
  });
});
