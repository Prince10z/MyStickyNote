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

  // Define potential directories containing the installers
  const searchDirs = [
    path.join(process.cwd(), "..", "dist"),                     // Root dist folder (if running inside MyStickyNote/landing-page)
    path.join(process.cwd(), "..", "MyStickyNote", "dist"),     // Root dist folder (if running inside standalone landing-page next to MyStickyNote)
    path.join(process.cwd(), "public", "downloads"),           // Next.js public/downloads folder (fallback)
    path.join(process.cwd(), "public"),                         // Next.js public folder (fallback)
  ];

  let distDir = "";
  let files: string[] = [];

  // Find the first directory that exists and has files
  for (const dir of searchDirs) {
    if (fs.existsSync(dir)) {
      try {
        const dirFiles = fs.readdirSync(dir);
        if (dirFiles.length > 0) {
          distDir = dir;
          files = dirFiles;
          break;
        }
      } catch (err) {
        console.warn(`Failed to read directory: ${dir}`, err);
      }
    }
  }

  if (!distDir) {
    return new NextResponse(
      `Release directory not found on server. Checked paths:\n${searchDirs.join("\n")}\n\nPlease create the 'dist/' folder in one of the locations above on the server and upload your installer files.`,
      { status: 404 }
    );
  }

  try {
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
      return new NextResponse(
        `No installer file found for ${platform} in release folder: ${distDir}`,
        { status: 404 }
      );
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
