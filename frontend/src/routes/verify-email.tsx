import { useMutation } from "@tanstack/react-query"
import {
  createFileRoute,
  Link as RouterLink,
  useNavigate,
  useSearch,
} from "@tanstack/react-router"
import { CheckCircle2, Sparkles, XCircle } from "lucide-react"
import { useEffect } from "react"
import { z } from "zod"

import { LoginService } from "@/client"
import { PublicFooter } from "@/components/Public/PublicFooter"
import { Button } from "@/components/ui/button"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

const searchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute("/verify-email")({
  component: VerifyEmail,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      {
        title: "Verify Email - VNRunner",
      },
    ],
  }),
})

function VerifyEmail() {
  const { token } = useSearch({ from: "/verify-email" })
  const navigate = useNavigate()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const verifyEmail = async (verificationToken: string) => {
    await LoginService.verifyEmail({
      token: verificationToken,
    })
  }

  const mutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: () => {
      showSuccessToast("Email verified successfully! You can now log in.")
    },
    onError: handleError.bind(showErrorToast),
  })

  useEffect(() => {
    if (token) {
      mutation.mutate(token)
    }
  }, [token, mutation.mutate])

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <RouterLink to="/" className="flex items-center justify-center gap-2">
            <Sparkles className="size-6" />
            <span className="text-2xl font-black tracking-wide uppercase">
              VNRUNNER
            </span>
          </RouterLink>

          {/* Content */}
          <div className="bg-card rounded-lg border p-8 shadow-sm">
            <div className="flex flex-col items-center gap-6 text-center">
              {mutation.isPending && (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                  <div>
                    <h1 className="text-2xl font-bold">Verifying Email...</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                      Please wait while we verify your email address
                    </p>
                  </div>
                </>
              )}

              {mutation.isSuccess && (
                <>
                  <CheckCircle2 className="size-16 text-green-500" />
                  <div>
                    <h1 className="text-2xl font-bold">Email Verified!</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                      Your email has been successfully verified. You can now
                      access all features.
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate({ to: "/login" })}
                    className="w-full"
                  >
                    Continue to Login
                  </Button>
                </>
              )}

              {mutation.isError && (
                <>
                  <XCircle className="size-16 text-red-500" />
                  <div>
                    <h1 className="text-2xl font-bold">Verification Failed</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                      The verification link is invalid or has expired. Please
                      try again or contact support.
                    </p>
                  </div>
                  <div className="flex gap-3 w-full">
                    <Button
                      variant="outline"
                      onClick={() => navigate({ to: "/login" })}
                      className="flex-1"
                    >
                      Go to Login
                    </Button>
                    <Button
                      onClick={() => navigate({ to: "/signup" })}
                      className="flex-1"
                    >
                      Sign Up Again
                    </Button>
                  </div>
                </>
              )}

              {!token && !mutation.isPending && (
                <>
                  <XCircle className="size-16 text-orange-500" />
                  <div>
                    <h1 className="text-2xl font-bold">
                      No Verification Token
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2">
                      Please use the verification link sent to your email
                      address.
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate({ to: "/login" })}
                    className="w-full"
                  >
                    Go to Login
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="text-center text-sm">
            Need help?{" "}
            <RouterLink
              to="/"
              className="underline underline-offset-4 hover:text-primary"
            >
              Contact Support
            </RouterLink>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
