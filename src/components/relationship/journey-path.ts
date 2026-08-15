import * as THREE from "three";
import type { RelationshipOverview } from "@/lib/relationship-types";
import type { ForHerContent } from "@/lib/content-store";

export interface JourneyChapter {
  id: string;
  chapterNumber: number;
  title: string;
  subtitle?: string;
  body: string;
  date?: string | null;
  location?: string | null;
  coverUrl?: string | null;
  quote?: string;
  tags?: string[];
}

export const DEFAULT_ROMANTIC_CHAPTERS: JourneyChapter[] = [
  {
    id: "chapter-1",
    chapterNumber: 1,
    title: "The Serendipity",
    subtitle: "When the universe whispered your name",
    body: "In a world of billions of souls, our paths crossed in the most magical way. From that very first conversation, something in the quiet corners of my heart knew that life would never be ordinary again.",
    date: "The Beginning",
    location: "Where It All Began",
    quote: "Meeting you was not a coincidence; it was destiny finding its way.",
    tags: ["First Hello", "Destiny", "Spark"],
  },
  {
    id: "chapter-2",
    chapterNumber: 2,
    title: "Midnight Whispers",
    subtitle: "When hours felt like seconds",
    body: "We talked about everything and nothing at all until the stars began to fade into dawn. Every thought shared, every quiet giggle, slowly wove our worlds together into one.",
    date: "Late Nights",
    location: "Under The Starlit Sky",
    quote: "I found a home in your laughter and peace in your voice.",
    tags: ["Deep Talks", "Stargazing", "Connection"],
  },
  {
    id: "chapter-3",
    chapterNumber: 3,
    title: "The Little Magic Moments",
    subtitle: "Treasures hidden in everyday life",
    body: "The gentle warmth of your hand, the funny little inside jokes nobody else understands, and the shared glances across crowded rooms. It's the small, quiet moments that hold the greatest love.",
    date: "Everyday Magic",
    location: "Wherever We Are",
    quote: "You turn ordinary moments into timeless memories.",
    tags: ["Smile", "Warmth", "Sweet Memories"],
  },
  {
    id: "chapter-4",
    chapterNumber: 4,
    title: "Adventures & Sunsets",
    subtitle: "Exploring the world side by side",
    body: "Sunsets watched in comfortable silence, songs sung at the top of our lungs with the windows rolled down, and the thrill of discovering new horizons with my favorite person by my side.",
    date: "Wanderlust",
    location: "On The Open Road",
    quote: "It doesn't matter where we go, as long as we're going together.",
    tags: ["Travel", "Adventures", "Sunsets"],
  },
  {
    id: "chapter-5",
    chapterNumber: 5,
    title: "The Safest Harbor",
    subtitle: "A love that holds you close",
    body: "Through stormy days and quiet nights, in your arms is where the noise of the world fades away. Loving you is the easiest, most natural thing I have ever known.",
    date: "Comfort & Peace",
    location: "Right Beside You",
    quote: "In all the world, there is no heart for me like yours.",
    tags: ["Sanctuary", "Safe Haven", "Trust"],
  },
  {
    id: "chapter-6",
    chapterNumber: 6,
    title: "Forever & Ever After",
    subtitle: "Every tomorrow begins with you",
    body: "Every road has led me to you, and every tomorrow is another page waiting to be written in our forever story. My heart chooses you today, tomorrow, and for all the lifetimes to come.",
    date: "Our Forever",
    location: "Our Forever Garden",
    quote: "I loved you yesterday, I love you still, I always have, I always will.",
    tags: ["Forever", "Eternal Love", "Always"],
  },
];

export const GATE_POSITION = new THREE.Vector3(0, 0, 0);

export function buildJourneySpline(chapterCount: number = 6): {
  curve: THREE.CatmullRomCurve3;
  controlPoints: THREE.Vector3[];
  totalLengthZ: number;
} {
  const points: THREE.Vector3[] = [];
  const count = Math.max(4, chapterCount);

  // 1. Entrance Avenue before Gate
  points.push(new THREE.Vector3(0, 0.2, 16));
  points.push(new THREE.Vector3(0, 0.2, 8));
  points.push(new THREE.Vector3(0, 0.2, 0)); // Grand Gate

  // 2. Beyond Gate: Serpentine Winding S-Curves
  const startZ = -12;
  const segmentSpacing = 36;

  for (let i = 0; i < count; i++) {
    const progress = i / (count - 1);
    const z = startZ - (i * segmentSpacing);
    const lateralCurve = Math.sin(progress * Math.PI * 3.2) * 11.5;
    const gentleElevation = Math.sin(progress * Math.PI * 2) * 0.45;

    points.push(new THREE.Vector3(lateralCurve, 0.2 + gentleElevation, z));
  }

  // 3. Grand Finale stretch at the end
  const finaleZ = -12 - ((count + 1) * segmentSpacing);
  points.push(new THREE.Vector3(0, 0.2, finaleZ));
  points.push(new THREE.Vector3(0, 0.2, finaleZ - 25));

  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
  const totalLengthZ = Math.abs(finaleZ) + 40;

  return { curve, controlPoints: points, totalLengthZ };
}

/**
 * Merges API timeline data, Visual Gallery moments, or romantic defaults.
 */
export function getEnrichedChapters(
  data: RelationshipOverview | null,
  forHer?: ForHerContent | null
): JourneyChapter[] {
  // If Visual Gallery moments are available in studio content
  if (forHer?.moments && forHer.moments.length > 0) {
    const validMoments = forHer.moments.filter((m) => m.img || m.title);
    if (validMoments.length > 0) {
      return validMoments.map((m, idx) => ({
        id: `moment-${idx + 1}`,
        chapterNumber: idx + 1,
        title: m.title || `Chapter ${idx + 1}`,
        subtitle: m.caption || `Moment ${idx + 1}`,
        body: m.text || (DEFAULT_ROMANTIC_CHAPTERS[idx % DEFAULT_ROMANTIC_CHAPTERS.length]?.body || ""),
        date: m.date || null,
        coverUrl: m.img || null,
        quote: forHer.quotes?.[idx % forHer.quotes.length] || undefined,
        tags: ["Visual Gallery", "Sweet Memory"],
      }));
    }
  }

  if (!data) return DEFAULT_ROMANTIC_CHAPTERS;

  const timelineEvents = data.timeline || [];
  if (timelineEvents.length >= 4) {
    return timelineEvents.map((t, idx) => ({
      id: t.id,
      chapterNumber: idx + 1,
      title: t.title,
      subtitle: t.locationName || `Chapter ${idx + 1}`,
      body: t.body,
      date: t.occurredOn ? new Date(t.occurredOn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null,
      location: t.locationName,
      coverUrl: t.coverUrl,
      quote: data.settings?.heroSubtitle || undefined,
      tags: ["Milestone", "Special Memory"],
    }));
  }

  return DEFAULT_ROMANTIC_CHAPTERS;
}
