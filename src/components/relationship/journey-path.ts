import * as THREE from "three";
import type { RelationshipOverview } from "@/lib/relationship-types";

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
    title: "Safe Harbor in the Storm",
    subtitle: "My anchor and my calm",
    body: "Whenever life gets stormy, having you is like finding calm waters. You listen without judgment, believe in me when I doubt myself, and wrap my world in endless kindness.",
    date: "Unconditional",
    location: "In Each Other's Arms",
    quote: "You are my safest place in this chaotic world.",
    tags: ["Trust", "Strength", "Forever"],
  },
  {
    id: "chapter-6",
    chapterNumber: 6,
    title: "Today, Tomorrow & Always",
    subtitle: "A love that grows with every sunrise",
    body: "Every single day with you is a gift I will never take for granted. As we walk this winding path together, every bend reveals more beauty, more laughter, and a love that only deepens.",
    date: "Today & Beyond",
    location: "Our Forever Garden",
    quote: "I loved you yesterday, I love you still, I always have, I always will.",
    tags: ["Promise", "Devotion", "Soulmates"],
  },
];

export const GATE_POSITION = new THREE.Vector3(0, 0, 0);

/**
 * Creates a winding 3D CatmullRom spline curve starting with an entrance avenue,
 * passing through the Grand Gate at z = 0, and meandering into the garden.
 */
export function buildJourneySpline(chapterCount: number): {
  curve: THREE.CatmullRomCurve3;
  controlPoints: THREE.Vector3[];
  totalLengthZ: number;
} {
  const points: THREE.Vector3[] = [];

  // 1. Entrance Approach Avenue (Gate is at z = 0, camera starts at z = 16)
  points.push(new THREE.Vector3(0, 0, 24));
  points.push(new THREE.Vector3(0, 0, 16));
  points.push(new THREE.Vector3(0, 0, 8));
  // 2. THE GRAND GATE at z = 0
  points.push(new THREE.Vector3(0, 0, 0));
  // 3. Straight entry through the gate into the garden
  points.push(new THREE.Vector3(0, 0, -12));

  // 4. Winding garden path begins after passing the gate
  const segmentSpacing = 34;
  const count = Math.max(chapterCount, 6);

  for (let i = 1; i <= count; i++) {
    const z = -12 - (i * segmentSpacing);
    const sign = i % 2 === 1 ? -1 : 1;
    const x = sign * (5.5 + Math.sin(i * 1.3) * 1.2);
    const y = Math.sin(i * 0.8) * 0.4;

    points.push(new THREE.Vector3(x, y, z));
  }

  // 5. Grand Finale stretch at the end
  const finaleZ = -12 - ((count + 1) * segmentSpacing);
  points.push(new THREE.Vector3(0, 0.2, finaleZ));
  points.push(new THREE.Vector3(0, 0.2, finaleZ - 25));

  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
  const totalLengthZ = Math.abs(finaleZ) + 40;

  return { curve, controlPoints: points, totalLengthZ };
}

/**
 * Merges API timeline data with rich romantic chapters if the timeline is short or empty.
 */
export function getEnrichedChapters(data: RelationshipOverview | null): JourneyChapter[] {
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

  if (timelineEvents.length > 0) {
    const merged: JourneyChapter[] = [];
    const maxChapters = Math.max(DEFAULT_ROMANTIC_CHAPTERS.length, timelineEvents.length + 3);

    let tIdx = 0;
    for (let i = 0; i < maxChapters; i++) {
      if (tIdx < timelineEvents.length && (i === 0 || i === 2 || i === 4 || i >= DEFAULT_ROMANTIC_CHAPTERS.length)) {
        const t = timelineEvents[tIdx++];
        merged.push({
          id: t.id,
          chapterNumber: i + 1,
          title: t.title,
          subtitle: t.locationName || `Chapter ${i + 1}`,
          body: t.body,
          date: t.occurredOn ? new Date(t.occurredOn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null,
          location: t.locationName,
          coverUrl: t.coverUrl,
          tags: ["Milestone", "Special Memory"],
        });
      } else {
        const def = DEFAULT_ROMANTIC_CHAPTERS[i % DEFAULT_ROMANTIC_CHAPTERS.length];
        merged.push({
          ...def,
          id: `def-${i}`,
          chapterNumber: i + 1,
        });
      }
    }
    return merged;
  }

  return DEFAULT_ROMANTIC_CHAPTERS;
}
