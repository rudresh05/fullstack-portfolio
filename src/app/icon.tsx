import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Route segment config
export const runtime = "nodejs"; // Using nodejs runtime to use fs

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default async function Icon() {
  try {
    const imagePath = join(process.cwd(), "public", "rudresh-portfolio.jpeg");
    const imageBuffer = await readFile(imagePath);
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;

    return new ImageResponse(
      (
        <div
          style={{
            background: "white",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            overflow: "hidden",
          }}
        >
          <img
            src={base64Image}
            alt="Rudresh Patel"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      ),
      {
        ...size,
      }
    );
  } catch (error) {
    console.error("Icon generation error:", error);
    // Fallback simple icon
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 20,
            background: "black",
            color: "white",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
          }}
        >
          RP
        </div>
      ),
      {
        ...size,
      }
    );
  }
}
