import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Question } from ".";
import { useQA } from ".";

const response = (questions: Question[]) => new Response(JSON.stringify(questions), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});

const flushRequests = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

describe("useQA live refresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn<typeof fetch>());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("polls while a question is open and stops after the answer arrives", async () => {
    const openQuestion: Question = { id: 42, target: "lawyer", body: "Вопрос", status: "open", answer: null };
    const answeredQuestion: Question = { ...openQuestion, status: "answered", answer: "Ответ юриста" };
    const fetchMock = vi.mocked(fetch)
      .mockResolvedValueOnce(response([openQuestion]))
      .mockResolvedValueOnce(response([answeredQuestion]));
    const { result, unmount } = renderHook(() => useQA());

    await act(flushRequests);
    expect(result.current.value).toEqual([openQuestion]);
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.value).toEqual([answeredQuestion]);

    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    unmount();
  });

  it("clears polling when the QA modal hook unmounts", async () => {
    const openQuestion: Question = { id: 43, target: "manager", body: "Вопрос", status: "open", answer: null };
    const fetchMock = vi.mocked(fetch).mockResolvedValue(response([openQuestion]));
    const { unmount } = renderHook(() => useQA());

    await act(flushRequests);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
