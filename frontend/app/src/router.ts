export type PathRoute =
  | { page: "feed" }
  | { page: "fishki" }
  | { page: "drafts" }
  | { page: "reviews" }
  | { page: "subscribe" }
  | { page: "about" }
  | { page: "privacy" }
  | { page: "terms" }
  | { page: "countries"; countryId?: number }
  | { page: "article"; slug: string }
  | { page: "profile"; userId: number };

const staticRoutes = new Map<string, PathRoute>([
  ["/", { page: "feed" }],
  ["/fishki", { page: "fishki" }],
  ["/drafts", { page: "drafts" }],
  ["/reviews", { page: "reviews" }],
  ["/subscribe", { page: "subscribe" }],
  ["/about", { page: "about" }],
  ["/privacy", { page: "privacy" }],
  ["/terms", { page: "terms" }],
  ["/countries", { page: "countries" }],
]);

function normalizedPath(pathname: string): string {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "") || "/";
}

/** Converts a browser pathname into the screen and resource it represents. */
export function routeFromPath(pathname: string): PathRoute {
  const path = normalizedPath(pathname);
  const staticRoute = staticRoutes.get(path);
  if (staticRoute) return staticRoute;

  const countryMatch = path.match(/^\/countries\/(\d+)$/);
  if (countryMatch) {
    const countryId = Number(countryMatch[1]);
    if (Number.isSafeInteger(countryId) && countryId > 0) return { page: "countries", countryId };
  }

  const postMatch = path.match(/^\/posts\/([^/]+)$/);
  if (postMatch) {
    try {
      const slug = decodeURIComponent(postMatch[1]);
      if (slug) return { page: "article", slug };
    } catch {
      return { page: "feed" };
    }
  }

  const profileMatch = path.match(/^\/users\/(\d+)$/);
  if (profileMatch) {
    const userId = Number(profileMatch[1]);
    if (Number.isSafeInteger(userId) && userId > 0) return { page: "profile", userId };
  }

  return { page: "feed" };
}

/** Builds the canonical shareable pathname for a client-side route. */
export function pathForRoute(route: PathRoute): string {
  if (route.page === "article") return `/posts/${encodeURIComponent(route.slug)}`;
  if (route.page === "profile") return `/users/${route.userId}`;
  if (route.page === "countries") return route.countryId ? `/countries/${route.countryId}` : "/countries";
  if (route.page === "feed") return "/";
  return `/${route.page}`;
}
