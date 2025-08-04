import { NextRequest } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get("fileName");

  if (!fileName) {
    return new Response(
      JSON.stringify({ error: "Missing fileName parameter" }),
      {
        status: 400,
      }
    );
  }

  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME || "umedia-images",
    Key: fileName,
  });

  try {
    await r2.send(command);
    return Response.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return new Response(JSON.stringify({ error: "Failed to delete file" }), {
      status: 500,
    });
  }
}
