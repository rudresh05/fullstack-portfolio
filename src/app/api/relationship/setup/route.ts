import { NextResponse } from "next/server";
import { hashPasscode, requireAdmin } from "@/lib/relationship-server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const ownerId = await requireAdmin(request);
    
    // Find existing relationship owned by this admin
    const { data: relationship, error: relErr } = await supabaseAdmin
      .from("relationships")
      .select("id")
      .eq("owner_firebase_uid", ownerId)
      .maybeSingle();
      
    if (relErr || !relationship) {
      return NextResponse.json({ error: "Please bootstrap the relationship space first." }, { status: 404 });
    }
    
    const relationshipId = relationship.id;
    const body = await request.json().catch(() => ({}));
    
    // 1. Update relationship settings and recipient name
    if (typeof body.recipientName === "string") {
      await supabaseAdmin
        .from("relationships")
        .update({ recipient_name: body.recipientName.trim() })
        .eq("id", relationshipId);
    }
    
    const settingsUpdate: Record<string, any> = {};
    if (typeof body.heroTitle === "string") settingsUpdate.hero_title = body.heroTitle;
    if (typeof body.heroSubtitle === "string") settingsUpdate.hero_subtitle = body.heroSubtitle;
    if (typeof body.storyHeading === "string") settingsUpdate.story_heading = body.storyHeading;
    if (typeof body.storyBody === "string") settingsUpdate.story_body = body.storyBody;
    if (body.portraitPath !== undefined) settingsUpdate.portrait_path = body.portraitPath;
    
    if (Object.keys(settingsUpdate).length > 0) {
      await supabaseAdmin
        .from("relationship_settings")
        .update(settingsUpdate)
        .eq("relationship_id", relationshipId);
    }
    
    // 2. Overwrite Timeline Milestones
    if (Array.isArray(body.timeline)) {
      // Clear old milestones
      await supabaseAdmin.from("timeline_events").delete().eq("relationship_id", relationshipId);
      
      const timelinePayload = body.timeline.map((item: any, idx: number) => ({
        relationship_id: relationshipId,
        title: String(item.title || "").trim(),
        body: String(item.body || "").trim(),
        occurred_on: item.occurredOn || null,
        location_name: item.locationName || null,
        sort_order: idx,
        is_published: true,
      })).filter((item: any) => item.title);
      
      if (timelinePayload.length > 0) {
        await supabaseAdmin.from("timeline_events").insert(timelinePayload);
      }
    }
    
    // 3. Overwrite Memories & Media
    if (Array.isArray(body.memories)) {
      // Clear old memories
      await supabaseAdmin.from("memories").delete().eq("relationship_id", relationshipId);
      
      for (let idx = 0; idx < body.memories.length; idx++) {
        const memory = body.memories[idx];
        if (!memory.title) continue;
        
        const { data: insertedMemory } = await supabaseAdmin
          .from("memories")
          .insert({
            relationship_id: relationshipId,
            title: String(memory.title).trim(),
            caption: String(memory.caption || "").trim(),
            narrative: String(memory.narrative || "").trim(),
            occurred_on: memory.occurredOn || null,
            location_name: memory.locationName || null,
            mood: memory.mood || null,
            tags: Array.isArray(memory.tags) ? memory.tags.map(String) : [],
            sort_order: idx,
            is_published: true,
          })
          .select("id")
          .single();
          
        if (insertedMemory && Array.isArray(memory.mediaPaths)) {
          for (let mediaIdx = 0; mediaIdx < memory.mediaPaths.length; mediaIdx++) {
            const path = String(memory.mediaPaths[mediaIdx]).trim();
            if (!path) continue;
            
            // Check if media asset already exists
            let { data: asset } = await supabaseAdmin
              .from("media_assets")
              .select("id")
              .eq("storage_path", path)
              .maybeSingle();
              
            if (!asset) {
              // Insert asset
              const { data: newAsset } = await supabaseAdmin
                .from("media_assets")
                .insert({
                  relationship_id: relationshipId,
                  storage_path: path,
                  media_type: path.match(/\.(mp4|webm|ogg)$/i) ? "video" : path.match(/\.(mp3|wav|m4a)$/i) ? "audio" : "image",
                  mime_type: path.match(/\.png$/i) ? "image/png" : path.match(/\.webp$/i) ? "image/webp" : path.match(/\.gif$/i) ? "image/gif" : path.match(/\.mp4$/i) ? "video/mp4" : "image/jpeg",
                  bytes: 0,
                  visibility: "shared"
                })
                .select("id")
                .single();
              asset = newAsset;
            }
            
            if (asset) {
              await supabaseAdmin.from("memory_media").insert({
                memory_id: insertedMemory.id,
                media_asset_id: asset.id,
                alt_text: memory.title,
                sort_order: mediaIdx,
              });
            }
          }
        }
      }
    }
    
    // 4. Overwrite Letters
    if (Array.isArray(body.letters)) {
      await supabaseAdmin.from("letters").delete().eq("relationship_id", relationshipId);
      
      const lettersPayload = body.letters.map((item: any, idx: number) => {
        const payload: Record<string, any> = {
          relationship_id: relationshipId,
          title: String(item.title || "").trim(),
          body: String(item.body || "").trim(),
          signature: String(item.signature || "").trim(),
          access_rule: item.accessRule || "shared",
          unlock_at: item.unlockAt || null,
          sort_order: idx,
          is_published: true,
        };
        
        if (item.accessRule === "passcode" && item.passcode) {
          payload.passcode_hash = hashPasscode(String(item.passcode).trim());
        }
        
        return payload;
      }).filter((item: any) => item.title && item.body);
      
      if (lettersPayload.length > 0) {
        await supabaseAdmin.from("letters").insert(lettersPayload);
      }
    }
    
    // 5. Overwrite Questions
    if (Array.isArray(body.questions)) {
      await supabaseAdmin.from("questions").delete().eq("relationship_id", relationshipId);
      
      const questionsPayload = body.questions.map((item: any, idx: number) => ({
        relationship_id: relationshipId,
        prompt: String(item.prompt || "").trim(),
        helper_text: item.helperText || null,
        response_type: item.responseType || "long_text",
        is_required: Boolean(item.isRequired),
        is_active: true,
        sort_order: idx,
      })).filter((item: any) => item.prompt);
      
      if (questionsPayload.length > 0) {
        await supabaseAdmin.from("questions").insert(questionsPayload);
      }
    }
    
    // 6. Overwrite Bucket List
    if (Array.isArray(body.bucketList)) {
      await supabaseAdmin.from("bucket_list_items").delete().eq("relationship_id", relationshipId);
      
      const bucketPayload = body.bucketList.map((item: any, idx: number) => ({
        relationship_id: relationshipId,
        title: String(item.title || "").trim(),
        description: String(item.description || "").trim(),
        category: String(item.category || "together").trim(),
        status: item.status || "planned",
        sort_order: idx,
      })).filter((item: any) => item.title);
      
      if (bucketPayload.length > 0) {
        await supabaseAdmin.from("bucket_list_items").insert(bucketPayload);
      }
    }
    
    // 7. Overwrite Future Places
    if (Array.isArray(body.places)) {
      await supabaseAdmin.from("future_places").delete().eq("relationship_id", relationshipId);
      
      const placesPayload = body.places.map((item: any, idx: number) => ({
        relationship_id: relationshipId,
        name: String(item.name || "").trim(),
        story: String(item.story || "").trim(),
        is_visited: Boolean(item.isVisited),
        sort_order: idx,
      })).filter((item: any) => item.name);
      
      if (placesPayload.length > 0) {
        await supabaseAdmin.from("future_places").insert(placesPayload);
      }
    }
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unauthorized." }, { status: 401 });
  }
}
