import { useEffect, useState } from "react"
import { isDemoLogin } from "@/api/auth"
import { createPost, deletePost, getConnectionPosts, toggleLike } from "@/api/connections"
import { getOpportunities } from "@/api/opportunities"
import {
  acceptInvitation,
  getNetwork,
  ignoreInvitation,
  removeConnection,
  sendConnectionRequest,
  withdrawConnectionRequest,
} from "@/api/people"
import { subscribeToChanges } from "@/api/realtime"
import ConnectionPost from "@/components/ConnectionPost"
import ConnectionsList from "@/components/ConnectionsList"
import FindPeople from "@/components/FindPeople"
import PeoplePanel from "@/components/PeoplePanel"
import PostComposer from "@/components/PostComposer"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { isClosed } from "@/lib/ingestion"

const EMPTY_NETWORK = { connections: [], invitations: [], sent: [], suggestions: [] }

// A LinkedIn-style page. Tabs: Feed (write posts; like, comment and reply), Connections (your people,
// invitations and sent requests) and Find people (everyone you could connect with).
// The side panel shows invitations and a few people you may know.
// Everything is real: students, connections and posts come from Supabase, and the page updates live.
// `tab` and `onTabChange` live in App.jsx so Back from a profile returns to the same tab.
export default function ConnectionsPage({ onOpen, tab, onTabChange }) {
  const [posts, setPosts] = useState(null) // null = still loading
  const [network, setNetwork] = useState(null)
  const [opportunities, setOpportunities] = useState([])
  const [loadError, setLoadError] = useState(false)
  const [actionError, setActionError] = useState("")
  const [now, setNow] = useState(() => Date.now())

  async function reloadPosts() {
    setPosts(await getConnectionPosts())
    setNow(Date.now())
  }

  async function reloadNetwork() {
    setNetwork(await getNetwork())
  }

  useEffect(() => {
    Promise.all([getConnectionPosts(), getNetwork(), getOpportunities()])
      .then(([loadedPosts, loadedNetwork, loadedOpportunities]) => {
        setPosts(loadedPosts)
        setNetwork(loadedNetwork)
        setOpportunities(loadedOpportunities)
      })
      .catch(() => setLoadError(true))

    // Live updates: a new invitation, an accepted request, a new post or comment.
    const refresh = (what) => () => Promise.all(what.map((load) => load())).catch(() => {})
    const stopPeople = subscribeToChanges(["connections"], refresh([reloadNetwork, reloadPosts]))
    const stopPosts = subscribeToChanges(["posts", "comments", "post_likes"], refresh([reloadPosts]))
    return () => {
      stopPeople()
      stopPosts()
    }
  }, [])

  // Runs an action, shows a plain message if it fails, then reloads what it may have changed.
  async function run(action, { feed = false } = {}) {
    setActionError("")
    try {
      await action()
    } catch (failure) {
      setActionError(failure.message || "Something went wrong. Please try again.")
    }
    await Promise.all([reloadNetwork(), feed ? reloadPosts() : null]).catch(() => {})
  }

  const handleConnect = (personId) => run(() => sendConnectionRequest(personId))
  const handleWithdraw = (personId) => run(() => withdrawConnectionRequest(personId))
  const handleAccept = (invitationId) => run(() => acceptInvitation(invitationId), { feed: true }) // their posts join the feed
  const handleIgnore = (invitationId) => run(() => ignoreInvitation(invitationId))
  const handleRemove = (personId) => run(() => removeConnection(personId), { feed: true }) // their posts leave the feed

  // Returns true when the post was saved (the composer keeps the text otherwise).
  async function handlePost({ text, opportunityId, type }) {
    setActionError("")
    try {
      const post = await createPost({ text, opportunityId, type })
      setPosts((current) => [post, ...(current ?? [])])
      return true
    } catch (failure) {
      setActionError(failure.message || "Could not post. Please try again.")
      return false
    }
  }

  async function handleDelete(postId) {
    setPosts((current) => current.filter((post) => post.id !== postId))
    setActionError("")
    try {
      await deletePost(postId)
    } catch (failure) {
      setActionError(failure.message || "Could not delete the post.")
      await reloadPosts().catch(() => {})
    }
  }

  // Shows the new like count at once, then saves it (and goes back if it did not work).
  async function handleLike(postId) {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, likedByMe: !post.likedByMe, likeCount: post.likeCount + (post.likedByMe ? -1 : 1) }
          : post
      )
    )
    try {
      await toggleLike(postId)
    } catch (failure) {
      setActionError(failure.message || "Could not save your like.")
      await reloadPosts().catch(() => {})
    }
  }

  function handleCommentCountChange(postId, delta) {
    setPosts((current) =>
      current.map((post) => (post.id === postId ? { ...post, commentCount: post.commentCount + delta } : post))
    )
  }

  const byId = Object.fromEntries(opportunities.map((o) => [o.id, o]))
  const { connections, invitations, sent, suggestions } = network ?? EMPTY_NETWORK
  const loading = posts === null || network === null

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <h1 className="sr-only">Connections</h1>

      {isDemoLogin ? (
        <p className="col-span-full rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
          This is the local demo login, so there are no other students. Sign in with Google to use Connections.
        </p>
      ) : (
        <p className="col-span-full rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
          Real students only. You see posts from your connections, and your posts are seen only by them. Contact details
          are never shown here.
        </p>
      )}

      {actionError && (
        <p role="alert" className="col-span-full rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}

      <Tabs value={tab} onValueChange={onTabChange} className="gap-4">
        <TabsList>
          <TabsTrigger value="feed" className="px-3">
            Feed
          </TabsTrigger>
          <TabsTrigger value="connections" className="px-3">
            Connections
            {invitations.length > 0 && (
              <span
                className="ml-1.5 rounded-full bg-primary px-1.5 text-xs leading-5 text-primary-foreground"
                title={`${invitations.length} waiting`}
              >
                {invitations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="find" className="px-3">
            Find people
          </TabsTrigger>
        </TabsList>

        {/* Feed */}
        <TabsContent value="feed" className="space-y-4">
          <PostComposer opportunities={opportunities.filter((o) => !isClosed(o))} onPost={handlePost} />

          {loadError ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Could not load the feed. Please try again.
            </p>
          ) : loading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Loading...</p>
          ) : posts.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {connections.length === 0
                  ? "Your feed shows posts from the people you connect with. Find students who share your interests to get started."
                  : "Nothing here yet. Write the first post."}
              </p>
              {connections.length === 0 && <Button onClick={() => onTabChange("find")}>Find people</Button>}
            </div>
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
        </TabsContent>

        {/* Connections */}
        <TabsContent value="connections">
          {loading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Loading...</p>
          ) : (
            <ConnectionsList
              connections={connections}
              invitations={invitations}
              sent={sent}
              now={now}
              onAccept={handleAccept}
              onIgnore={handleIgnore}
              onWithdraw={handleWithdraw}
              onRemove={handleRemove}
              onFind={() => onTabChange("find")}
            />
          )}
        </TabsContent>

        {/* Find people */}
        <TabsContent value="find">
          {loading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Loading...</p>
          ) : (
            <FindPeople suggestions={suggestions} onConnect={handleConnect} onWithdraw={handleWithdraw} />
          )}
        </TabsContent>
      </Tabs>

      {/* Side panel: stays in view while scrolling the feed on wide screens */}
      {!loading && (
        <div className="lg:sticky lg:top-20 lg:self-start">
          <PeoplePanel
            invitations={invitations}
            suggestions={suggestions}
            onAccept={handleAccept}
            onIgnore={handleIgnore}
            onConnect={handleConnect}
            onWithdraw={handleWithdraw}
            onSeeAll={() => onTabChange("find")}
          />
        </div>
      )}
    </div>
  )
}
