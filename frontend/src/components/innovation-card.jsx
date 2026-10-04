import Link from "next/link"
import { cn } from "cn"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getProblemCategory, getWhoCategory } from "@/lib/innovations"

// Video thumbnail when the innovation has one, otherwise the icon of its main problem category
export function InnovationCover({ innovation, className }) {
  if (innovation.thumbnailUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnail, no next/image config needed
      <img
        src={innovation.thumbnailUrl}
        alt=""
        loading="lazy"
        className={cn("aspect-video w-full object-cover", className)}
      />
    )
  }

  const category = getProblemCategory(innovation.problemCategories[0])
  return (
    <div
      aria-hidden="true"
      className={cn("flex aspect-video w-full items-center justify-center bg-muted text-6xl", className)}
    >
      {category?.icon}
    </div>
  )
}

export function InnovationBadges({ innovation, maxWho = Infinity, showProblems = true }) {
  const who = innovation.whoCategories.map(getWhoCategory)
  const problems = showProblems ? innovation.problemCategories.map(getProblemCategory) : []
  const hiddenWho = Math.max(0, who.length - maxWho)

  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Kategorie">
      {who.slice(0, maxWho).map((category) => (
        <li key={category.label}>
          <Badge variant="secondary">
            <span aria-hidden="true">{category.icon}</span> {category.label}
          </Badge>
        </li>
      ))}
      {hiddenWho > 0 && (
        <li>
          <Badge variant="outline">+{hiddenWho}</Badge>
        </li>
      )}
      {problems.map((category) => (
        <li key={category.label}>
          <Badge variant="outline">
            <span aria-hidden="true">{category.icon}</span> {category.label}
          </Badge>
        </li>
      ))}
    </ul>
  )
}

export function InnovationCard({ innovation }) {
  return (
    <Card className="relative h-full pt-0 transition-shadow hover:shadow-elevation-2 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50">
      <InnovationCover innovation={innovation} />
      <CardHeader>
        <CardTitle>
          <h3 className="text-base font-semibold">
            {/* stretched link: makes the whole card clickable with a single tab stop */}
            <Link href={`/innovations/${innovation.id}`} className="outline-none after:absolute after:inset-0">
              {innovation.name}
            </Link>
          </h3>
        </CardTitle>
        <CardDescription className="line-clamp-3">
          {innovation.shortDescription || innovation.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <InnovationBadges innovation={innovation} maxWho={2} showProblems={false} />
      </CardContent>
      <CardFooter>
        <span aria-hidden="true" className="flex items-center gap-1 text-sm font-medium text-primary">
          Szczegóły <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
        </span>
      </CardFooter>
    </Card>
  )
}
