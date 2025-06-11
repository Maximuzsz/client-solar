import * as React from "react"
import { Link } from "wouter"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbProps extends React.HTMLAttributes<HTMLDivElement> {
  segments: { name: string; href: string; current?: boolean }[]
  homeHref?: string
  showHome?: boolean
}

export function Breadcrumb({
  segments,
  homeHref = "/",
  showHome = true,
  className,
  ...props
}: BreadcrumbProps) {
  return (
    <nav className={cn("flex", className)} aria-label="Breadcrumb" {...props}>
      <ol className="flex flex-wrap items-center space-x-2 text-sm text-muted-foreground">
        {showHome && (
          <li className="flex items-center">
            <Link href={homeHref} className="flex items-center hover:text-foreground">
              <Home className="mr-1 h-4 w-4" />
              <span className="sr-only">Home</span>
            </Link>
            <ChevronRight className="ml-2 h-4 w-4 text-muted-foreground" />
          </li>
        )}
        
        {segments.map((segment, index) => (
          <li key={segment.href} className="flex items-center">
            <Link
              href={segment.href}
              className={cn(
                "hover:text-foreground transition-colors",
                segment.current && "font-medium text-foreground"
              )}
              aria-current={segment.current ? "page" : undefined}
            >
              {segment.name}
            </Link>
            {index < segments.length - 1 && (
              <ChevronRight className="ml-2 h-4 w-4 text-muted-foreground" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}