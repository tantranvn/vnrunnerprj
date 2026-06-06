import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { Mail, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import type { Body_login_login_access_token as AccessToken } from "@/client"
import { LoginService } from "@/client"
import { LanguageSwitcher } from "@/components/Common/LanguageSwitcher"
import { PublicFooter } from "@/components/Public/PublicFooter"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"

// We'll create the schema inside the component to access translations
type FormData = {
  username: string
  password: string
}

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      // Let the default redirect handle it - user is already logged in
      throw redirect({
        to: "/",
      })
    }
  },
  head: () => ({
    meta: [
      {
        title: "Log In - VNRunner",
      },
    ],
  }),
})

function Login() {
  const { t } = useTranslation()
  const { loginMutation } = useAuth()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [showResendVerification, setShowResendVerification] = useState(false)
  const [emailForVerification, setEmailForVerification] = useState("")

  // Create schema with translated error messages
  const formSchema = z.object({
    username: z.email(),
    password: z
      .string()
      .min(1, { message: t("auth.login.errors.passwordRequired") })
      .min(8, { message: t("auth.login.errors.passwordMinLength") }),
  }) satisfies z.ZodType<AccessToken>

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const resendVerificationMutation = useMutation({
    mutationFn: (email: string) =>
      LoginService.resendVerificationEmail({ email }),
    onSuccess: () => {
      showSuccessToast("Verification email sent! Please check your inbox.")
      setShowResendVerification(false)
    },
    onError: () => {
      showErrorToast("Failed to send verification email. Please try again.")
    },
  })

  // Watch for login errors and show verification alert if needed
  useEffect(() => {
    if (loginMutation.error) {
      const error = loginMutation.error as any
      if (error?.body?.detail?.includes("verify your email")) {
        setShowResendVerification(true)
      }
    }
  }, [loginMutation.error])

  const onSubmit = (data: FormData) => {
    if (loginMutation.isPending) return

    // Reset verification message state
    setShowResendVerification(false)
    setEmailForVerification(data.username)

    loginMutation.mutate(data)
  }

  const handleResendVerification = () => {
    if (emailForVerification) {
      resendVerificationMutation.mutate(emailForVerification)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Language Switcher */}
          <div className="flex items-center justify-between">
            <RouterLink to="/" className="flex items-center gap-2">
              <Sparkles className="size-6" />
              <span className="text-2xl font-black tracking-wide uppercase">
                VNRUNNER
              </span>
            </RouterLink>
            <LanguageSwitcher noUrlChange />
          </div>

          {/* Form */}
          <div className="bg-card rounded-lg border p-8 shadow-sm">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-6"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">
                    {t("auth.login.title")}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {t("auth.login.subtitle")}
                  </p>
                </div>

                {showResendVerification && (
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between gap-2">
                      <span className="text-sm">
                        Please verify your email address before logging in.
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResendVerification}
                        disabled={resendVerificationMutation.isPending}
                      >
                        {resendVerificationMutation.isPending
                          ? "Sending..."
                          : "Resend Email"}
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.login.email")}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="email-input"
                            placeholder={t("auth.login.emailPlaceholder")}
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center">
                          <FormLabel>{t("auth.login.password")}</FormLabel>
                          <RouterLink
                            to="/recover-password"
                            className="ml-auto text-sm underline-offset-4 hover:underline hover:text-primary"
                          >
                            {t("auth.login.forgotPassword")}
                          </RouterLink>
                        </div>
                        <FormControl>
                          <PasswordInput
                            data-testid="password-input"
                            placeholder={t("auth.login.passwordPlaceholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <LoadingButton
                    type="submit"
                    loading={loginMutation.isPending}
                  >
                    {t("auth.login.loginButton")}
                  </LoadingButton>
                </div>

                <div className="text-center text-sm">
                  {t("auth.login.noAccount")}{" "}
                  <RouterLink
                    to="/signup"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    {t("auth.login.signupLink")}
                  </RouterLink>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
