import type { Metadata } from "next";
import { SITE_URL } from "./constants";

export interface BuildMetadataOptions {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
}

/**
 * Builds standardized metadata for pages.
 * Includes title, description, canonical URL, Open Graph, and Twitter Card tags.
 */
export function buildMetadata({
  title,
  description,
  path = "/",
  noIndex = false,
}: BuildMetadataOptions): Metadata {
  const canonical = `${SITE_URL}${path === "/" ? "" : path}`;
  const ogImage = `${SITE_URL}/og/default.png`;

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Ghost Allocator",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}



