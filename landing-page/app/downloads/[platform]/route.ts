import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;

  if (platform !== "mac" && platform !== "windows") {
    return new NextResponse("Platform not supported. Must be 'mac' or 'windows'.", { status: 400 });
  }

  // Resolve the dist directory at the project root
  const distDir = path.join(process.cwd(), "..", "dist");

  try {
    if (!fs.existsSync(distDir)) {
      return new NextResponse(`Release directory not found on server. Platform: ${platform}`, { status: 404 });
    }

    const files = fs.readdirSync(distDir);
    let matchedFile = "";

    if (platform === "mac") {
      // Look for a .dmg file first
      matchedFile = files.find(f => f.endsWith(".dmg")) || "";
      // Fallback to a zip file if no .dmg is found
      if (!matchedFile) {
        matchedFile = files.find(f => f.endsWith("-mac.zip") || f.endsWith(".zip")) || "";
      }
    } else if (platform === "windows") {
      // Look for a .exe file
      matchedFile = files.find(f => f.endsWith(".exe")) || "";
    }

    if (!matchedFile) {
      return new NextResponse(`No installer file found for ${platform} in the release folder.`, { status: 404 });
    }

    const filePath = path.join(distDir, matchedFile);
    const fileStats = fs.statSync(filePath);

    // Create a Node.js readable stream and convert it to a Web ReadableStream
    const nodeStream = fs.createReadStream(filePath);
    const webStream = Readable.toWeb(nodeStream);

    return new Response(webStream as any, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${matchedFile}"`,
        "Content-Length": fileStats.size.toString(),
      },
    });
  } catch (error: any) {
    console.error("Download route error:", error);
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
  }
}
