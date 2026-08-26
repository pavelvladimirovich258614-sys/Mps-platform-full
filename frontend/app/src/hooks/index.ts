import { useCallback, useEffect, useRef, useState } from "react";

import { api, apiForm, ApiError, apiJson, setAccessToken } from "../api/client";
import type { Comment, ReactionResult } from "../api/comments";

export type { Comment } from "../api/comments";

export type User = { id: number; email: string | null; name: string; avatar_url: string | null; bio: string | null; role: string; is_anonymous: boolean };
export type ApiPost = { id: number; type: "article" | "fishka" | "video_review"; title: string; slug: string; body: string; emoji?: string | null; cover_url?: string | null; liked_at?: string | null; views: number; likes_count: number; shot_at: string | null; author: { id: number; name: string; avatar_url: string | null } };
export type PostDraft = { title: string; type: "article"; body: string; status: "draft" | "published"; cover_url?: string | null };
export type DraftSummary = { id: number; title: string; updated_at: string };
export type DraftPost = ApiPost & { status: "draft"; updated_at: string };
export type Review = { id: number; author_name: string; rating: number; body: string; photo_url: string | null; status: string };
export type Question = { id: number; target: "manager" | "lawyer"; body: string; status: string; answer: string | null };
export type Country = { id: number; name: string; topics_count: number };
export type Topic = { id: number; title: string; author_id: number; messages_count: number };
export type ForumMessage = { id: number; body: string; author: { id: number; name: string; avatar_url: string | null }; is_ai: boolean };
export type ForumPage<T> = { items: T[]; next_cursor: string | null };
export type Notification = { id: number; type: string; payload: Record<string, unknown>; is_read: boolean; created_at: string };
export type OnlineUser = { id: number; name: string; avatar_url: string | null };
export type PublicProfile = { id: number; name: string; avatar_url: string | null; bio: string | null; posts_count: number; followers_count: number; following_count: number; is_following: boolean; countries: Array<{ id: number; name: string; flag_emoji: string }> };
export type PublicProfileFollow = { id: number; name: string; avatar_url: string | null; is_following: boolean };
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

function useResource<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [value, setValue] = useState<T | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const reload = useCallback(async () => { setLoading(true); setError(""); try { setValue(await load()); } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось загрузить данные"); } finally { setLoading(false); } }, deps);
  useEffect(() => { void reload(); }, [reload]);
  return { value, loading, error, reload, setValue };
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

export const usePosts = () => useResource(() => api<ApiPost[]>("/posts"), []);
export const usePostCreator = () => ({ create: (post: PostDraft) => apiJson<ApiPost>("/posts", "POST", post) });
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
export const useReviews = () => { const resource = useResource(() => api<Review[]>("/reviews"), []); const create = async (body: Omit<Review, "id" | "status" | "photo_url">) => apiJson<Review>("/reviews", "POST", body); return { ...resource, create }; };
export const useSubscribe = () => ({ subscribe: (email: string) => apiJson<{ email: string; confirmed: boolean }>("/subscribe", "POST", { email }) });
export const useQA = () => { const resource = useResource(() => api<Question[]>("/qa/my"), []); const create = async (target: Question["target"], body: string) => { const item = await apiJson<Question>("/qa", "POST", { target, body }); resource.setValue((current) => [...(current ?? []), item]); return item; }; return { ...resource, create }; };
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
export const useComments = (postId: number) => { const resource = useResource(() => api<Comment[]>(`/posts/${postId}/comments`), [postId]); const react = async (commentId: number, emoji: string) => { const result = await apiJson<ReactionResult>(`/comments/${commentId}/react`, "POST", { emoji }); resource.setValue((items) => (items ?? []).map((item) => item.id === commentId ? { ...item, ...result } : item)); }; const create = async (body: string) => { const comment = await apiJson<Comment>(`/posts/${postId}/comments`, "POST", { body }); await resource.reload(); return comment; }; return { ...resource, comments: resource.value ?? [], react, create }; };
