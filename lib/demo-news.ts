import type { Framing } from "@/components/bias-meter";

export type DemoArticle = {
  id: string;
  source: string;
  sourceCount: number;
  category: string;
  region: string;
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
  sourceCount: 12,
  category: "World",
  region: "Global",
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
    sourceCount: 12,
    category: "Climate",
    region: "United States",
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
    sourceCount: 7,
    category: "Technology",
    region: "United States",
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
    sourceCount: 8,
    category: "Politics",
    region: "United States",
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
    sourceCount: 11,
    category: "Business",
    region: "Global",
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
    sourceCount: 14,
    category: "Science",
    region: "Global",
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
    sourceCount: 9,
    category: "United States",
    region: "United States",
    title: "Transit agencies test a simpler fare model to win back daily riders",
    summary:
      "Several cities are experimenting with automatic discounts and weekly caps instead of prepaid passes.",
    image:
      "https://images.unsplash.com/photo-1494522358652-f30e61a60313?auto=format&fit=crop&w=1000&q=80",
    published: "7h ago",
    readTime: "6 min",
    framing: { left: 27, center: 52, right: 21 },
  },
  {
    id: "nicaragua-rivera",
    source: "World Desk",
    sourceCount: 63,
    category: "World",
    region: "Nicaragua",
    title:
      "Indigenous Leader Brooklyn Rivera Dies in Nicaragua After Nearly 3 Years of Detention",
    summary:
      "The longtime Indigenous leader had been detained amid a widening political crackdown.",
    image:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1000&q=80",
    published: "8h ago",
    readTime: "7 min",
    framing: { left: 54, center: 28, right: 18 },
  },
  {
    id: "un-security-council",
    source: "World Desk",
    sourceCount: 15,
    category: "World",
    region: "Middle East",
    title:
      "UN Security Council to Hold Emergency Meeting as Israel Pushes Deeper into Lebanon",
    summary:
      "Diplomats are gathering for an emergency session as regional tensions intensify.",
    image:
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1000&q=80",
    published: "9h ago",
    readTime: "8 min",
    framing: { left: 22, center: 33, right: 45 },
  },
  {
    id: "starship-flight",
    source: "Orbit",
    sourceCount: 9,
    category: "Technology",
    region: "United States",
    title: "SpaceX Launches Starship Test Flight in Milestone for Mars Program",
    summary:
      "The latest launch tested upgrades intended to improve reusability and mission range.",
    image:
      "https://images.unsplash.com/photo-1517976547714-720226b864c1?auto=format&fit=crop&w=1000&q=80",
    published: "10h ago",
    readTime: "5 min",
    framing: { left: 12, center: 45, right: 43 },
  },
  {
    id: "apple-ai",
    source: "Current",
    sourceCount: 10,
    category: "Business",
    region: "United States",
    title: "Apple Unveils AI-Powered Features Across iPhone, iPad and Mac",
    summary:
      "The company introduced new intelligence features spanning its major devices.",
    image:
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1000&q=80",
    published: "11h ago",
    readTime: "6 min",
    framing: { left: 15, center: 40, right: 45 },
  },
  {
    id: "real-madrid-final",
    source: "Matchday",
    sourceCount: 26,
    category: "Soccer",
    region: "Europe",
    title: "Real Madrid Win Champions League After Comeback Victory in Final",
    summary:
      "A dramatic second-half turnaround secured another European title for Madrid.",
    image:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1000&q=80",
    published: "12h ago",
    readTime: "4 min",
    framing: { left: 10, center: 20, right: 70 },
  },
  {
    id: "western-wildfires",
    source: "Field Notes",
    sourceCount: 17,
    category: "Environment",
    region: "Canada",
    title: "Wildfires Force Thousands to Evacuate Across Western Canada",
    summary:
      "Emergency crews are responding as dry conditions fuel fast-moving fires.",
    image:
      "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1000&q=80",
    published: "13h ago",
    readTime: "6 min",
    framing: { left: 27, center: 33, right: 40 },
  },
];
