import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, FileText, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const statusMeta: Record<
  string,
  { label: string; icon: typeof Loader2; className: string }
> = {
  pending: { label: "Queued", icon: Loader2, className: "text-muted-foreground" },
  processing: { label: "Reading with Claude…", icon: Loader2, className: "text-blue-500" },
  parsed: { label: "Parsed", icon: CheckCircle2, className: "text-emerald-500" },
  failed: { label: "Failed", icon: XCircle, className: "text-destructive" },
};

export default function UploadPage() {
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const saveDocument = useMutation(api.documents.saveDocument);
  const documents = useQuery(api.documents.list);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      try {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!res.ok) throw new Error("Upload failed");
        const { storageId } = await res.json();
        await saveDocument({
          storageId,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
        });
      } catch (err) {
        toast.error(`Could not upload ${file.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Upload documents</h1>
        <p className="text-sm text-muted-foreground">
          Bills, loan statements, or CSV bank exports. Claude reads each one and
          adds it to your bills or loans automatically.
        </p>
      </div>

      <Card
        className={`border-2 border-dashed transition-colors ${dragging ? "border-primary bg-primary/5" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) void uploadFiles(e.dataTransfer.files);
        }}
      >
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <UploadCloud className="size-10 text-muted-foreground" />
          <div>
            <p className="font-medium">Drag files here, or click to browse</p>
            <p className="text-sm text-muted-foreground">PDF, PNG/JPG, or CSV</p>
          </div>
          <Button onClick={() => inputRef.current?.click()}>Choose files</Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.csv,image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) void uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Uploads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {documents?.length === 0 && (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          )}
          {documents?.map((doc) => {
            const meta = statusMeta[doc.status];
            const Icon = meta.icon;
            return (
              <div
                key={doc._id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm">{doc.fileName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {doc.status === "failed" && doc.error && (
                    <span className="max-w-56 truncate text-xs text-destructive" title={doc.error}>
                      {doc.error}
                    </span>
                  )}
                  <Badge variant="outline" className={`gap-1 ${meta.className}`}>
                    <Icon className={`size-3 ${doc.status === "pending" || doc.status === "processing" ? "animate-spin" : ""}`} />
                    {meta.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
