import { NextRequest } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get("fileName");
  const fileType = searchParams.get("fileType");

  if (!fileName || !fileType) {
    return new Response(JSON.stringify({ error: "Missing parameters" }), {
      status: 400,
    });
  }

  // Generate a unique filename to prevent conflicts
  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME || "umedia-images",
    Key: uniqueFileName,
    ContentType: fileType,
  });

  try {
    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 900 });
    return Response.json({ url: signedUrl, fileName: uniqueFileName });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate upload URL" }),
      { status: 500 }
    );
  }
}
