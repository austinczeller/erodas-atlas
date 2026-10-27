// The site navigation. Each entry is one item in the header bar: either a
// plain link, or a dropdown made of labelled groups of links. Most groups are
// filled from the content collections, so a new page appears in the menu as
// soon as its Markdown file exists.
import { getCollection } from "astro:content";
import { base } from "./content";

export interface NavLink {
  label: string;
  href: string;
}
export interface NavGroup {
  heading: string;
  links: NavLink[];
}
export interface NavMenu {
  id: string;
  label: string;
  // Where the menu's own "see everything" link goes.
  href: string;
  overview?: string;
  groups?: NavGroup[];
}

const byOrder = <T extends { data: { order: number; title: string } }>(a: T, b: T) =>
  a.data.order - b.data.order || a.data.title.localeCompare(b.data.title);

export async function getNav(): Promise<NavMenu[]> {
  const places = (await getCollection("places")).sort(byOrder);
  const figures = (await getCollection("figures")).sort(byOrder);
  const gods = (await getCollection("gods")).sort(byOrder);
  const history = (await getCollection("history")).sort(byOrder);
  const sky = (await getCollection("sky")).sort(byOrder);

  const link = (collection: string) => (e: { id: string; data: { title: string } }) => ({
    label: e.data.title,
    href: `${base}/${collection}/${e.id}/`,
  });
  const placesOf = (...kinds: string[]) => places.filter((p) => kinds.includes(p.data.kind)).map(link("places"));

  return [
    {
      id: "places",
      label: "Places",
      href: `${base}/places/`,
      overview: "The map and gazetteer",
      groups: [
        { heading: "Erodas and its continents", links: placesOf("World", "Continent") },
        { heading: "Regions of Korlornium", links: placesOf("Region") },
        { heading: "Cities, towns and isles", links: placesOf("City", "Town", "Island") },
        { heading: "Wild places", links: placesOf("Landmark") },
      ],
    },
    {
      id: "figures",
      label: "Notable Figures",
      href: `${base}/figures/`,
      overview: "All notable figures",
      groups: ["Figures of history", "Rulers and leaders", "Captains of the Scar"].map((heading) => ({
        heading,
        links: figures.filter((f) => f.data.group === heading).map(link("figures")),
      })),
    },
    {
      id: "gods",
      label: "Gods",
      href: `${base}/gods/`,
      overview: "The pantheon",
      groups: ["The Three Sisters", "The Major Powers", "Lesser Powers"].map((heading) => ({
        heading,
        links: gods.filter((g) => g.data.group === heading).map(link("gods")),
      })),
    },
    {
      id: "history",
      label: "History",
      href: `${base}/history/`,
      overview: "The full timeline",
      groups: [
        { heading: "Timeline", links: history.filter((h) => h.data.kind !== "Observance").map(link("history")) },
        { heading: "Holidays and observances", links: history.filter((h) => h.data.kind === "Observance").map(link("history")) },
      ],
    },
    {
      id: "sky",
      label: "Calendar and Sky",
      href: `${base}/sky/`,
      overview: "The skies of Erodas",
      groups: [
        { heading: "Calendar", links: [{ label: "The Erodian Standard Calendar", href: `${base}/calendar/` }] },
        { heading: "Celestial bodies", links: sky.map(link("sky")) },
      ],
    },
    {
      id: "next-adventure",
      label: "Next Adventure",
      href: `${base}/next-adventure/`,
      overview: "The next campaign",
      groups: [
        {
          heading: "Dithoria City",
          links: [
            { label: "Character creation", href: `${base}/next-adventure/` },
            { label: "Inspiration board", href: `${base}/inspiration/` },
          ],
        },
      ],
    },
  ].map((menu) => ({ ...menu, groups: menu.groups?.filter((g) => g.links.length > 0) }));
}
