import type { Metadata } from "next";
// import config from "@/config/config.json";

const defaultmeta = {
    meta_title: "Blackmud Item Database",
    meta_description: "Item database for BlackMUD players: Explore player-submitted weapons, armor, and gear - compare stats & check drop history contributed by the community!",
    meta_image: `${process.env.NEXT_PUBLIC_BASE_URL}/bm-itemdb-ogimage.jpg`,
}


const  base_url  = process.env.NEXT_PUBLIC_BASE_URL;
const { meta_image, meta_description, meta_title } = defaultmeta;

export const SITE_URL = base_url?.replace(/\/$/, "");

export function toAbsoluteUrl(path: string): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${SITE_URL}${normalizedPath}`;
}

export function buildAlternates(path: string): NonNullable<Metadata["alternates"]> {
    const absoluteUrl = toAbsoluteUrl(path);
    return {
        canonical: absoluteUrl,
        languages: {
            "en-US": absoluteUrl,
            "x-default": absoluteUrl,
        },
    };
}

type BuildPageMetadataInput = {
    title?: string;
    description?: string;
    image?: string;
    path: string;
    noindex?: boolean;
    nofollow?: boolean;
};

export function buildPageMetadata({
    title,
    description,
    image,
    path,
    noindex = false,
    nofollow = false,
}: BuildPageMetadataInput): Metadata {
    const absoluteUrl = toAbsoluteUrl(path);
    const resolvedTitle = title || meta_title;
    const resolvedDescription = description || meta_description;
    const resolvedImage = image?.startsWith("http")
        ? image
        : toAbsoluteUrl(image || meta_image);

    // we no longer use markdown in meta data so we should be ok here to not use this.
    //title = plainify(resolvedTitle);

    return {
        metadataBase: new URL(SITE_URL || "https://bm-itemdb.gitago.dev"),

        title: {
            default: resolvedTitle,
            template: "%s | Blackmud ItemDB",
        },
        description: resolvedDescription,
        icons: {
            icon: `${SITE_URL}/bm-logo.png`,
            apple: `${SITE_URL}/bm-logo.png`,
        },

        keywords: [
            "BlackMUD",
            "MUD",
            "multi-user dungeon",
            "item database",
            "equipment reference",
            "Silly MUD",
            "DikuMUD",
            "Diku",
            "text RPG",
            "text-based RPG",
            "online RPG",
            "MUD game",
            "longest running MUD",
            "classic MUD",
            "MUD community",
            "weapons database",
            "armor database",
            "RPG items",
            "text game"
        ],

        // Authors Section
        authors: [{ name: "BlackMUD Community" }],
        creator: "GitProductions",
        publisher: "GitProductions",


        openGraph: {
            type: "website",
            locale: "en_US",
            url: absoluteUrl,
            siteName: "Blackmud ItemDB",
            title: resolvedTitle,
            description: resolvedDescription,
            images: [resolvedImage],
        },

        twitter: {
            card: "summary_large_image",
            // creator: "@gitago_",
            // site: "@gitago_",
            title: resolvedTitle,
            description: resolvedDescription,
            images: [resolvedImage],
        },


        alternates: buildAlternates(path),

        robots: {
            index: noindex ? false : true,
            noarchive: noindex ? true : false,
            nosnippet: noindex ? true : false,

            follow: nofollow ? false : true,
            googleBot: {
                index: noindex ? false : true,
                follow: nofollow ? false : true,
                "max-image-preview": "large",
                "max-snippet": -1,
            },
        },
        };
    }






// ---- OLD BASE META DATA FOR REFERENCE

// export const metadata: Metadata = {
//   title: {
//     default: "Blackmud Item Database",
//     template: "%s | Blackmud Item Database",
//   },
//   icons: {
//     icon: "/bm-logo.png",
//     apple: "/bm-logo.png",
//   },

//   description:
//     "Community-driven item database for BlackMUD players: Explore player-submitted weapons, armor, and gear - compare stats & check drop history contributed by the community!",

//   keywords: [
//     "BlackMUD",
//     "MUD",
//     "multi-user dungeon",
//     "item database",
//     "equipment reference",
//     "Silly MUD",
//     "DikuMUD",
//     "Diku",
//     "text RPG",
//     "text-based RPG",
//     "online RPG",
//     "MUD game",
//     "longest running MUD",
//     "classic MUD",
//     "MUD community",
//     "weapons database",
//     "armor database",
//     "RPG items",
//   ], 

//   authors: [{ name: "BlackMUD Community" }],
//   creator: "GitProductions",
//   publisher: "GitProductions",
  
//   openGraph: {
//     title: "Blackmud Item Database",
//     description:
//       "A community-built item reference for BlackMUD. Browse weapons, armor, and gear - compare stats, explore drop history, and stay tuned for an equipment planner coming soon.",
//     type: "website",
//     locale: "en_US",
//     url: process.env.NEXT_PUBLIC_BASE_URL || "https://bm-itemdb.gitago.dev",
//     siteName: "Blackmud Item Database",
//     images: [
//       {
//         url: `${process.env.NEXT_PUBLIC_BASE_URL}/bm-itemdb-ogimage.jpg`,
//         width: 1200,
//         height: 630,
//         alt: "Blackmud Item Database - Browse items, compare stats, and calculate equipment for BlackMUD",
//       },
//     ],
//   },

//   twitter: {
//     card: "summary_large_image",
//     title: "Blackmud Item Database",
//     description:
//       "Community-driven item database for BlackMUD players: Explore player-submitted weapons, armor, and gear - compare stats & check drop history contributed by the community!",
//     images: [
//       {
//         url: `${process.env.NEXT_PUBLIC_BASE_URL}/bm-itemdb-ogimage.jpg`,
//         alt: "Blackmud Item Database - Browse items, compare stats, and calculate equipment for BlackMUD",
//       },
//     ],
//   },

//   alternates: {
//     canonical: `${process.env.NEXT_PUBLIC_BASE_URL}`,
//   },

//   robots: {
//     index: true,
//     follow: true,
//     googleBot: {
//       index: true,
//       follow: true,
//       "max-image-preview": "large",
//       "max-snippet": -1,
//     },
//   },

//   metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://bm-itemdb.gitago.dev"),
// };