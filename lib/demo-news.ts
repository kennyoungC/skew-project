import type { Framing } from "@/components/bias-meter";

export type DemoArticle = {
  id: string;
  source: string;
  category: string;
  title: string;
  summary: string;
  image: string;
  published: string;
  readTime: string;
  framing: Framing;
};

export const categories = [
  "Top stories",
  "World",
  "Politics",
  "Business & Markets",
  "Technology",
  "Climate",
  "Culture",
];

export const featuredArticle: DemoArticle = {
  id: "global-summit",
  source: "The Global Journal",
  category: "World",
  title: "Global leaders meet as a new round of trade talks begins",
  summary:
    "Negotiators are seeking common ground on tariffs, technology safeguards, and a framework designed to steady international markets.",
  image:
    "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1600&q=85",
  published: "1h ago",
  readTime: "8 min",
  framing: { left: 22, center: 56, right: 22 },
};

export const latestArticles: DemoArticle[] = [
  {
    id: "energy-grid",
    source: "Metro Report",
    category: "Climate",
    title: "Cities rethink their energy grids after a summer of record demand",
    summary:
      "Local governments are weighing storage, pricing, and reliability as electricity use rises.",
    image:
      "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1000&q=80",
    published: "2h ago",
    readTime: "6 min",
    framing: { left: 38, center: 47, right: 15 },
  },
  {
    id: "ai-workplace",
    source: "Current",
    category: "Technology",
    title: "The next phase of workplace AI is less visible—and more consequential",
    summary:
      "New tools are moving from chat windows into the systems that coordinate everyday work.",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80",
    published: "3h ago",
    readTime: "7 min",
    framing: { left: 19, center: 63, right: 18 },
  },
  {
    id: "housing-policy",
    source: "The Ledger",
    category: "Politics",
    title: "A housing proposal brings unlikely allies to the same table",
    summary:
      "The plan pairs faster permitting with tenant protections, creating a coalition with competing priorities.",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80",
    published: "4h ago",
    readTime: "9 min",
    framing: { left: 31, center: 42, right: 27 },
  },
  {
    id: "markets-rates",
    source: "Market Daily",
    category: "Business",
    title: "Markets steady as investors weigh a slower path for interest rates",
    summary:
      "Bond yields eased while major indexes held near recent highs ahead of new inflation data.",
    image:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1000&q=80",
    published: "5h ago",
    readTime: "5 min",
    framing: { left: 14, center: 67, right: 19 },
  },
  {
    id: "coastal-science",
    source: "Field Notes",
    category: "Science",
    title: "Coastal researchers turn to old maps to understand a changing shoreline",
    summary:
      "A century of records is helping scientists distinguish natural shifts from accelerating climate effects.",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80",
    published: "6h ago",
    readTime: "10 min",
    framing: { left: 34, center: 54, right: 12 },
  },
  {
    id: "public-transit",
    source: "Civic Press",
    category: "United States",
    title: "Transit agencies test a simpler fare model to win back daily riders",
    summary:
      "Several cities are experimenting with automatic discounts and weekly caps instead of prepaid passes.",
    image:
      "https://images.unsplash.com/photo-1494522358652-f30e61a60313?auto=format&fit=crop&w=1000&q=80",
    published: "7h ago",
    readTime: "6 min",
    framing: { left: 27, center: 52, right: 21 },
  },
];
