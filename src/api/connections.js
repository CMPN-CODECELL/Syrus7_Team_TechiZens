// ============================================================================
// SWAP POINT: Connections feed (owner: backend / Supabase teammate)
//
// A LinkedIn-style feed: posts from the students the logged-in student is connected to
// (and their own), with likes, comments and replies.
// Right now this is fake: seed data from src/data/mockConnectionPosts.js and
// src/data/mockComments.js, and anything the student creates is kept in localStorage.
// To go live, replace each body with Supabase (connections, posts, post_likes and comments
// tables, all with Row Level Security). Keep names, inputs and returned shapes.
//
// Author:   { id, name, college, year }   college can be null (profiles have no college yet).
//           year = same numbers as the profile (-2 .. 5). The logged-in student's id is "me" in the mock.
// Post:     { id, author, type, text, opportunityId, createdAt, likeCount, likedByMe, commentCount }
//           type: "saved" | "recommended" | "looking_for_team" | "update"
// Comment:  { id, postId, parentId, author, text, createdAt }
//           parentId is null for a comment, or the id of the comment it replies to.
//           Replies sit one level under a comment (replying to a reply uses the same parentId).
// Never include contact details in any of these. Contacts are only shared after double opt-in.
// ============================================================================

import { getCurrentUser } from "@/api/auth"
import { getConnectedIds } from "@/api/people"
import { mockComments } from "@/data/mockComments"
import { mockConnectionPosts } from "@/data/mockConnectionPosts"

const KEYS = {
  liked: "nexus-liked-posts",
  myPosts: "nexus-my-posts",
  myComments: "nexus-my-comments",
}

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? []
  } catch {
    return []
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable: changes only last for this session.
  }
}

// The logged-in student as an author. (Mock: id is always "me".)
async function currentAuthor() {
  const user = await getCurrentUser()
  return { id: "me", name: user?.name ?? "You", college: null, year: user?.profile?.year ?? 2 }
}

function newId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

// ---- Posts -----------------------------------------------------------------

// Posts from the student's connections plus their own, newest first.
export async function getConnectionPosts() {
  const connected = await getConnectedIds()
  const liked = read(KEYS.liked)
  const comments = [...mockComments, ...read(KEYS.myComments)]
  return [...read(KEYS.myPosts), ...mockConnectionPosts.filter((post) => connected.includes(post.author.id))]
    .map((post) => {
      const likedByMe = liked.includes(post.id)
      return {
        ...post,
        likedByMe,
        likeCount: post.likeCount + (likedByMe ? 1 : 0),
        commentCount: comments.filter((c) => c.postId === post.id).length,
      }
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

// Creates a post by the logged-in student. `opportunityId` is optional (null for none).
// Returns the new post.
export async function createPost({ text, opportunityId = null }) {
  const post = {
    id: newId("my-post"),
    author: await currentAuthor(),
    type: "update",
    text,
    opportunityId,
    createdAt: new Date().toISOString(),
    likeCount: 0,
  }
  write(KEYS.myPosts, [post, ...read(KEYS.myPosts)])
  return { ...post, likedByMe: false, commentCount: 0 }
}

// Deletes one of the logged-in student's own posts (and its comments).
export async function deletePost(postId) {
  write(KEYS.myPosts, read(KEYS.myPosts).filter((post) => post.id !== postId))
  write(KEYS.myComments, read(KEYS.myComments).filter((comment) => comment.postId !== postId))
}

// Likes the post if it is not liked yet, otherwise removes the like.
export async function toggleLike(postId) {
  const liked = read(KEYS.liked)
  write(KEYS.liked, liked.includes(postId) ? liked.filter((id) => id !== postId) : [...liked, postId])
}

// ---- Comments --------------------------------------------------------------

// All comments and replies on a post, oldest first.
export async function getComments(postId) {
  return [...mockComments, ...read(KEYS.myComments)]
    .filter((comment) => comment.postId === postId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
}

// Adds a comment (parentId null) or a reply (parentId = the comment's id). Returns the new comment.
export async function addComment({ postId, parentId = null, text }) {
  const comment = {
    id: newId("my-comment"),
    postId,
    parentId,
    author: await currentAuthor(),
    text,
    createdAt: new Date().toISOString(),
  }
  write(KEYS.myComments, [...read(KEYS.myComments), comment])
  return comment
}

// Deletes one of the logged-in student's own comments. Replies to it go too.
export async function deleteComment(commentId) {
  write(
    KEYS.myComments,
    read(KEYS.myComments).filter((comment) => comment.id !== commentId && comment.parentId !== commentId)
  )
}
