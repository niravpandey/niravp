/**
 * My tech setup, shown on /setup over a single composite image of the desk.
 * `area` is where the item sits in that image, as percentages of its width (x, w) and height (y, h);
 * it's the hover/tap target and the part left undimmed when the item is highlighted.
 */
export type SetupItem = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  area: { x: number; y: number; w: number; h: number };
};

export const SETUP_IMAGE = { src: "/setup/desk-cutout.png", width: 1536, height: 1024 };

export const setupItems: SetupItem[] = [
  {
    id: "philips-tar3306",
    name: "Philips TAR3306",
    description: "Clock radio.",
    tags: ["home"],
    area: { x: 1.6, y: 11.9, w: 44.5, h: 34.8 },
  },
  {
    id: "casio-f91w",
    name: "Casio F-91W",
    description: "The only watch I need.",
    tags: ["daily"],
    area: { x: 48, y: 2.1, w: 14.3, h: 53.3 },
  },
  {
    id: "shokz-openrun",
    name: "Shokz OpenRun",
    description: "Bone conduction headphones. Decent for running.",
    tags: ["audio", "outdoors"],
    area: { x: 63.7, y: 10.5, w: 35, h: 37.8 },
  },
  {
    id: "nothing-ear-a",
    name: "Nothing Ear (a)",
    description: "Good for focus.",
    tags: ["audio", "daily"],
    area: { x: 2.3, y: 57.6, w: 22.3, h: 38.6 },
  },
  {
    id: "tuf-gaming-m4",
    name: "ASUS TUF Gaming M4",
    description: "My hollow mouse lol",
    tags: ["desk", "input"],
    area: { x: 25.3, y: 51.8, w: 13.8, h: 46.9 },
  },
  {
    id: "macbook-pro-m1",
    name: "MacBook Pro M1",
    description: "Where I work on everything.",
    tags: ["work", "daily"],
    area: { x: 39.1, y: 59.1, w: 30.5, h: 38.6 },
  },
  {
    id: "tuf-gaming-k3",
    name: "ASUS TUF Gaming K3",
    description: "Decent keyboard. Pressure could be better.",
    tags: ["desk", "input"],
    area: { x: 68.2, y: 62.5, w: 30.4, h: 30.8 },
  },
];
