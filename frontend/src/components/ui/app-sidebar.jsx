"use client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

import { ROLES, useAuth } from "@/api/context/AuthContext"
import { useToast } from "@/helpers/ToastProvider"
import { LOGGED_OUT_MSG } from "@/helpers/Errors"
import { HugeiconsIcon } from "@hugeicons/react"
import { Logout01Icon } from "@hugeicons/core-free-icons"
import { useProposal } from "@/api/context/ProposalContext"

const items = [
  { title: "Mapa problemow", url: "/" },
  { title: "Innowacje", url: "/innovations" },
  { title: "Zaproponuj innowacje", action: "proposal" },
]

const institutionItems = [
  { title: "Zgłoszone problemy", url: "/reported-problems" },
  { title: "Zgłoszone innowacje", url: "/reported-innovations" },
]

export function AppSidebar() {
  const pathname = usePathname();
  const { isLogged, user, roleLabel, openPanel, logout, hasRole } = useAuth()
  const { showToast } = useToast()
  const { openProposal } = useProposal()

  const handleLogout = async () => {
    await logout()
    showToast(LOGGED_OUT_MSG, "info")
  }

  return (
    <Sidebar>
      <SidebarHeader className="font-semibold px-4">Malopolska HUBMI</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>H2 TITLE CONTENT</SidebarGroupLabel>
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
                      isActive={item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)}
                    >
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {hasRole(ROLES.JST, ROLES.ROPS) && (
          <SidebarGroup>
            <SidebarGroupLabel>Panel {roleLabel}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {institutionItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton render={<Link href={item.url} />} isActive={pathname.startsWith(item.url)}>
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {isLogged ? (
              <div className="flex items-center gap-1">
                <SidebarMenuButton size="lg" className="flex-1">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">{user.name?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="grid text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{roleLabel} · {user.email}</span>
                  </div>
                </SidebarMenuButton>
                <Button variant="ghost" size="icon-sm" className="cursor-pointer" onClick={handleLogout} aria-label="Wyloguj" title="Wyloguj">
                  <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
                </Button>
              </div>
            ):(
              <SidebarMenuButton size="lg" className={"cursor-pointer"} onClick={() => openPanel("login")} tooltip="Zaloguj się">
                <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
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