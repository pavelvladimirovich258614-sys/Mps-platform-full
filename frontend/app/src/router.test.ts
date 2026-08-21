import { describe, expect, it } from "vitest";

import { pathForRoute, routeFromPath } from "./router";

describe("pathname router", () => {
  it.each([
    ["/", { page: "feed" }],
    ["/reviews", { page: "reviews" }],
    ["/subscribe/", { page: "subscribe" }],
    ["/about", { page: "about" }],
    ["/privacy", { page: "privacy" }],
    ["/terms", { page: "terms" }],
    ["/countries", { page: "countries" }],
    ["/countries/7", { page: "countries", countryId: 7 }],
    ["/posts/bali-guide", { page: "article", slug: "bali-guide" }],
    ["/users/7", { page: "profile", userId: 7 }],
  ])("parses %s", (pathname, expected) => {
    expect(routeFromPath(pathname)).toEqual(expected);
  });

  it("falls back to the feed for unknown and malformed paths", () => {
    expect(routeFromPath("/unknown")).toEqual({ page: "feed" });
    expect(routeFromPath("/countries/not-a-number")).toEqual({ page: "feed" });
  });

  it("builds shareable paths for articles and countries", () => {
    expect(pathForRoute({ page: "article", slug: "bali guide" })).toBe("/posts/bali%20guide");
    expect(pathForRoute({ page: "countries", countryId: 3 })).toBe("/countries/3");
    expect(pathForRoute({ page: "profile", userId: 7 })).toBe("/users/7");
    expect(pathForRoute({ page: "reviews" })).toBe("/reviews");
  });
});
