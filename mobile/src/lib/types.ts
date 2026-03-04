export interface Profile {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  age: number;
  gender: string;
  lookingFor: string;
  crewmateColor: string;
  favoriteRole: string;
  favoriteMap: string;
  playStyle: string;
  susLevel: number;
  gamesPlayed: string;
  photoUrl: string | null;
  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    image: string | null;
  };
  lastMessage?: {
    id: string;
    text: string;
    senderId: string;
    createdAt: string;
  } | null;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
}

export interface SwipeResult {
  swipe: {
    id: string;
    swiperId: string;
    swipedId: string;
    direction: string;
  };
  isMatch: boolean;
}

export const CREWMATE_COLORS = [
  { id: "red", label: "Red", hex: "#C51111" },
  { id: "blue", label: "Blue", hex: "#132ED1" },
  { id: "green", label: "Green", hex: "#117F2D" },
  { id: "pink", label: "Pink", hex: "#ED54BA" },
  { id: "orange", label: "Orange", hex: "#EF7D0E" },
  { id: "yellow", label: "Yellow", hex: "#F5F557" },
  { id: "black", label: "Black", hex: "#3F474E" },
  { id: "white", label: "White", hex: "#D6E0F0" },
  { id: "purple", label: "Purple", hex: "#6B2FBB" },
  { id: "brown", label: "Brown", hex: "#71491E" },
  { id: "cyan", label: "Cyan", hex: "#38FEDC" },
  { id: "lime", label: "Lime", hex: "#50EF39" },
] as const;

export const MAPS = [
  { id: "the-skeld", label: "The Skeld" },
  { id: "mira-hq", label: "MIRA HQ" },
  { id: "polus", label: "Polus" },
  { id: "the-airship", label: "The Airship" },
  { id: "the-fungle", label: "The Fungle" },
] as const;

export const PLAY_STYLES = [
  { id: "detective", label: "Detective", emoji: "🔍" },
  { id: "social", label: "Social Butterfly", emoji: "🦋" },
  { id: "strategist", label: "Strategist", emoji: "🧠" },
  { id: "chaotic", label: "Chaotic Agent", emoji: "🔥" },
  { id: "quiet", label: "Silent Observer", emoji: "👀" },
  { id: "leader", label: "Natural Leader", emoji: "⭐" },
] as const;

export const ROLES = [
  { id: "crewmate", label: "Crewmate" },
  { id: "impostor", label: "Impostor" },
  { id: "both", label: "Both" },
] as const;
