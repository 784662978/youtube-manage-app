import { AppSidebar } from '@/components/app-sidebar'
import { DynamicBreadcrumb } from '@/components/dynamic-breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { LogoutButton } from '@/components/logout-button'

export default async function SidebarLayout({
    children,
  }: Readonly<{
    children: React.ReactNode
  }>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <DynamicBreadcrumb />
          <div className="flex items-center justify-end flex-1 gap-2">
            <AnimatedThemeToggler />
            <LogoutButton />
          </div>
        </header>
        <main className="w-full px-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
