import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/relationship-server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const ownerId = await requireAdmin(request);

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided in form field 'file'." }, { status: 400 });
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 20MB limit." }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "audio/mpeg",
      "audio/mp4",
      "audio/wav",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split(".").pop() || "bin";
    const uniqueName = `${ownerId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${fileExt}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("relationship-media")
      .upload(uniqueName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Find the relationship belonging to this owner
    const { data: relationship } = await supabaseAdmin
      .from("relationships")
      .select("id")
      .eq("owner_firebase_uid", ownerId)
      .maybeSingle();

    if (relationship) {
      const isMediaImage = file.type.startsWith("image/");
      const isMediaVideo = file.type.startsWith("video/");
      const isMediaAudio = file.type.startsWith("audio/");
      const mediaType = isMediaVideo ? "video" : isMediaAudio ? "audio" : "image";

      // 1. Insert into media_assets
      await supabaseAdmin.from("media_assets").insert({
        relationship_id: relationship.id,
        storage_path: uniqueName,
        media_type: mediaType,
        mime_type: file.type,
        bytes: file.size,
        visibility: "shared",
      });

      // 2. If specified as portrait or if portrait is currently empty, set as portrait
      const isPortraitRequest =
        formData.get("isPortrait") === "true" ||
        formData.get("type") === "portrait" ||
        formData.get("is_portrait") === "true";

      const { data: currentSettings } = await supabaseAdmin
        .from("relationship_settings")
        .select("portrait_path")
        .eq("relationship_id", relationship.id)
        .maybeSingle();

      if (isPortraitRequest || !currentSettings?.portrait_path) {
        await supabaseAdmin
          .from("relationship_settings")
          .update({ portrait_path: uniqueName })
          .eq("relationship_id", relationship.id);
      }
    }

    // Get public & signed URLs for immediate client use
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("relationship-media")
      .getPublicUrl(uniqueName);

    const { data: signedData } = await supabaseAdmin.storage
      .from("relationship-media")
      .createSignedUrl(uniqueName, 3600);

    return NextResponse.json({
      ok: true,
      storagePath: uniqueName,
      publicUrl: publicUrlData?.publicUrl || null,
      signedUrl: signedData?.signedUrl || null,
      url: signedData?.signedUrl || publicUrlData?.publicUrl || uniqueName,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unauthorized." }, { status: 401 });
  }
}
