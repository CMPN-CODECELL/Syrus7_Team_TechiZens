import { useEffect, useState } from "react"
import { getConnectionPosts, toggleLike } from "@/api/connections"
import { getOpportunities } from "@/api/opportunities"
import ConnectionPost from "@/components/ConnectionPost"

// A timeline of activity from the students you are connected to.
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

  const byId = Object.fromEntries(opportunities.map((o) => [o.id, o]))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Connections</h1>

      {loadError ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Could not load the feed. Please try again.
        </p>
      ) : posts === null ? (
        <p className="p-8 text-center text-sm text-muted-foreground">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nothing here yet. Activity from your connections will show up here.
        </p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <ConnectionPost
              key={post.id}
              post={post}
              opportunity={post.opportunityId ? byId[post.opportunityId] : undefined}
              now={now}
              onLike={handleLike}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </div>
  )
}
