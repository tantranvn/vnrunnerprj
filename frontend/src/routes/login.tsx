import { zodResolver } from "@hookform/resolvers/zod"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Body_login_login_access_token as AccessToken } from "@/client"
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
import { PublicFooter } from "@/components/Public/PublicFooter"
import { LanguageSwitcher } from "@/components/Common/LanguageSwitcher"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"

// We'll create the schema inside the component to access translations
type FormData = {
  username: string
  password: string
}

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/admin/dashboard",
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

  const onSubmit = (data: FormData) => {
    if (loginMutation.isPending) return
    loginMutation.mutate(data)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Language Switcher */}
          <div className="flex items-center justify-between">
            <RouterLink to="/" className="flex items-center gap-2">
              <Sparkles className="size-6" />
              <span className="text-2xl font-black tracking-wide uppercase">VNRUNNER</span>
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
                  <h1 className="text-2xl font-bold">{t("auth.login.title")}</h1>
                  <p className="text-sm text-muted-foreground">
                    {t("auth.login.subtitle")}
                  </p>
                </div>

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

                  <LoadingButton type="submit" loading={loginMutation.isPending}>
                    {t("auth.login.loginButton")}
                  </LoadingButton>
                </div>

                <div className="text-center text-sm">
                  {t("auth.login.noAccount")}{" "}
                  <RouterLink to="/signup" className="underline underline-offset-4 hover:text-primary">
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
