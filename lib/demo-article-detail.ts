import type { Framing } from "@/components/bias-meter";

export type SourceItem = {
  name: string;
  label: "Left" | "Center" | "Right";
};

export type RelatedStory = {
  id: string;
  category: string;
  region: string;
  title: string;
  date: string;
  readTime: string;
  image: string;
};

export type DemoArticleDetail = {
  id: string;
  category: string;
  region: string;
  title: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  caption: string;
  credit: string;
  framing: Framing;
  sourceCount: number;
  paragraphs: string[];
  summary: string[];
  sources: SourceItem[];
  related: RelatedStory[];
};

const relatedImages = [
  "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=500&q=80",
];

export const demoArticleDetail: DemoArticleDetail = {
  id: "global-summit",
  category: "Politics",
  region: "United States",
  title: "Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report",
  author: "David Morgan",
  date: "May 31, 2026",
  readTime: "12 min",
  image:
    "https://images.unsplash.com/photo-1569285645462-a3f9c6332d56?auto=format&fit=crop&w=1600&q=85",
  caption:
    "President Donald Trump in the Cabinet Room at the White House, Washington, D.C., May 30, 2026.",
  credit: "Andrew Harnik/Getty Images",
  framing: { left: 20, center: 31, right: 49 },
  sourceCount: 12,
  paragraphs: [
    "The Trump administration has sent Iran a revised nuclear deal proposal that includes tougher terms on uranium enrichment and stronger verification measures, according to a report published Saturday.",
    "The new proposal, delivered through intermediaries in Oman, requires Iran to halt all uranium enrichment on its soil and ship its stockpile of enriched uranium out of the country. It also demands unrestricted access for international inspectors to all Iranian nuclear facilities, including military sites.",
    "“This is a take-it-or-leave-it proposal,” a senior administration official told The Wall Street Journal. “The President wants a deal, but he will not accept a weak agreement that puts America or our allies at risk.”",
    "Iran has not yet officially responded to the proposal. However, Iranian Foreign Minister Hossein Amir-Abdollahian said last week that any deal must respect Iran's right to peaceful nuclear energy and include the lifting of all U.S. sanctions.",
    "The revised proposal comes after several rounds of indirect talks between U.S. and Iranian officials failed to produce a breakthrough. The administration has warned that if diplomacy fails, it is prepared to take other action to prevent Iran from obtaining a nuclear weapon.",
    "European allies have urged both sides to continue negotiations. “We believe diplomacy is still the best path forward,” said a spokesperson for the EU’s foreign policy chief.",
    "Israel, which has long opposed the 2015 nuclear deal with Iran, praised the administration’s tougher stance. Prime Minister Benjamin Netanyahu called it a statement of resolve.",
    "The fate of the proposal now rests with Iran, as global attention remains focused on whether a new nuclear agreement can be reached—or if tensions will escalate further.",
  ],
  summary: [
    "The administration has sent Iran a revised nuclear proposal with tougher terms, including a complete halt to uranium enrichment and removal of enriched stockpiles.",
    "The proposal demands unrestricted inspector access to nuclear sites, including military facilities.",
    "Iran has not responded officially and says any deal must protect peaceful nuclear energy rights and include sanctions relief.",
    "The U.S. says it is prepared to take other action if diplomacy fails, while European allies urge continued negotiations.",
    "Israel supports the tougher stance and calls it a deterrent against acquiring nuclear weapons.",
  ],
  sources: [
    { name: "Fox News", label: "Right" },
    { name: "The Wall Street Journal", label: "Center" },
    { name: "Reuters", label: "Center" },
    { name: "BBC", label: "Center" },
    { name: "CNN", label: "Left" },
    { name: "The New York Times", label: "Center" },
    { name: "The Washington Post", label: "Center" },
    { name: "Newsmax", label: "Right" },
  ],
  related: [
    ["iran-negotiation", "World", "Middle East", "Iran Says It Will Not Negotiate Under ‘Maximum Pressure’"],
    ["diplomacy-iran", "Politics", "United States", "Bipartisan Group Urges Diplomacy With Iran"],
    ["sanctions", "Politics", "United States", "US Sanctions More Iranian Entities Over Nuclear Program"],
    ["nuclear-deal", "Science", "Nuclear Policy", "What’s in the 2015 Iran Nuclear Deal?"],
    ["oman-talks", "World", "Middle East", "Oman Hosts Another Round of US-Iran Nuclear Talks"],
    ["israel-red-line", "World", "Middle East", "Israel Reaffirms Red Line Over Iranian Nuclear Program"],
  ].map(([id, category, region, title], index) => ({
    id,
    category,
    region,
    title,
    date: `May ${29 - index}, 2026`,
    readTime: `${5 + index} min`,
    image: relatedImages[index],
  })),
};

export function getDemoArticleDetail(id: string) {
  return id === demoArticleDetail.id ? demoArticleDetail : undefined;
}
