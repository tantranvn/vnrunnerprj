import { Appearance } from "@/components/Common/Appearance"
import { Sparkles } from "lucide-react"
import { PublicFooter } from "@/components/Public/PublicFooter"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="bg-[#0F0E0C] relative hidden lg:flex lg:items-center lg:justify-center">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="size-8" />
          <span className="text-3xl font-black tracking-wide uppercase">VNRUNNER</span>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-end">
          <Appearance />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
        <PublicFooter />
      </div>
    </div>
  )
}
