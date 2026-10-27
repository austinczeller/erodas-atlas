import { getCollection, type CollectionEntry } from "astro:content";

export const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export type Place = CollectionEntry<"places">;

export const placeUrl = (id: string) => `${base}/places/${id}/`;
export const godUrl = (id: string) => `${base}/gods/${id}/`;
export const historyUrl = (id: string) => `${base}/history/${id}/`;

const byOrder = <T extends { data: { order: number; title: string } }>(a: T, b: T) =>
  a.data.order - b.data.order || a.data.title.localeCompare(b.data.title);

export async function getPlaces() {
  return (await getCollection("places")).sort(byOrder);
}

export async function getGods() {
  return (await getCollection("gods")).sort(byOrder);
}

export async function getHistory() {
  return (await getCollection("history")).sort(byOrder);
}

// Every map pin, for places that have a position on the Korlornium map.
export function mapPins(places: Place[]) {
  return places
    .filter((p) => p.data.map)
    .map((p) => ({ title: p.data.title, href: placeUrl(p.id), x: p.data.map!.x, y: p.data.map!.y }));
}

export const figureUrl = (id: string) => `${base}/figures/${id}/`;
export const skyUrl = (id: string) => `${base}/sky/${id}/`;

export async function getFigures() {
  return (await getCollection("figures")).sort(byOrder);
}

export async function getSky() {
  return (await getCollection("sky")).sort(byOrder);
}
