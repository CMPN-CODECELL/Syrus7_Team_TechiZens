import { useState } from "react"
import { deleteMyAccount } from "@/api/account"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CONTACT } from "@/data/legal"
import { useUser } from "@/context/user-context"

// "Delete my account" on the Profile page (Privacy Policy: you can delete your data at any time).
// Asks the student to type DELETE first, so it cannot happen by accident.
export default function DeleteAccountCard() {
  const { signOut } = useUser()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState("")
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleDelete(event) {
    event.preventDefault()
    setBusy(true)
    setFailed(false)
    const ok = await deleteMyAccount()
    if (ok) {
      await signOut()
    } else {
      setFailed(true)
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delete my account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          This permanently deletes your profile, saved opportunities and everything linked to them. It cannot be undone.
        </p>

        {!open ? (
          <Button variant="destructive" onClick={() => setOpen(true)}>
            Delete my account
          </Button>
        ) : (
          <form onSubmit={handleDelete} className="space-y-2">
            <label htmlFor="confirm-delete" className="text-sm font-medium">
              Type DELETE to confirm
            </label>
            <Input id="confirm-delete" value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" />
            {failed && (
              <p role="alert" className="text-sm text-destructive">
                Could not delete the account. Please try again, or write to {CONTACT.email}.
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" disabled={typed !== "DELETE" || busy}>
                {busy ? "Deleting..." : "Delete everything"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setOpen(false)
                  setTyped("")
                  setFailed(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
