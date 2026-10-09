import { useEffect, useState } from "react"
import { createPost, deletePost, getConnectionPosts, toggleLike } from "@/api/connections"
import { getOpportunities } from "@/api/opportunities"
import ConnectionPost from "@/components/ConnectionPost"
import PeoplePanel from "@/components/PeoplePanel"
import PostComposer from "@/components/PostComposer"

// A LinkedIn-style feed: write posts, and like, comment and reply on posts from your connections.
export default function ConnectionsPage({ onOpen }) {
  const [posts, setPosts] = useState(null) // null = still loading
  const [opportunities, setOpportunities] = useState([])
  const [loadError, setLoadError] = useState(false)
  const [now] = useState(() => Date.now())

  useEffect(() => {
    Promise.all([getConnectionPosts(), getOpportunities()])
      .then(([loadedPosts, loadedOpportunities]) => {
        setPosts(loadedPosts)
        setOpportunities(loadedOpportunities)
      })
      .catch(() => setLoadError(true))
  }, [])

  // Re-reads the feed (used after accepting an invitation, which adds that person's posts).
  // The student's own posts are kept by the api, so nothing is lost.
  async function reloadPosts() {
    setPosts(await getConnectionPosts())
  }

  async function handlePost({ text, opportunityId }) {
    const post = await createPost({ text, opportunityId })
    setPosts((current) => [post, ...current])
  }

  async function handleDelete(postId) {
    setPosts((current) => current.filter((post) => post.id !== postId))
    await deletePost(postId)
  }

  // Shows the new like count at once, then saves it.
  function handleLike(postId) {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, likedByMe: !post.likedByMe, likeCount: post.likeCount + (post.likedByMe ? -1 : 1) }
          : post
      )
    )
    toggleLike(postId)
  }

  function handleCommentCountChange(postId, delta) {
    setPosts((current) =>
      current.map((post) => (post.id === postId ? { ...post, commentCount: post.commentCount + delta } : post))
    )
  }

  const byId = Object.fromEntries(opportunities.map((o) => [o.id, o]))

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <h1 className="sr-only">Connections</h1>

      {/* Feed */}
      <div className="space-y-4">
        <PostComposer opportunities={opportunities} onPost={handlePost} />

        {loadError ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Could not load the feed. Please try again.
          </p>
        ) : posts === null ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nothing here yet. Write the first post.
          </p>
        ) : (
          posts.map((post) => (
            <ConnectionPost
              key={post.id}
              post={post}
              opportunity={post.opportunityId ? byId[post.opportunityId] : undefined}
              now={now}
              onLike={handleLike}
              onOpen={onOpen}
              onDelete={handleDelete}
              onCommentCountChange={handleCommentCountChange}
            />
          ))
        )}
      </div>

      {/* Side panel: stays in view while scrolling the feed on wide screens */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <PeoplePanel onConnectionsChange={reloadPosts} />
      </div>
    </div>
  )
}
