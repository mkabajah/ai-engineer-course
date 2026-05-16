import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_MB = 100;
const ACCEPTED = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];

export function VideoUploader({
  videoPath,
  onUploaded,
}: {
  videoPath: string | null;
  onUploaded: (path: string | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Please upload an MP4, MOV, or WebM video.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Video must be under ${MAX_MB} MB.`);
      return;
    }
    setUploading(true);
    setProgress(10);
    const ext = file.name.split(".").pop() || "mp4";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("applicant-videos")
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    setProgress(100);
    setUploading(false);
    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    onUploaded(path);
    toast.success("Video uploaded.");
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => ref.current?.click()}
        className="cursor-pointer rounded-sm border border-dashed border-rule bg-card px-6 py-12 text-center transition-colors hover:bg-accent"
      >
        <div className="serif text-2xl">
          {videoPath ? "Video uploaded ✓" : uploading ? `Uploading… ${progress}%` : "Click to upload your video"}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          MP4, MOV, or WebM — under {MAX_MB} MB — ideally 60–120 seconds.
        </div>
      </div>
      <input
        ref={ref}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      {previewUrl && (
        <video src={previewUrl} controls className="w-full rounded-sm border border-rule" />
      )}
      {videoPath && (
        <button
          onClick={() => { onUploaded(null); setPreviewUrl(null); }}
          className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Remove & re-upload
        </button>
      )}
    </div>
  );
}
