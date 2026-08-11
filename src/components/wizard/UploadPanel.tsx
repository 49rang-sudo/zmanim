"use client";

import * as React from "react";
import { CheckCircle2, FileUp, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatFileSize } from "@/lib/utils";
import { ALLOWED_EXTENSIONS } from "@/lib/file-check";

type UploadedFile = { name: string; size: number };

type Props = {
  orderId: string;
  accessToken: string;
  maxUploadMb: number;
  uploaded: UploadedFile | null;
  onUploaded: (file: UploadedFile) => void;
};

export function UploadPanel({
  orderId,
  accessToken,
  maxUploadMb,
  uploaded,
  onUploaded,
}: Props) {
  const [dragging, setDragging] = React.useState(false);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const upload = React.useCallback(
    (file: File) => {
      setError(null);

      if (file.size > maxUploadMb * 1024 * 1024) {
        setError(`הקובץ גדול מדי. המגבלה היא ${maxUploadMb} מ״ב.`);
        return;
      }

      const form = new FormData();
      form.append("file", file);

      // XHR ולא fetch — רק כך יש אחוזי התקדמות אמיתיים בהעלאה
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/orders/${orderId}/upload`);
      xhr.setRequestHeader("x-order-token", accessToken);

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        setProgress(null);
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            onUploaded({ name: data.file.name, size: data.file.size });
          } else {
            setError(data?.error?.message ?? "ההעלאה נכשלה");
          }
        } catch {
          setError("ההעלאה נכשלה");
        }
      });

      xhr.addEventListener("error", () => {
        setProgress(null);
        setError("שגיאת רשת. בדקו את החיבור ונסו שוב.");
      });

      setProgress(0);
      xhr.send(form);
    },
    [orderId, accessToken, maxUploadMb, onUploaded],
  );

  const uploading = progress !== null;

  if (uploaded && !uploading) {
    return (
      <div className="rounded-lg border border-accent bg-accent-soft p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-accent" />

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">הקובץ נקלט</p>
            <p className="mt-0.5 truncate text-sm text-ink-2" title={uploaded.name}>
              {uploaded.name}
            </p>
            <p className="tnum mt-0.5 text-xs text-muted">
              {formatFileSize(uploaded.size)}
            </p>
          </div>

          <Button
            variant="quiet"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <RefreshCw className="size-3.5" />
            החלפה
          </Button>
        </div>

        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={ALLOWED_EXTENSIONS.join(",")}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
            event.target.value = "";
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border-2 border-dashed p-10 text-center",
          "transition-[border-color,background-color,transform] duration-200 ease-smooth",
          uploading
            ? "cursor-wait border-accent"
            : dragging
              ? "-translate-y-1 cursor-copy border-accent bg-accent-soft"
              : "cursor-pointer border-line-2 bg-surface-2 hover:border-accent hover:bg-accent-soft",
        )}
      >
        {uploading ? (
          <div className="curtain-bg pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        ) : null}

        <div className="relative grid size-12 place-items-center rounded-full bg-surface text-accent shadow-e1">
          <FileUp className="size-5" />
        </div>

        {uploading ? (
          <>
            <p className="relative font-semibold text-ink">מעלה את הקובץ…</p>
            <div className="relative h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-3">
              {/* גרדיאנט הלוגו = התקדמות בזמן */}
              <div
                className="progress-fill h-full rounded-full transition-[width] duration-200 ease-smooth"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="tnum relative text-sm text-muted">{progress}%</p>
          </>
        ) : (
          <>
            <p className="font-semibold text-ink">
              גררו לכאן את הקובץ, או לחצו לבחירה
            </p>
            <p className="max-w-sm text-[12.5px] leading-relaxed text-muted">
              {ALLOWED_EXTENSIONS.join(" · ")}
              <br />
              עד {maxUploadMb} מ״ב
            </p>
          </>
        )}
      </div>

      {error ? (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-danger/40 bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] p-3">
          <X className="mt-0.5 size-4 shrink-0 text-danger" />
          <p className="text-[13px] leading-snug text-danger">{error}</p>
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={ALLOWED_EXTENSIONS.join(",")}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}
