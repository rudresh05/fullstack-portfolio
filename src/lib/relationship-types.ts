export type RelationshipOverview = {
  relationship: { id: string; recipientName: string; slug: string };
  settings: { heroTitle: string; heroSubtitle: string; storyHeading: string; storyBody: string; portraitUrl: string | null };
  timeline: Array<{ id: string; title: string; body: string; occurredOn: string | null; locationName: string | null; coverUrl: string | null }>;
  memories: Array<{
    id: string;
    title: string;
    caption: string;
    narrative: string;
    occurredOn: string | null;
    locationName: string | null;
    mood: string | null;
    tags: string[];
    media: Array<{ id: string; url: string; mediaType: 'image' | 'video' | 'audio'; altText: string }>;
  }>;
  letters: Array<{ id: string; title: string; body: string | null; signature: string; accessRule: string; unlockAt: string | null; isUnlocked: boolean }>;
  questions: Array<{ id: string; prompt: string; helperText: string | null; responseType: 'short_text' | 'long_text'; isRequired: boolean }>;
  bucketList: Array<{ id: string; title: string; description: string; category: string; status: 'planned' | 'in_progress' | 'complete' }>;
  places: Array<{ id: string; name: string; story: string; isVisited: boolean }>;
};

