import { LoginForm } from "@/components/login/login-form"
import { Particles } from "@/components/ui/particles"
export default function Page() {
  return (
    <div className="flex w-full h-[99vh] items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
        <Particles
          className="absolute inset-0 z-0"
          quantity={200}
          ease={80}
          color="rgba(255, 255, 255, 0.5)"
          refresh
        />
      </div>
    </div>
  )
}