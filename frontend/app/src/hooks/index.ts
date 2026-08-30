import { useCallback, useEffect, useRef, useState } from "react";

import { api, apiForm, ApiError, apiJson, setAccessToken } from "../api/client";
import type { Comment, ReactionResult } from "../api/comments";

export type { Comment } from "../api/comments";

export type User = { id: number; email: string | null; name: string; avatar_url: string | null; bio: string | null; role: string; is_anonymous: boolean };
export type ApiPost = { id: number; type: "article" | "fishka" | "video_review"; title: string; slug: string; body: string; emoji?: string | null; category?: string | null; cover_url?: string | null; liked_at?: string | null; views: number; likes_count: number; shot_at: string | null; author: { id: number; name: string; avatar_url: string | null } };
export type PostDraft = { title: string; type: "article"; body: string; status: "draft" | "published"; cover_url?: string | null };
export type FishkaDraft = { title: string; type: "fishka"; body: string; emoji: string; status: "pending" | "published" };
export type DraftSummary = { id: number; title: string; updated_at: string };
export type DraftPost = ApiPost & { status: "draft"; updated_at: string };
export type Review = { id: number; author_name: string; rating: number; body: string; photo_url: string | null; photo_urls: string[]; status: "pending" | "approved" | "rejected" };
export type ReviewCreate = { author_name: string; rating: number; body: string; photo_urls: string[] };
export type Question = { id: number; target: "manager" | "lawyer"; body: string; status: string; answer: string | null };
export type Country = { id: number; name: string; topics_count: number };
export type Topic = { id: number; title: string; author_id: number; messages_count: number };
export type ForumMessage = { id: number; body: string; author: { id: number; name: string; avatar_url: string | null }; is_ai: boolean };
export type ForumPage<T> = { items: T[]; next_cursor: string | null };
export type Notification = { id: number; type: string; payload: Record<string, unknown>; is_read: boolean; created_at: string };
export type OnlineUser = { id: number; name: string; avatar_url: string | null };
export type PublicProfile = { id: number; name: string; avatar_url: string | null; bio: string | null; posts_count: number; followers_count: number; following_count: number; is_following: boolean; countries: Array<{ id: number; name: string; flag_emoji: string }> };
export type PublicProfileFollow = { id: number; name: string; avatar_url: string | null; is_following: boolean };
export type RecommendedAuthor = { id: number; name: string; avatar_url: string | null; bio: string | null };
export type RecommendedAuthorsResponse = { items: RecommendedAuthor[]; activity_window_days: number };
export type DiscoveryArticle = { id: number; title: string; slug: string };
export type DiscoveryAuthor = { id: number; name: string; avatar_url: string | null; bio: string | null };
export type DiscoveryForumTopic = { id: number; title: string; country_id: number };
export type DiscoverySearchResponse = {
  articles: DiscoveryArticle[];
  authors: DiscoveryAuthor[];
  forum_topics: DiscoveryForumTopic[];
};
export type PublicProfileComment = { id: number; body: string; created_at: string; status: "pending" | "approved" | "rejected"; post: { slug: string; title: string } };
export type PublicProfileActivity = {
  id: number;
  event_type: "post_published" | "comment_created" | "post_liked" | "user_followed";
  created_at: string;
  post?: { id: number; title: string; slug: string };
  comment?: { id: number; body: string; status: "pending" | "approved" | "rejected"; post: { title: string; slug: string } };
  user?: { id: number; name: string; avatar_url: string | null };
};
export type PublicProfileActivityPage = { items: PublicProfileActivity[]; next_cursor: string | null };
export type PublicSettings = { legal_name: string | null; legal_inn: string | null; legal_ogrn: string | null; contact_email: string | null; contact_phone: string | null; contact_address: string | null; comments_moderation_enabled: boolean };
export type TelegramLoginPayload = { id: number; first_name: string; last_name?: string; username?: string; photo_url?: string; auth_date: number; hash: string };
export type TourRequestPayload = {
  name: string;
  contact: string;
  destination: string;
  budget: string | null;
  comment: string | null;
  personal_data_consent: true;
};
export type TourRequestResponse = {
  id: number;
  status: "new" | "contacted" | "closed";
  tg_message_id: number | null;
  created_at: string;
};

function useResource<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [value, setValue] = useState<T | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const reload = useCallback(async () => { setLoading(true); setError(""); try { setValue(await load()); } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось загрузить данные"); } finally { setLoading(false); } }, deps);
  useEffect(() => { void reload(); }, [reload]);
  return { value, loading, error, reload, setValue };
}

const EMPTY_DISCOVERY_RESULTS: DiscoverySearchResponse = {
  articles: [],
  authors: [],
  forum_topics: [],
};
const MAX_RECOMMENDATION_EXCLUDE_IDS = 50;
export const HIDDEN_RECOMMENDATION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type HiddenRecommendation = { id: number; hiddenAt: number };

function hiddenRecommendationKey(userId: number) {
  return `mps-hidden-recommendations:${userId}`;
}

function readHiddenRecommendations(userId?: number): HiddenRecommendation[] {
  if (!userId) return [];
  const key = hiddenRecommendationKey(userId);
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    const current = parsed.filter((entry): entry is HiddenRecommendation => {
      if (!entry || typeof entry !== "object") return false;
      const value = entry as Partial<HiddenRecommendation>;
      return Number.isInteger(value.id)
        && typeof value.hiddenAt === "number"
        && now - value.hiddenAt < HIDDEN_RECOMMENDATION_TTL_MS;
    });
    localStorage.setItem(key, JSON.stringify(current));
    return current;
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

export function useHiddenRecommendationIds(userId?: number) {
  const [entries, setEntries] = useState<HiddenRecommendation[]>(() => readHiddenRecommendations(userId));
  useEffect(() => { setEntries(readHiddenRecommendations(userId)); }, [userId]);
  const dismiss = useCallback((id: number) => {
    if (!userId) return;
    setEntries((current) => {
      const next = [...current.filter((entry) => entry.id !== id), { id, hiddenAt: Date.now() }];
      localStorage.setItem(hiddenRecommendationKey(userId), JSON.stringify(next));
      return next;
    });
  }, [userId]);
  return { hiddenIds: entries.map((entry) => entry.id), dismiss };
}

export function useRecommendedAuthors(enabled: boolean, excludeIds: number[]) {
  const cappedExcludeIds = Array.from(new Set(excludeIds)).slice(0, MAX_RECOMMENDATION_EXCLUDE_IDS);
  const excludeKey = cappedExcludeIds.join(",");
  const resource = useResource(async () => {
    if (!enabled) return { items: [], activity_window_days: 30 };
    const query = new URLSearchParams({ limit: "4" });
    cappedExcludeIds.forEach((id) => query.append("exclude_ids", String(id)));
    return api<RecommendedAuthorsResponse>(`/discovery/recommended-authors?${query.toString()}`);
  }, [enabled, excludeKey]);
  return { ...resource, items: resource.value?.items ?? [] };
}

export function useDiscoverySearch(query: string, limit = 5) {
  const [results, setResults] = useState<DiscoverySearchResponse>(EMPTY_DISCOVERY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);
  const requestVersion = useRef(0);

  useEffect(() => {
    const version = ++requestVersion.current;
    const term = query.trim();
    if (term.length < 2) {
      setResults(EMPTY_DISCOVERY_RESULTS);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ q: term, limit: String(limit) });
        const response = await api<DiscoverySearchResponse>(`/discovery/search?${params.toString()}`, {
          signal: controller.signal,
        });
        if (version === requestVersion.current && !controller.signal.aborted) setResults(response);
      } catch (cause) {
        if (controller.signal.aborted || version !== requestVersion.current) return;
        setResults(EMPTY_DISCOVERY_RESULTS);
        setError(cause instanceof Error ? cause.message : "Поиск временно недоступен");
      } finally {
        if (version === requestVersion.current && !controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [limit, query, reloadVersion]);

  const reload = useCallback(() => setReloadVersion((current) => current + 1), []);
  return { results, loading, error, reload };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const loadMe = useCallback(async () => { try { const current = await api<User>("/me"); setUser(current); return current; } catch { setUser(null); return null; } finally { setLoading(false); } }, []);
  useEffect(() => { void loadMe(); }, [loadMe]);
  const requestCode = async (email: string) => apiJson<void>("/auth/email/request", "POST", { email });
  const verifyCode = async (email: string, code: string) => { setError(""); try { const token = await apiJson<{ access_token: string }>("/auth/email/verify", "POST", { email, code }); setAccessToken(token.access_token); return await loadMe(); } catch (cause) { const message = cause instanceof Error ? cause.message : "Не удалось войти"; setError(message); throw cause; } };
  const loginTelegram = async (payload: TelegramLoginPayload) => { setError(""); try { const token = await apiJson<{ access_token: string }>("/auth/telegram", "POST", payload); setAccessToken(token.access_token); return await loadMe(); } catch (cause) { const message = cause instanceof Error ? cause.message : "Не удалось войти через Telegram"; setError(message); throw cause; } };
  const update = async (changes: Partial<Pick<User, "name" | "bio" | "avatar_url" | "is_anonymous">>) => { const updated = await apiJson<User>("/me", "PATCH", changes); setUser(updated); return updated; };
  const uploadAvatar = async (file: File) => { const form = new FormData(); form.append("file", file); const uploaded = await apiForm<{ url: string }>("/media", "POST", form); return update({ avatar_url: uploaded.url }); };
  const logout = async () => { try { await apiJson<void>("/auth/logout", "POST"); } finally { setAccessToken(null); setUser(null); setError(""); } };
  return { user, loading, error, requestCode, verifyCode, loginTelegram, update, uploadAvatar, logout, reload: loadMe };
}

export const usePosts = (type?: ApiPost["type"], category?: string) => useResource(() => {
  const query = new URLSearchParams();
  if (type) query.set("type", type);
  if (category) query.set("category", category);
  const suffix = query.size ? `?${query.toString()}` : "";
  return api<ApiPost[]>(`/posts${suffix}`);
}, [type, category]);
export const usePostCreator = () => ({ create: (post: PostDraft | FishkaDraft) => apiJson<ApiPost>("/posts", "POST", post) });
export const useFishkaCategories = (enabled: boolean) => useResource(() => enabled ? api<string[]>("/posts/fishki/categories") : Promise.resolve([]), [enabled]);
export const useFishkaPermission = (enabled: boolean) => useResource(() => enabled ? api<{ can_submit_fishka: boolean }>("/posts/fishki/permission") : Promise.resolve({ can_submit_fishka: false }), [enabled]);
export type FishkaAdminSettings = { fishka_submissions_enabled: boolean };
export const useFishkaAdminSettings = (enabled: boolean) => {
  const resource = useResource(() => enabled ? api<FishkaAdminSettings>("/admin/settings") : Promise.resolve(null), [enabled]);
  const update = async (fishka_submissions_enabled: boolean) => {
    await apiJson<{ fishka_submissions_enabled: boolean | string }>("/admin/settings", "PATCH", { fishka_submissions_enabled });
    resource.setValue({ fishka_submissions_enabled });
  };
  return { ...resource, update };
};
export type IrishkaAdminSettings = { irishka_enabled: boolean; irishka_delay_min: number };
export const useIrishkaAdminSettings = (enabled: boolean) => {
  const resource = useResource(() => enabled ? api<IrishkaAdminSettings>("/admin/settings") : Promise.resolve(null), [enabled]);
  const update = async (settings: IrishkaAdminSettings) => {
    await apiJson<Record<string, string>>("/admin/settings", "PATCH", settings);
    resource.setValue(settings);
  };
  return { ...resource, update };
};
export const usePostEditor = () => ({ update: (postId: number, post: PostDraft) => apiJson<ApiPost>(`/posts/${postId}`, "PATCH", post), remove: (postId: number) => apiJson<void>(`/posts/${postId}`, "DELETE") });
export const useDrafts = (enabled: boolean) => useResource(() => enabled ? api<DraftSummary[]>("/posts/drafts") : Promise.resolve([]), [enabled]);
export const getDraft = (postId: number) => api<DraftPost>(`/posts/drafts/${postId}`);
export const usePostLike = () => ({ toggle: (postId: number) => apiJson<{ likes_count: number }>(`/posts/${postId}/like`, "POST") });
export const useAuthorPosts = (authorId?: number) => useResource(() => authorId ? api<ApiPost[]>(`/posts?author_id=${authorId}`) : Promise.resolve([]), [authorId]);
export const getLikedPosts = (userId: number) => api<ApiPost[]>(`/users/${userId}/likes`);
export const useLikedPosts = (userId?: number) => useResource(() => userId ? getLikedPosts(userId) : Promise.resolve([]), [userId]);
export const useProfileFollowers = (userId?: number) => useResource(() => userId ? api<PublicProfileFollow[]>(`/users/${userId}/followers`) : Promise.resolve([]), [userId]);
export const useProfileFollowing = (userId?: number) => useResource(() => userId ? api<PublicProfileFollow[]>(`/users/${userId}/following`) : Promise.resolve([]), [userId]);
export const useProfileComments = (userId?: number) => useResource(() => userId ? api<PublicProfileComment[]>(`/users/${userId}/comments`) : Promise.resolve([]), [userId]);
export function useProfileActivity(userId?: number) {
  const [items, setItems] = useState<PublicProfileActivity[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!userId) {
      setItems([]); setNextCursor(null); setLoading(false); setError("");
      return;
    }
    setLoading(true); setError("");
    try {
      const page = await api<PublicProfileActivityPage>(`/users/${userId}/activity`);
      setItems(page.items); setNextCursor(page.next_cursor);
    } catch (cause) {
      setItems([]); setNextCursor(null);
      setError(cause instanceof Error ? cause.message : "Не удалось загрузить активность");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  const loadMore = useCallback(async () => {
    if (!userId || !nextCursor || loadingMore) return;
    setLoadingMore(true); setError("");
    try {
      const page = await api<PublicProfileActivityPage>(`/users/${userId}/activity?cursor=${encodeURIComponent(nextCursor)}`);
      setItems((current) => {
        const knownIds = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !knownIds.has(item.id))];
      });
      setNextCursor(page.next_cursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось загрузить активность");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor, userId]);

  return { items, loading, loadingMore, error, hasMore: Boolean(nextCursor), loadMore, reload: load };
}
export const useUserFollow = () => ({
  toggle: async (userId: number, isFollowing: boolean) => {
    const result = await apiJson<{ is_following: boolean }>(`/users/${userId}/follow`, isFollowing ? "DELETE" : "POST");
    return result.is_following;
  },
});
export function usePublicProfile(userId?: number) {
  const resource = useResource(() => userId ? api<PublicProfile>(`/users/${userId}/profile`) : Promise.resolve(null), [userId]);
  const toggleFollow = async () => {
    if (!userId || !resource.value) return;
    const method = resource.value.is_following ? "DELETE" : "POST";
    const result = await apiJson<{ followers_count: number; is_following: boolean }>(`/users/${userId}/follow`, method);
    resource.setValue((current) => current ? { ...current, ...result } : current);
  };
  return { ...resource, toggleFollow };
}
export function usePost(slug?: string) {
  const [value, setValue] = useState<ApiPost | null>(null);
  const [loading, setLoading] = useState(Boolean(slug));
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const requestVersion = useRef(0);
  const reload = useCallback(async () => {
    const version = ++requestVersion.current;
    if (!slug) {
      setValue(null);
      setLoading(false);
      setError("");
      setNotFound(false);
      return;
    }
    setLoading(true);
    setError("");
    setNotFound(false);
    setValue(null);
    try {
      const post = await api<ApiPost>(`/posts/${encodeURIComponent(slug)}`);
      if (version === requestVersion.current) setValue(post);
    } catch (cause) {
      if (version !== requestVersion.current) return;
      if (cause instanceof ApiError && cause.status === 404) {
        setNotFound(true);
      } else if (cause instanceof ApiError) {
        setError(cause.message);
      } else {
        setError("Не удалось загрузить публикацию");
      }
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [slug]);
  useEffect(() => {
    void reload();
    return () => { requestVersion.current += 1; };
  }, [reload]);
  return { value, loading, error, notFound, reload, setValue };
}
export const useReviews = (canModerate = false, canTrackOwn = false) => {
  const resource = useResource(() => api<Review[]>("/reviews"), []);
  const pendingResource = useResource(
    () => canModerate ? api<Review[]>("/reviews/pending") : Promise.resolve([]),
    [canModerate],
  );
  const mineResource = useResource(
    () => canTrackOwn ? api<Review[]>("/reviews/mine") : Promise.resolve([]),
    [canTrackOwn],
  );
  const create = async (body: ReviewCreate) => {
    const created = await apiJson<Review>("/reviews", "POST", body);
    if (canTrackOwn) mineResource.setValue((current) => [created, ...(current ?? [])]);
    return created;
  };
  const moderate = async (reviewId: number, action: "approve" | "reject") => {
    const result = await apiJson<{ review: Review; pending_count: number }>(`/reviews/${reviewId}/moderate`, "PATCH", { action });
    pendingResource.setValue((current) => current?.filter((review) => review.id !== reviewId) ?? []);
    mineResource.setValue((current) => current?.map((review) => review.id === reviewId ? result.review : review) ?? []);
  };
  return {
    ...resource,
    create,
    pending: pendingResource.value ?? [],
    pendingLoading: pendingResource.loading,
    pendingError: pendingResource.error,
    reloadPending: pendingResource.reload,
    mine: mineResource.value ?? [],
    mineLoading: mineResource.loading,
    mineError: mineResource.error,
    reloadMine: mineResource.reload,
    moderate,
  };
};
export const useSubscribe = () => ({ subscribe: (email: string) => apiJson<{ email: string; confirmed: boolean }>("/subscribe", "POST", { email }) });
export function useTourRequest(enabled: boolean) {
  const countriesResource = useResource(
    () => enabled ? api<Country[]>("/countries") : Promise.resolve([]),
    [enabled],
  );
  const submit = useCallback(
    (payload: TourRequestPayload) => apiJson<TourRequestResponse>("/tour-requests", "POST", payload),
    [],
  );
  return {
    countries: countriesResource.value ?? [],
    countriesLoading: countriesResource.loading,
    countriesError: countriesResource.error,
    reloadCountries: countriesResource.reload,
    submit,
  };
}
export const useQA = () => {
  const resource = useResource(() => api<Question[]>("/qa/my"), []);
  const hasOpenQuestions = Boolean(resource.value?.some((question) => question.status === "open"));
  useEffect(() => {
    if (!hasOpenQuestions) return;
    const interval = window.setInterval(() => { void resource.reload(); }, 30_000);
    return () => window.clearInterval(interval);
  }, [hasOpenQuestions, resource.reload]);
  const create = async (target: Question["target"], body: string) => {
    const item = await apiJson<Question>("/qa", "POST", { target, body });
    resource.setValue((current) => [...(current ?? []), item]);
    return item;
  };
  const archive = async () => {
    const result = await apiJson<{ archived_count: number }>("/qa/my/archive", "PATCH");
    resource.setValue([]);
    return result;
  };
  const askIrishka = (text: string) => apiJson<{ answer: string }>("/qa/irishka", "POST", { text });
  return { ...resource, create, archive, askIrishka };
};
export const useQAQuestions = (enabled: boolean) => useResource(
  () => enabled ? api<Question[]>("/qa/my") : Promise.resolve([]),
  [enabled],
);
function useForumPage<T>(path: string | null, deps: unknown[]) {
  const resource = useResource(() => path ? api<ForumPage<T>>(path) : Promise.resolve({ items: [], next_cursor: null }), deps);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMore = useCallback(async () => {
    const cursor = resource.value?.next_cursor;
    if (!path || !cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await api<ForumPage<T>>(`${path}?cursor=${encodeURIComponent(cursor)}`);
      resource.setValue((current) => {
        const known = new Set((current?.items ?? []).map((item) => (item as { id: number }).id));
        return { items: [...(current?.items ?? []), ...page.items.filter((item) => !known.has((item as { id: number }).id))], next_cursor: page.next_cursor };
      });
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, path, resource.value?.next_cursor]);
  return { ...resource, items: resource.value?.items ?? [], hasMore: Boolean(resource.value?.next_cursor), loadingMore, loadMore };
}
export function useForum(countryId?: number, topicId?: number) {
  const countries = useResource(() => api<Country[]>("/countries"), []);
  const topics = useForumPage<Topic>(countryId ? `/countries/${countryId}/topics` : null, [countryId]);
  const messages = useForumPage<ForumMessage>(topicId ? `/topics/${topicId}/messages` : null, [topicId]);
  const removeTopic = async (removedTopicId: number) => {
    await apiJson<void>(`/topics/${removedTopicId}`, "DELETE");
    topics.setValue((current) => current ? { ...current, items: current.items.filter((item) => item.id !== removedTopicId) } : current);
    countries.setValue((current) => (current ?? []).map((item) => item.id === countryId ? { ...item, topics_count: Math.max(0, item.topics_count - 1) } : item));
  };
  const removeMessage = async (removedMessageId: number) => {
    await apiJson<void>(`/messages/${removedMessageId}`, "DELETE");
    messages.setValue((current) => current ? { ...current, items: current.items.filter((item) => item.id !== removedMessageId) } : current);
    topics.setValue((current) => current ? { ...current, items: current.items.map((item) => item.id === topicId ? { ...item, messages_count: Math.max(0, item.messages_count - 1) } : item) } : current);
  };
  return {
    countries,
    topics,
    messages,
    createTopic: (title: string) => apiJson<Topic>(`/countries/${countryId}/topics`, "POST", { title }),
    createMessage: (body: string) => apiJson<ForumMessage>(`/topics/${topicId}/messages`, "POST", { body }),
    removeTopic,
    removeMessage,
  };
}
export const useNotifications = () => { const resource = useResource(() => api<{ items: Notification[] }>("/notifications"), []); const read = async (ids?: number[]) => { await apiJson<{ updated: number }>("/notifications/read", "PATCH", ids ? { ids } : {}); await resource.reload(); }; return { ...resource, items: resource.value?.items ?? [], read }; };
export function useOnline(viewerId?: number) {
  const resource = useResource(() => api<OnlineUser[]>("/online"), [viewerId]);
  useEffect(() => {
    if (!viewerId) return;
    const interval = window.setInterval(() => { void resource.reload(); }, 30_000);
    return () => window.clearInterval(interval);
  }, [viewerId, resource.reload]);
  return resource;
}
export const usePublicSettings = () => useResource(() => api<PublicSettings>("/settings/public"), []);
export const useComments = (postId: number) => { const resource = useResource(() => api<Comment[]>(`/posts/${postId}/comments`), [postId]); const react = async (commentId: number, emoji: string) => { const result = await apiJson<ReactionResult>(`/comments/${commentId}/react`, "POST", { emoji }); resource.setValue((items) => (items ?? []).map((item) => item.id === commentId ? { ...item, ...result } : item)); }; const create = async (body: string, parentId: number | null = null) => { const comment = await apiJson<Comment>(`/posts/${postId}/comments`, "POST", { body, parent_id: parentId }); await resource.reload(); return comment; }; return { ...resource, comments: resource.value ?? [], react, create }; };
