import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Review } from ".";
import { useReviews } from ".";

const jsonResponse = (body: unknown) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});

describe("useReviews moderation state", () => {
  const pendingReview: Review = {
    id: 42,
    author_name: "Анна",
    rating: 5,
    body: "Спасибо за путешествие",
    photo_url: null,
    photo_urls: [],
    status: "pending",
  };
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockImplementation(async (input, init) => {
      const path = new URL(String(input)).pathname.replace("/api/v1", "");
      if (path === "/reviews" && !init?.method) return jsonResponse([]);
      if (path === "/reviews/pending") return jsonResponse([pendingReview]);
      if (path === "/reviews/mine") return jsonResponse([pendingReview]);
      if (path === "/reviews/42/moderate" && init?.method === "PATCH") {
        return jsonResponse({ review: { ...pendingReview, status: "rejected" }, pending_count: 0 });
      }
      throw new Error(`Unexpected request: ${init?.method ?? "GET"} ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("updates an own pending review immediately after rejecting it", async () => {
    const { result } = renderHook(() => useReviews(true, true));
    await waitFor(() => expect(result.current.mine).toEqual([pendingReview]));

    await act(async () => {
      await result.current.moderate(42, "reject");
    });

    expect(result.current.pending).toEqual([]);
    expect(result.current.mine).toEqual([{ ...pendingReview, status: "rejected" }]);
  });
});
