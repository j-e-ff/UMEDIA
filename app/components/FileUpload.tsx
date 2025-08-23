"use client";
import React, { useState, useEffect, useRef } from "react";

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  fileName?: string; // The actual object key stored in R2
  status: "uploading" | "success" | "error";
  progress: number;
}

interface FileUploadProps {
  onFilesUploaded?: (files: UploadedFile[]) => void;
  compact?: boolean;
  required?: boolean;
}

const FileUpload = ({
  onFilesUploaded,
  compact = false,
  required = false,
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const lastSuccessfulFilesRef = useRef<UploadedFile[]>([]);

  // Notify parent component when files are successfully uploaded
  useEffect(() => {
    if (!onFilesUploaded || uploadedFiles.length === 0) {
      return;
    }

    // Get all successful files
    const successfulFiles = uploadedFiles.filter(
      (file) => file.status === "success"
    );

    // Only call onFilesUploaded if the successful files have actually changed
    if (
      successfulFiles.length > 0 &&
      JSON.stringify(successfulFiles) !==
        JSON.stringify(lastSuccessfulFilesRef.current)
    ) {
      console.log(
        "FileUpload: Notifying parent with successful files:",
        successfulFiles
      );
      lastSuccessfulFilesRef.current = successfulFiles;
      onFilesUploaded(successfulFiles);
    }
  }, [uploadedFiles, onFilesUploaded]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);

    // create initial file entires (used for tracking progress and removal identification)
    const initialFiles: UploadedFile[] = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      url: "",
      status: "uploading" as const,
      progress: 0,
    }));

    setUploadedFiles((prev) => [...prev, ...initialFiles]);

    // Upload each file to R2
    const uploadPromises = files.map(async (file, index) => {
      const fileId = initialFiles[index].id; // Use the ID from the initial files array

      try {
        // set update progress to 25 (file selected)
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress: 25 } : f))
        );
        // get presigned URL from backend
        const res = await fetch(
          `/api/upload-url?fileName=${encodeURIComponent(
            file.name
          )}&fileType=${encodeURIComponent(file.type)}`
        );

        if (!res.ok) throw new Error("Failed to get upload URL");

        // update progress to 50% (get presigned URL)
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress: 50 } : f))
        );

        const { url, fileName } = await res.json();

        // upload the file directly to R2 bucket
        const uploadRes = await fetch(url, {
          method: "put",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!uploadRes.ok) throw new Error("Upload Failed");
        // update progress to 100%
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress: 100 } : f))
        );

        // construct the public url for the uploaded file
        const accountId = process.env.NEXT_PUBLIC_R2_ACCOUNT_ID;
        const bucketName = process.env.NEXT_PUBLIC_R2_BUCKET_NAME;
        const publicR2BaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
        const publicUrl = `${publicR2BaseUrl}${encodeURIComponent(fileName)}`;
        // url used when custom domain created
        // const publicUrl = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${encodeURIComponent(
        //   fileName
        // )}`;

        // update file status to success and include the object key
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  url: publicUrl,
                  fileName: fileName,
                  status: "success" as const,
                }
              : f
          )
        );
      } catch (error) {
        console.error("Error uploading file:", error);
        // Update file status to error
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: "error" as const } : f
          )
        );
      }
    });

    await Promise.all(uploadPromises);
    setUploading(false);
  };

  const removeFile = async (fileId: string, fileName?: string) => {
    // remove from UI immediately
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));

    // if we have a fileName, delete from R2 storage
    if (fileName) {
      try {
        const res = await fetch(
          `/api/delete-file?fileName=${encodeURIComponent(fileName)}`,
          {
            method: "DELETE",
          }
        );
        if (!res.ok) {
          console.error("failed to delete file from storage");
        }
      } catch (error) {
        console.error("Error deleting file:", error);
      }
    }
  };

  return (
    <div className="">
      <div className="mb-4 ">
        <input
          type="file"
          className="file-input file-input-secondary w-full "
          onChange={handleFileChange}
          disabled={uploading}
          accept="image/*"
          multiple={!compact}
          required={required}
        />
        {!compact && (
          <p className="text-sm mt-2">You can select multiple files at once</p>
        )}
      </div>

      {uploading && (
        <div className="text-blue-600 mb-4">Uploading files...</div>
      )}

      {uploadedFiles.length > 0 && !compact && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Uploaded Files:</h3>
          {uploadedFiles.map((file) => (
            <div key={file.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-black">{file.name}</span>
                <button
                  onClick={() => removeFile(file.id, file.fileName)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>

              {file.status === "uploading" && (
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Uploading... {file.progress}%
                  </p>
                </div>
              )}

              {file.status === "success" && (
                <div className="space-y-2">
                  <p className="text-green-600 text-sm">✓ Upload successful</p>
                  <img
                    src={file.url}
                    alt={file.name}
                    className="max-w-xs border rounded"
                    onError={(e) => {
                      console.error("Failed to load image");
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <p className="text-sm text-gray-600">
                    URL:{" "}
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline break-all"
                    >
                      {file.url}
                    </a>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
