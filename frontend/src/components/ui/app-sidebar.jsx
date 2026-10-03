"use client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { useUnseenIdeasCount } from "@/api/hooks/useAdminIdeas"

import { ROLES, useAuth } from "@/api/context/AuthContext"
import { useToast } from "@/helpers/ToastProvider"
import { LOGGED_OUT_MSG } from "@/helpers/Errors"
import { HugeiconsIcon } from "@hugeicons/react"
import { Logout01Icon } from "@hugeicons/core-free-icons"
import { useProposal } from "@/api/context/ProposalContext"

const items = [
  { title: "Mapa problemów", url: "/" },
  { title: "Biblioteka innowacji", url: "/innovations" },
  { title: "Zaproponuj innowację", action: "proposal" },
  { title: "Moje propozycje", url: "/my-ideas" },
  { title: "Baza wiedzy", url: "/knowledge" },
]

const institutionItems = [
  { title: "Zgłoszone problemy", url: "/reported-problems" },
  { title: "Zgłoszone innowacje", url: "/reported-innovations", badge: "unseenIdeas" },
  { title: "Nabory grantowe", url: "/grant-calls" },
]

export function AppSidebar() {
  const pathname = usePathname();
  const { isLogged, user, roleLabel, openPanel, logout, hasRole } = useAuth()
  const { showToast } = useToast()
  const { openProposal } = useProposal()
  const isInstitution = hasRole(ROLES.JST, ROLES.ROPS)
  const { data: unseenIdeas } = useUnseenIdeasCount(isInstitution)

  const isActive = (url) => (url === "/" ? pathname === "/" : pathname.startsWith(url))

  const handleLogout = async () => {
    await logout()
    showToast(LOGGED_OUT_MSG, "info")
  }

  return (
    <Sidebar>
      <SidebarHeader className="font-semibold px-4">
        <Link href="/" className="rounded-sm">Małopolska HUBMI</Link>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Menu główne">
        <SidebarGroup>
          <SidebarGroupLabel>Nawigacja</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.action === "proposal" ? (
                    <SidebarMenuButton className="cursor-pointer" onClick={() => openProposal()}>
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      // sub-pages (e.g. /innovations/bawita) keep their section highlighted
                      isActive={isActive(item.url)}
                      aria-current={isActive(item.url) ? "page" : undefined}
                    >
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isInstitution && (
          <SidebarGroup>
            <SidebarGroupLabel>Panel {roleLabel}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {institutionItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      isActive={isActive(item.url)}
                      aria-current={isActive(item.url) ? "page" : undefined}
                    >
                      <span>{item.title}</span>
                      {item.badge === "unseenIdeas" && unseenIdeas > 0 && (
                        <span className="sr-only">, nowe: {unseenIdeas}</span>
                      )}
                    </SidebarMenuButton>
                    {item.badge === "unseenIdeas" && unseenIdeas > 0 && (
                      <SidebarMenuBadge aria-hidden="true" className="bg-emerald-700 text-white peer-hover/menu-button:text-white peer-data-active/menu-button:text-white">
                        {unseenIdeas}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {isLogged ? (
              <div className="flex items-center gap-1">
                <div className="flex min-w-0 flex-1 items-center gap-2 p-2">
                  <Avatar className="size-8 rounded-lg" aria-hidden="true">
                    <AvatarFallback className="rounded-lg">{user.name?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 text-left text-sm leading-tight">
                    <span className="sr-only">Zalogowano jako </span>
                    <span className="font-medium break-words">{user.name}</span>
                    <span className="text-xs text-muted-foreground break-all">{roleLabel} · {user.email}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" className="cursor-pointer" onClick={handleLogout} aria-label="Wyloguj" title="Wyloguj">
                  <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} aria-hidden="true" />
                </Button>
              </div>
            ):(
              <SidebarMenuButton size="lg" className={"cursor-pointer"} onClick={() => openPanel("login")} tooltip="Zaloguj się">
                <div aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true" className="size-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Zaloguj się</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">lub utwórz konto</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true" className="ml-auto size-6 text-sidebar-foreground/70">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
                </svg>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}