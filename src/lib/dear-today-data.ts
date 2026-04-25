export type View = "home" | "write" | "my-posts" | "account";

export type Profile =
  | {
      mode: "guest";
      name: string;
    }
  | {
      mode: "member";
      id: string;
      name: string;
      provider: "google";
      avatarUrl?: string | null;
      displayNameChangedAt?: string | null;
      nextDisplayNameChangeAt?: string | null;
    };

export type Post = {
  id: string;
  body: string;
  author: string;
  createdAt: string;
  hearts: number;
  visibility?: "public" | "hidden";
  ownerId?: string;
  guestPassword?: string;
};

export const MAX_POST_LENGTH = 1000;
export const MIN_AUTHOR_LENGTH = 2;
export const MAX_AUTHOR_LENGTH = 20;

export const gentlePrompts = [
  "What felt quietly kind today?",
  "Which small moment made the day softer?",
  "Who or what held you up, even briefly?",
];

export const defaultProfile: Profile = {
  mode: "guest",
  name: "Quiet guest",
};

export const seedPosts: Post[] = [
  {
    id: "seed-1",
    author: "Mina",
    body:
      "Today my subway arrived just as I stepped onto the platform.\n\nIt felt small, but I realized how much relief lives inside ordinary timing.",
    createdAt: "2026-04-24T20:05:00.000Z",
    hearts: 24,
  },
  {
    id: "seed-2",
    author: "Jae",
    body:
      "A coworker left fruit on my desk after a long meeting.\nNo note, no explanation. Just care in a quiet shape.",
    createdAt: "2026-04-24T18:20:00.000Z",
    hearts: 31,
  },
  {
    id: "seed-3",
    author: "Sora",
    body:
      "The sky looked silver after rain, and for a minute the whole walk home felt newly washed.\n\nI am grateful for evenings that reset me without asking anything back.",
    createdAt: "2026-04-24T16:45:00.000Z",
    hearts: 19,
  },
  {
    id: "seed-4",
    author: "Noah",
    body:
      "My mother still texts me to eat warm food when I sound tired.\nI used to brush it off, but tonight it felt like a blanket.",
    createdAt: "2026-04-24T14:10:00.000Z",
    hearts: 27,
  },
  {
    id: "seed-5",
    author: "Ari",
    body:
      "A stranger held the cafe door while I balanced too many things.\nI smiled the whole walk after that.",
    createdAt: "2026-04-24T11:50:00.000Z",
    hearts: 13,
  },
  {
    id: "seed-6",
    author: "Hana",
    body:
      "Today I am grateful that I had the energy to answer one difficult message.\nNot because I became productive, but because I could finally be honest and gentle at once.",
    createdAt: "2026-04-24T09:30:00.000Z",
    hearts: 22,
  },
];

export const queuedPosts: Post[] = [
  {
    id: "queued-1",
    author: "Luca",
    body:
      "The convenience store owner remembered my usual tea.\nBeing recognized so softly made the day feel less anonymous.",
    createdAt: "2026-04-24T21:12:00.000Z",
    hearts: 8,
  },
  {
    id: "queued-2",
    author: "Yuri",
    body:
      "I opened my window for five minutes and heard birds before traffic.\nThat tiny order of sounds was enough to steady me.",
    createdAt: "2026-04-24T21:18:00.000Z",
    hearts: 5,
  },
];
