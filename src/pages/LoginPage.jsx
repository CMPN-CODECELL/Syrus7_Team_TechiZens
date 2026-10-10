import { Compass, ShieldCheck, Users } from "lucide-react"
import Footer from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isDemoLogin } from "@/api/auth"
import { useUser } from "@/context/user-context"

const HIGHLIGHTS = [
  { icon: Compass, text: "Opportunities ranked for you" },
  { icon: ShieldCheck, text: "Verified, trustworthy details" },
  { icon: Users, text: "Squads that fit your skills" },
]

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}

export default function LoginPage({ onOpenLegal }) {
  const { signIn } = useUser()

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-16">
        {/* Intro */}
        <section>
          <p className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
            <img src="/logo.png" alt="" className="size-12" />
            Nexus
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            Find what's worth your time.
          </h1>

          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item.text} className="flex items-center gap-3 text-muted-foreground">
                <item.icon className="size-5" />
                {item.text}
              </li>
            ))}
          </ul>
        </section>

        {/* Sign in */}
        <Card className="w-full max-w-sm justify-self-center lg:justify-self-end">
          <CardHeader>
            <CardTitle className="text-2xl">Get started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="h-11 w-full text-base" onClick={signIn}>
              <GoogleIcon />
              Sign in with Google
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              By signing in you agree to the{" "}
              <button type="button" onClick={() => onOpenLegal("terms")} className="underline underline-offset-4 hover:text-foreground">
                Terms of Use
              </button>{" "}
              and the{" "}
              <button type="button" onClick={() => onOpenLegal("privacy")} className="underline underline-offset-4 hover:text-foreground">
                Privacy Policy
              </button>
              . School students need a parent or guardian's permission.
            </p>
            {isDemoLogin && (
              <p className="text-center text-xs text-muted-foreground">
                Demo mode · no real Google account is used.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer onOpen={onOpenLegal} />
    </div>
  )
}
