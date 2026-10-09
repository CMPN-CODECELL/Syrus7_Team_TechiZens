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
import { getOpportunities } from "@/api/opportunities"
import { getConnectedIds } from "@/api/people"
import { mockComments } from "@/data/mockComments"
import { mockConnectionPosts } from "@/data/mockConnectionPosts"
import { mockPeople } from "@/data/mockPeople"
import { isClosed } from "@/lib/ingestion"
import { getTopics, overlap } from "@/lib/scoring"

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

// Demo only: the invented posts were written for opportunities that no longer exist. Each one is pointed at a
// real, open opportunity that fits the author's interests (team posts prefer a team event), the same one every time.
function hashOf(text) {
  let hash = 0
  for (const character of text) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return hash
}

function withRealOpportunity(post, opportunities) {
  if (!post.opportunityId || opportunities.some((o) => o.id === post.opportunityId)) return post
  const author = mockPeople.find((person) => person.id === post.author.id)
  const open = opportunities.filter((o) => !isClosed(o))
  const teamOnly = post.type === "looking_for_team" ? open.filter((o) => o.teamSize) : []
  const pool = teamOnly.length > 0 ? teamOnly : open
  if (pool.length === 0) return { ...post, opportunityId: null }
  const best = pool
    .map((o) => ({ o, fit: overlap(author?.interests ?? [], getTopics(o)).length, tiebreak: hashOf(post.id + o.id) }))
    .sort((a, b) => b.fit - a.fit || a.tiebreak - b.tiebreak)[0]
  return { ...post, opportunityId: best.o.id }
}

// Posts from the student's connections plus their own, newest first.
export async function getConnectionPosts() {
  const connected = await getConnectedIds()
  const liked = read(KEYS.liked)
  const comments = [...mockComments, ...read(KEYS.myComments)]
  const opportunities = await getOpportunities()
  const demoPosts = mockConnectionPosts
    .filter((post) => connected.includes(post.author.id))
    .map((post) => withRealOpportunity(post, opportunities))
  return [...read(KEYS.myPosts), ...demoPosts]
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
