import { useCallback, useEffect, useState } from "react";

import { api, apiJson, setAccessToken } from "../api/client";
import type { Comment, ReactionResult } from "../api/comments";

export type { Comment } from "../api/comments";

export type User = { id: number; email: string | null; name: string; avatar_url: string | null; bio: string | null; role: string; is_anonymous: boolean };
export type ApiPost = { id: number; type: "article" | "tip" | "video_review"; title: string; slug: string; body: string; views: number; likes_count: number; shot_at: string | null };
export type Review = { id: number; author_name: string; rating: number; body: string; photo_url: string | null; status: string };
export type Question = { id: number; target: "manager" | "lawyer"; body: string; status: string; answer: string | null };
export type Country = { id: number; name: string; topics_count: number };
export type Topic = { id: number; title: string; messages_count: number };
export type ForumMessage = { id: number; body: string; author: { id: number; name: string; avatar_url: string | null }; is_ai: boolean };
export type Notification = { id: number; type: string; payload: Record<string, unknown>; is_read: boolean; created_at: string };
export type OnlineUser = { id: number; name: string; avatar_url: string | null };

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
  const update = async (changes: Partial<Pick<User, "name" | "bio" | "avatar_url" | "is_anonymous">>) => { const updated = await apiJson<User>("/me", "PATCH", changes); setUser(updated); return updated; };
  return { user, loading, error, requestCode, verifyCode, update, reload: loadMe };
}

export const usePosts = () => useResource(() => api<ApiPost[]>("/posts"), []);
export const useReviews = () => { const resource = useResource(() => api<Review[]>("/reviews"), []); const create = async (body: Omit<Review, "id" | "status" | "photo_url">) => apiJson<Review>("/reviews", "POST", body); return { ...resource, create }; };
export const useSubscribe = () => ({ subscribe: (email: string) => apiJson<{ email: string; confirmed: boolean }>("/subscribe", "POST", { email }) });
export const useQA = () => { const resource = useResource(() => api<Question[]>("/qa/my"), []); const create = async (target: Question["target"], body: string) => { const item = await apiJson<Question>("/qa", "POST", { target, body }); resource.setValue((current) => [...(current ?? []), item]); return item; }; return { ...resource, create }; };
export const useForum = (countryId?: number, topicId?: number) => ({ countries: useResource(() => api<Country[]>("/countries"), []), topics: useResource(() => countryId ? api<Topic[]>(`/countries/${countryId}/topics`) : Promise.resolve([]), [countryId]), messages: useResource(() => topicId ? api<ForumMessage[]>(`/topics/${topicId}/messages`) : Promise.resolve([]), [topicId]), createTopic: (title: string) => apiJson<Topic>(`/countries/${countryId}/topics`, "POST", { title }), createMessage: (body: string) => apiJson<ForumMessage>(`/topics/${topicId}/messages`, "POST", { body }) });
export const useNotifications = () => { const resource = useResource(() => api<{ items: Notification[] }>("/notifications"), []); const read = async (ids?: number[]) => { await apiJson<{ updated: number }>("/notifications/read", "PATCH", ids ? { ids } : {}); await resource.reload(); }; return { ...resource, items: resource.value?.items ?? [], read }; };
export const useOnline = () => useResource(() => api<OnlineUser[]>("/online"), []);
export const useComments = (postId: number) => { const resource = useResource(() => api<Comment[]>(`/posts/${postId}/comments`), [postId]); const react = async (commentId: number, emoji: string) => { const result = await apiJson<ReactionResult>(`/comments/${commentId}/react`, "POST", { emoji }); resource.setValue((items) => (items ?? []).map((item) => item.id === commentId ? { ...item, ...result } : item)); }; const create = async (body: string) => { await apiJson(`/posts/${postId}/comments`, "POST", { body }); await resource.reload(); }; return { ...resource, comments: resource.value ?? [], react, create }; };
