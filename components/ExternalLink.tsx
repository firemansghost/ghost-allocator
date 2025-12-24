import Link from "next/link";
import type { ComponentProps } from "react";

interface ExternalLinkProps extends Omit<ComponentProps<typeof Link>, "target" | "rel"> {
  href: string;
  "aria-label"?: string;
}

/**
 * External link component that enforces security best practices.
 * Forces target="_blank" and rel="noopener noreferrer" for all external links.
 */
export function ExternalLink({
  href,
  children,
  className,
  "aria-label": ariaLabel,
  ...props
}: ExternalLinkProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </Link>
  );
}







