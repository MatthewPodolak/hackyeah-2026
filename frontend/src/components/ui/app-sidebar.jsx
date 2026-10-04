"use client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { useUnseenIdeasCount } from "@/api/hooks/useAdminIdeas"
import { useUnseenProblems } from "@/api/hooks/useAdmin"
import { useGminaWaiting } from "@/api/hooks/useProblemsQuery"
import AccessibilityControls from "@/components/accessibility-controls"

import { ROLES, useAuth } from "@/api/context/AuthContext"
import { useToast } from "@/helpers/ToastProvider"
import { LOGGED_OUT_MSG } from "@/helpers/Errors"
import { HugeiconsIcon } from "@hugeicons/react"
import { AlertDiamondIcon, Analytics01Icon, BookOpen01Icon, BulbIcon, Chatting01Icon, Coins01Icon, Database01Icon, HandshakeIcon, Idea01Icon, InboxIcon, LibraryIcon, Logout01Icon, MapsIcon, Megaphone01Icon, Route01Icon, TestTube01Icon, UserCheck01Icon } from "@hugeicons/core-free-icons"
import { useProposal } from "@/api/context/ProposalContext"

const publicItems = [
  { title: "Mapa problemów", icon: MapsIcon, url: "/" },
  { title: "Biblioteka innowacji", icon: LibraryIcon, url: "/innovations" },
  { title: "Zaproponuj innowację", icon: BulbIcon, action: "proposal" },
  { title: "Partnerstwa", icon: HandshakeIcon, url: "/partnerships" },
]

const myItems = [
  { title: "Moje zgłoszenia", icon: Megaphone01Icon, url: "/my-reports" },
  { title: "Moje propozycje", icon: Idea01Icon, url: "/my-ideas" },
  { title: "Wiadomości", icon: Chatting01Icon, url: "/messages", requiresLogin: true },
  { title: "Moje testy", icon: TestTube01Icon, url: "/my-tests", requiresLogin: true, hiddenFor: ROLES.JST },
  { title: "Plan wdrożenia innowacji", icon: Route01Icon, url: "/implementation-plan", requiresLogin: true },
]

const institutionItems = [
  { title: "Zgłoszone problemy", icon: AlertDiamondIcon, url: "/reported-problems", badge: "unseenProblems", badgeLabel: "nowe" },
  { title: "Zgłoszone innowacje", icon: InboxIcon, url: "/reported-innovations", badge: "unseenIdeas", badgeLabel: "nowe" },
  { title: "Trendy i potrzeby", icon: Analytics01Icon, url: "/trends" },
  { title: "Nabory grantowe", icon: Coins01Icon, url: "/grant-calls" },
]

const ropsItems = [
  { title: "Zgłoszenia do testów", icon: UserCheck01Icon, url: "/test-participations" },
  { title: "Katalog wiedzy", icon: Database01Icon, url: "/admin/catalog" },
]

function NavGroup({ label, items, isActive, badges = {}, onAction }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const count = item.badge ? badges[item.badge] : 0
            return (
              <SidebarMenuItem key={item.title}>
                {item.action ? (
                  <SidebarMenuButton className="cursor-pointer" onClick={() => onAction?.(item.action)}>
                    {item.icon && <HugeiconsIcon icon={item.icon} strokeWidth={1.8} aria-hidden="true" />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton
                    render={<Link href={item.url} />}
                    isActive={isActive(item.url)}
                    aria-current={isActive(item.url) ? "page" : undefined}
                  >
                    {item.icon && <HugeiconsIcon icon={item.icon} strokeWidth={1.8} aria-hidden="true" />}
                    <span>{item.title}</span>
                    {count > 0 && <span className="sr-only">, {item.badgeLabel}: {count}</span>}
                  </SidebarMenuButton>
                )}
                {count > 0 && (
                  <SidebarMenuBadge aria-hidden="true" className="bg-emerald-700 text-white peer-hover/menu-button:text-white peer-data-active/menu-button:text-white">
                    {count}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const pathname = usePathname();
  const { isLogged, user, role, roleLabel, openPanel, logout, hasRole, isPendingInstitution } = useAuth()
  const { showToast } = useToast()
  const { openProposal } = useProposal()
  const isInstitution = hasRole(ROLES.JST, ROLES.ROPS)
  const isRops = hasRole(ROLES.ROPS)
  const { data: unseenIdeas } = useUnseenIdeasCount(isInstitution)
  // ROPS: new reports in its queue; JST: reports of its gmina waiting for its decision
  const { data: unseenByRops } = useUnseenProblems(isRops)
  const { data: waitingForGmina } = useGminaWaiting(hasRole(ROLES.JST))
  const unseenProblems = isRops ? unseenByRops : waitingForGmina

  const isActive = (url) => (url === "/" ? pathname === "/" : pathname.startsWith(url))

  const handleLogout = async () => {
    await logout()
    showToast(LOGGED_OUT_MSG, "info")
  }

  return (
    <Sidebar>
      <SidebarHeader className="px-3 pt-4 pb-2">
        <Link href="/" className="flex items-center gap-3 rounded-xl p-1.5">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-base font-extrabold text-primary-foreground shadow-elevation-1">H</span>
          <span className="grid min-w-0 leading-tight">
            <span className="font-heading text-base font-extrabold tracking-tight">Małopolska HubMI</span>
            <span className="text-xs text-muted-foreground">Hub Innowacji Społecznych</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Menu główne">
          <NavGroup label="Nawigacja" items={publicItems} isActive={isActive} onAction={() => openProposal()} />
          <NavGroup label="Moje sprawy" items={myItems.filter((item) => (!item.requiresLogin || isLogged) && item.hiddenFor !== role)} isActive={isActive} />
          {isInstitution && (
            <NavGroup label={`Panel ${roleLabel}`} items={institutionItems} isActive={isActive} badges={{ unseenIdeas, unseenProblems }} />
          )}
          {isRops && <NavGroup label="Administracja ROPS" items={ropsItems} isActive={isActive} />}
        </nav>
        <SidebarGroup>
          <SidebarGroupLabel>Ułatwienia dostępu</SidebarGroupLabel>
          <SidebarGroupContent>
            <AccessibilityControls />
          </SidebarGroupContent>
        </SidebarGroup>
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
                    {isPendingInstitution && (
                      <span className="mt-1 text-xs font-medium">
                        Konto instytucji jest nieaktywne
                      </span>
                    )}
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