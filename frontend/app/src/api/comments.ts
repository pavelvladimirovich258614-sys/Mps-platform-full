import { api, apiJson } from "./client";

/** API adapter for the F04 comments contract used by the F09 UI. */
export type Comment = {
  id: number;
  parent_id: number | null;
  status: "pending" | "approved" | "rejected";
  body: string;
  author: { id: number; name: string; avatar_url: string | null };
  reactions: Record<string, number>;
  my_reaction: string | null;
};

export type ReactionResult = Pick<Comment, "reactions" | "my_reaction">;

/** Returns approved comments including author, aggregate emoji counts and viewer reaction. */
export async function getComments(postId: number): Promise<Comment[]> {
  return api<Comment[]>(`/posts/${postId}/comments`);
}

/** Toggles the selected emoji for the signed-in viewer and returns fresh reaction state. */
export async function reactToComment(commentId: number, emoji: string): Promise<ReactionResult> {
  return apiJson<ReactionResult>(`/comments/${commentId}/react`, "POST", { emoji });
}
