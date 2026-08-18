/** API adapter for the F04 comments contract used by the F09a1 UI. */
export type Comment = {
  id: number;
  body: string;
  author: { id: number; name: string; avatar_url: string | null };
  reactions: Record<string, number>;
  my_reaction: string | null;
};

export type ReactionResult = Pick<Comment, "reactions" | "my_reaction">;

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

function authHeaders(): HeadersInit {
  const accessToken = sessionStorage.getItem("mps-access");
  return {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

/** Returns approved comments including author, aggregate emoji counts and viewer reaction. */
export async function getComments(postId: number): Promise<Comment[]> {
  const response = await fetch(`${apiUrl}/posts/${postId}/comments`, { headers: authHeaders() });
  if (!response.ok) throw new Error("Не удалось загрузить комментарии");
  return response.json() as Promise<Comment[]>;
}

/** Toggles the selected emoji for the signed-in viewer and returns fresh reaction state. */
export async function reactToComment(commentId: number, emoji: string): Promise<ReactionResult> {
  const response = await fetch(`${apiUrl}/comments/${commentId}/react`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ emoji }),
  });
  if (!response.ok) throw new Error("Войдите, чтобы поставить реакцию");
  return response.json() as Promise<ReactionResult>;
}
