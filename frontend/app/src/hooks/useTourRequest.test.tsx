import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useTourRequest } from "./index";

const countries = [{ id: 1, name: "Таиланд", topics_count: 4 }];

function response(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useTourRequest", () => {
  it("loads /countries only when the dialog is enabled and posts the public lead contract", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/countries")) return response(countries);
      if (url.pathname.endsWith("/tour-requests") && init?.method === "POST") {
        return response({ id: 7, status: "new", tg_message_id: 10, created_at: "2026-08-30T00:00:00" }, 201);
      }
      throw new Error(`Unexpected request: ${init?.method ?? "GET"} ${url.pathname}`);
    });
    const { result, rerender } = renderHook(({ enabled }) => useTourRequest(enabled), {
      initialProps: { enabled: false },
    });

    await waitFor(() => expect(result.current.countriesLoading).toBe(false));
    expect(fetchMock).not.toHaveBeenCalled();
    rerender({ enabled: true });
    await waitFor(() => expect(result.current.countries).toEqual(countries));

    const payload = {
      name: "Анна",
      contact: "+79000000000",
      destination: "Таиланд",
      budget: null,
      comment: null,
      personal_data_consent: true as const,
    };
    await act(async () => { await result.current.submit(payload); });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[1];
    expect(String(url)).toContain("/api/v1/tour-requests");
    expect(init).toMatchObject({ method: "POST", body: JSON.stringify(payload) });
  });
});
