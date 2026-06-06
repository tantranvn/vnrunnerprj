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
  email: string
  full_name: string
  password: string
  confirm_password: string
}

export const Route = createFileRoute("/signup")({
  component: SignUp,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
  head: () => ({
    meta: [
      {
        title: "Sign Up - VNRunner",
      },
    ],
  }),
})

function SignUp() {
  const { t } = useTranslation()
  const { signUpMutation } = useAuth()
  
  // Create schema with translated error messages
  const formSchema = z
    .object({
      email: z.email(),
      full_name: z.string().min(1, { message: t("auth.signup.errors.fullNameRequired") }),
      password: z
        .string()
        .min(1, { message: t("auth.signup.errors.passwordRequired") })
        .min(8, { message: t("auth.signup.errors.passwordMinLength") }),
      confirm_password: z
        .string()
        .min(1, { message: t("auth.signup.errors.confirmPasswordRequired") }),
    })
    .refine((data) => data.password === data.confirm_password, {
      message: t("auth.signup.errors.passwordMismatch"),
      path: ["confirm_password"],
    })
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      full_name: "",
      password: "",
      confirm_password: "",
    },
  })

  const onSubmit = (data: FormData) => {
    if (signUpMutation.isPending) return

    // exclude confirm_password from submission data
    const { confirm_password: _confirm_password, ...submitData } = data
    signUpMutation.mutate(submitData)
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
                  <h1 className="text-2xl font-bold">{t("auth.signup.title")}</h1>
                  <p className="text-sm text-muted-foreground">
                    {t("auth.signup.subtitle")}
                  </p>
                </div>

                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.signup.fullName")}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="full-name-input"
                            placeholder={t("auth.signup.fullNamePlaceholder")}
                            type="text"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.signup.email")}</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="email-input"
                            placeholder={t("auth.signup.emailPlaceholder")}
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.signup.password")}</FormLabel>
                        <FormControl>
                          <PasswordInput
                            data-testid="password-input"
                            placeholder={t("auth.signup.passwordPlaceholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirm_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.signup.confirmPassword")}</FormLabel>
                        <FormControl>
                          <PasswordInput
                            data-testid="confirm-password-input"
                            placeholder={t("auth.signup.confirmPasswordPlaceholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <LoadingButton
                    type="submit"
                    className="w-full"
                    loading={signUpMutation.isPending}
                  >
                    {t("auth.signup.signupButton")}
                  </LoadingButton>
                </div>

                <div className="text-center text-sm">
                  {t("auth.signup.alreadyHaveAccount")}{" "}
                  <RouterLink to="/login" className="underline underline-offset-4 hover:text-primary">
                    {t("auth.signup.loginLink")}
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
