// ============================================================================
// SWAP POINT: Connections feed (owner: backend / Supabase teammate)
//
// A LinkedIn-style timeline of activity posts from the students the logged-in student
// is connected to. Right now this is fake: posts come from src/data/mockConnectionPosts.js
// and likes are kept in localStorage.
// To go live, replace each body with Supabase (a connections table, a posts table, a likes
// table, all protected by Row Level Security). Keep names, inputs and returned shapes.
//
// A post looks like:
//   {
//     id,
//     author: { id, name, college, year },   // year = same numbers as the profile (-2 .. 5)
//     type,                                   // "saved" | "recommended" | "looking_for_team" | "update"
//     text,                                   // string or null
//     opportunityId,                          // the opportunity it is about, or null
//     createdAt,                              // ISO date-time
//     likeCount,                              // total likes, including this student's
//     likedByMe,                              // boolean
//   }
// Never include contact details here. Contacts are only shared after double opt-in.
// ============================================================================

import { mockConnectionPosts } from "@/data/mockConnectionPosts"

const STORAGE_KEY = "nexus-liked-posts"

function readLiked() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
  } catch {
    return []
  }
}

function writeLiked(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // Storage unavailable: likes only last for this session.
  }
}

// Posts from the student's connections, newest first.
export async function getConnectionPosts() {
  const liked = readLiked()
  return mockConnectionPosts
    .map((post) => {
      const likedByMe = liked.includes(post.id)
      return { ...post, likedByMe, likeCount: post.likeCount + (likedByMe ? 1 : 0) }
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

// Likes the post if it is not liked yet, otherwise removes the like.
export async function toggleLike(postId) {
  const liked = readLiked()
  writeLiked(liked.includes(postId) ? liked.filter((id) => id !== postId) : [...liked, postId])
}
