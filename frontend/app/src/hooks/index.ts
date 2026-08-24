import { useCallback, useEffect, useRef, useState } from "react";

import { api, apiForm, ApiError, apiJson, setAccessToken } from "../api/client";
import type { Comment, ReactionResult } from "../api/comments";

export type { Comment } from "../api/comments";

export type User = { id: number; email: string | null; name: string; avatar_url: string | null; bio: string | null; role: string; is_anonymous: boolean };
export type ApiPost = { id: number; type: "article" | "fishka" | "tip" | "video_review"; title: string; slug: string; body: string; cover_url?: string | null; views: number; likes_count: number; shot_at: string | null; author: { id: number; name: string; avatar_url: string | null } };
export type PostDraft = { title: string; type: "article"; body: string; status: "draft" | "published"; cover_url?: string | null };
export type DraftSummary = { id: number; title: string; updated_at: string };
export type DraftPost = ApiPost & { status: "draft"; updated_at: string };
export type Review = { id: number; author_name: string; rating: number; body: string; photo_url: string | null; status: string };
export type Question = { id: number; target: "manager" | "lawyer"; body: string; status: string; answer: string | null };
export type Country = { id: number; name: string; topics_count: number };
export type Topic = { id: number; title: string; messages_count: number };
export type ForumMessage = { id: number; body: string; author: { id: number; name: string; avatar_url: string | null }; is_ai: boolean };
export type Notification = { id: number; type: string; payload: Record<string, unknown>; is_read: boolean; created_at: string };
export type OnlineUser = { id: number; name: string; avatar_url: string | null };
export type PublicProfile = { id: number; name: string; avatar_url: string | null; bio: string | null; posts_count: number; followers_count: number; following_count: number; is_following: boolean; countries: Array<{ id: number; name: string; flag_emoji: string }> };
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
export const useLikedPosts = (userId?: number) => useResource(() => userId ? api<ApiPost[]>(`/users/${userId}/likes`) : Promise.resolve([]), [userId]);
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
export const useForum = (countryId?: number, topicId?: number) => ({ countries: useResource(() => api<Country[]>("/countries"), []), topics: useResource(() => countryId ? api<Topic[]>(`/countries/${countryId}/topics`) : Promise.resolve([]), [countryId]), messages: useResource(() => topicId ? api<ForumMessage[]>(`/topics/${topicId}/messages`) : Promise.resolve([]), [topicId]), createTopic: (title: string) => apiJson<Topic>(`/countries/${countryId}/topics`, "POST", { title }), createMessage: (body: string) => apiJson<ForumMessage>(`/topics/${topicId}/messages`, "POST", { body }) });
export const useNotifications = () => { const resource = useResource(() => api<{ items: Notification[] }>("/notifications"), []); const read = async (ids?: number[]) => { await apiJson<{ updated: number }>("/notifications/read", "PATCH", ids ? { ids } : {}); await resource.reload(); }; return { ...resource, items: resource.value?.items ?? [], read }; };
export const useOnline = () => useResource(() => api<OnlineUser[]>("/online"), []);
export const usePublicSettings = () => useResource(() => api<PublicSettings>("/settings/public"), []);
export const useComments = (postId: number) => { const resource = useResource(() => api<Comment[]>(`/posts/${postId}/comments`), [postId]); const react = async (commentId: number, emoji: string) => { const result = await apiJson<ReactionResult>(`/comments/${commentId}/react`, "POST", { emoji }); resource.setValue((items) => (items ?? []).map((item) => item.id === commentId ? { ...item, ...result } : item)); }; const create = async (body: string) => { const comment = await apiJson<Comment>(`/posts/${postId}/comments`, "POST", { body }); await resource.reload(); return comment; }; return { ...resource, comments: resource.value ?? [], react, create }; };
