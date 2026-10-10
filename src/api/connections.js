// ============================================================================
// Connections feed (Supabase: posts, post_likes, comments and the views feed_posts / post_comments, see 0010).
//
// A LinkedIn-style feed: posts from the students the signed-in student is connected to (and their own),
// with likes, comments and replies. Row Level Security decides who sees what: a student only ever receives
// posts and comments of their connections and themself.
// Without a real sign-in (the local demo login) the feed is empty and actions throw.
//
// Author:   { id, name, college, year }   college can be null. year = same numbers as the profile (-2 .. 5).
//           The signed-in student's id is "me".
// Post:     { id, author, type, text, opportunityId, createdAt, likeCount, likedByMe, commentCount }
//           type: "saved" | "recommended" | "looking_for_team" | "update"
// Comment:  { id, postId, parentId, author, text, createdAt }
//           parentId is null for a comment, or the id of the comment it replies to.
//           Replies sit one level under a comment (replying to a reply uses the same parentId).
// Never include contact details in any of these. Contacts are only shared after double opt-in.
// ============================================================================

import { getUserId, requireUserId, screenId, unwrap } from "@/api/shared"
import { supabase } from "@/lib/supabase"

const FEED_LIMIT = 100
const POST_TYPES = ["update", "recommended", "looking_for_team"] // what a student can write (the others are for later)

const POST_COLUMNS =
  "id, type, text, opportunity_id, created_at, author_id, author_name, author_college, author_year, like_count, liked_by_me, comment_count"
const COMMENT_COLUMNS = "id, post_id, parent_id, text, created_at, author_id, author_name, author_college, author_year"

function toAuthor(row, myId) {
  return { id: screenId(row.author_id, myId), name: row.author_name || "Student", college: row.author_college || null, year: row.author_year }
}

function toPost(row, myId) {
  return {
    id: row.id,
    author: toAuthor(row, myId),
    type: row.type,
    text: row.text ?? "",
    opportunityId: row.opportunity_id,
    createdAt: row.created_at,
    likeCount: row.like_count,
    likedByMe: row.liked_by_me,
    commentCount: row.comment_count,
  }
}

function toComment(row, myId) {
  return {
    id: row.id,
    postId: row.post_id,
    parentId: row.parent_id,
    author: toAuthor(row, myId),
    text: row.text,
    createdAt: row.created_at,
  }
}

// ---- Posts -----------------------------------------------------------------

// Posts from the student's connections plus their own, newest first.
export async function getConnectionPosts() {
  const myId = await getUserId()
  if (!myId) return []
  const rows = unwrap(
    await supabase.from("feed_posts").select(POST_COLUMNS).order("created_at", { ascending: false }).limit(FEED_LIMIT)
  )
  return rows.map((row) => toPost(row, myId))
}

// Creates a post by the signed-in student. `opportunityId` is optional (null for none).
// `type` is "update" (default), "recommended" or "looking_for_team". Returns the new post.
export async function createPost({ text, opportunityId = null, type = "update" }) {
  const myId = await requireUserId()
  const { id } = unwrap(
    await supabase
      .from("posts")
      .insert({
        author_id: myId,
        type: POST_TYPES.includes(type) ? type : "update",
        text,
        opportunity_id: opportunityId,
      })
      .select("id")
      .single()
  )
  const row = unwrap(await supabase.from("feed_posts").select(POST_COLUMNS).eq("id", id).single())
  return toPost(row, myId)
}

// Deletes one of the signed-in student's own posts (its comments and likes go too).
export async function deletePost(postId) {
  const myId = await requireUserId()
  unwrap(await supabase.from("posts").delete().eq("id", postId).eq("author_id", myId))
}

// Likes the post if it is not liked yet, otherwise removes the like.
export async function toggleLike(postId) {
  const myId = await requireUserId()
  const existing = unwrap(
    await supabase.from("post_likes").select("post_id").eq("post_id", postId).eq("user_id", myId).maybeSingle()
  )
  if (existing) {
    unwrap(await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", myId))
  } else {
    const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: myId })
    if (error && error.code !== "23505") throw new Error(error.message) // 23505: already liked
  }
}

// ---- Comments --------------------------------------------------------------

// All comments and replies on a post, oldest first.
export async function getComments(postId) {
  const myId = await getUserId()
  if (!myId) return []
  const rows = unwrap(
    await supabase.from("post_comments").select(COMMENT_COLUMNS).eq("post_id", postId).order("created_at", { ascending: true })
  )
  return rows.map((row) => toComment(row, myId))
}

// Adds a comment (parentId null) or a reply (parentId = the comment's id). Returns the new comment.
export async function addComment({ postId, parentId = null, text }) {
  const myId = await requireUserId()
  const { id } = unwrap(
    await supabase
      .from("comments")
      .insert({ post_id: postId, parent_id: parentId, author_id: myId, text })
      .select("id")
      .single()
  )
  const row = unwrap(await supabase.from("post_comments").select(COMMENT_COLUMNS).eq("id", id).single())
  return toComment(row, myId)
}

// Deletes one of the signed-in student's own comments. Replies to it go too.
export async function deleteComment(commentId) {
  const myId = await requireUserId()
  unwrap(await supabase.from("comments").delete().eq("id", commentId).eq("author_id", myId))
}
