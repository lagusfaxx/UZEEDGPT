"use client";

import { useEffect, useState } from "react";
import { API_URL } from "../lib/api";

type CreatePostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
  defaultMode?: "IMAGE" | "VIDEO";
};

type PreviewItem = { url: string; type: "IMAGE" | "VIDEO" };

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export default function CreatePostModal({ isOpen, onClose, onCreated, defaultMode = "IMAGE" }: CreatePostModalProps) {
  const [mode, setMode] = useState<"IMAGE" | "VIDEO">(defaultMode);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setMode(defaultMode);
    setTitle("");
    setBody("");
    setIsPublic(false);
    setFiles(null);
    setPreviews([]);
    setError(null);
    setProgress(0);
    setUploading(false);
  }, [isOpen, defaultMode]);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || !fileList.length) {
      setFiles(null);
      setPreviews([]);
      return;
    }
    const accepted = Array.from(fileList).every((file) => {
      if (file.size > MAX_FILE_SIZE) return false;
      if (mode === "IMAGE") return file.type.startsWith("image/");
      return file.type.startsWith("video/");
    });
    if (!accepted) {
      setError("Revisa el formato y tamaño del archivo. Máximo 100MB.");
      return;
    }
    setError(null);
    setFiles(fileList);
    const nextPreviews = Array.from(fileList).map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "VIDEO" : "IMAGE"
    }));
    setPreviews(nextPreviews);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!files || !files.length) {
      setError("Debes seleccionar al menos un archivo.");
      return;
    }
    setError(null);
    setUploading(true);

    const form = new FormData();
    form.append("title", title.trim() || (mode === "VIDEO" ? "Nuevo reel" : "Nueva publicación"));
    form.append("body", body.trim() || "Contenido compartido en UZEED.");
    form.append("isPublic", String(isPublic));
    form.append("price", "0");
    Array.from(files).forEach((file) => form.append("files", file));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/posts/mine`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        setProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setProgress(100);
        setUploading(false);
        onCreated?.();
        onClose();
      } else {
        setError(`No se pudo crear la publicación (${xhr.status}).`);
        setUploading(false);
      }
    };
    xhr.onerror = () => {
      setError("No se pudo subir el contenido.");
      setUploading(false);
    };
    xhr.send(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-uzeed-950/95 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Crear publicación</h2>
            <p className="text-xs text-white/60">Comparte una foto o un reel con tu comunidad.</p>
          </div>
          <button className="btn-ghost" onClick={onClose} type="button">
            Cerrar
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["IMAGE", "VIDEO"] as const).map((type) => (
            <button
              key={type}
              type="button"
              className={mode === type ? "btn-primary" : "btn-secondary"}
              onClick={() => {
                setMode(type);
                handleFiles(null);
              }}
            >
              {type === "IMAGE" ? "Foto" : "Video"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-4 grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm text-white/70">Título</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-white/70">Texto</label>
            <textarea className="input min-h-[120px]" value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="isPublicModal"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="isPublicModal" className="text-sm text-white/70">
              Público (sin paywall)
            </label>
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-white/70">Archivo</label>
            <input
              type="file"
              accept={mode === "IMAGE" ? "image/*" : "video/*"}
              onChange={(e) => handleFiles(e.target.files)}
            />
            <p className="text-xs text-white/40">Formatos permitidos: JPG, PNG, MP4. Máximo 100MB.</p>
          </div>
          {previews.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {previews.map((preview) =>
                preview.type === "IMAGE" ? (
                  <img key={preview.url} src={preview.url} className="w-full rounded-xl border border-white/10" alt="preview" />
                ) : (
                  <video key={preview.url} src={preview.url} className="w-full rounded-xl border border-white/10" controls />
                )
              )}
            </div>
          ) : null}

          {uploading ? (
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-fuchsia-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          ) : null}
          {error ? <div className="text-sm text-red-200">{error}</div> : null}
          <button className="btn-primary" disabled={uploading}>
            {uploading ? `Subiendo ${progress}%` : "Publicar"}
          </button>
        </form>
      </div>
    </div>
  );
}
