import React, { useEffect, useRef, useState } from "react";
import { Alert, Paper } from "@mui/material";
import Hls from "hls.js";
import api from "../../services/api";
import { isYouTubeUrl, toYouTubeEmbedUrl } from "../../utils/youtub";

type Props =
  /** A lesson video stored on our servers: played as an encrypted HLS stream. */
  | { lessonId: string; url?: undefined }
  /** Any other video (YouTube, external link). */
  | { url: string; lessonId?: undefined };

const MAX_RELOADS = 3;

/**
 * Lesson videos are never given to the browser as a file link. The player asks
 * the API for a 2-minute stream link, and the API only answers viewers who may
 * watch the lesson. The stream is split into AES-encrypted pieces whose key is
 * also only handed out through a 2-minute link, so a copied URL stops working
 * almost immediately and the pieces on their own cannot be played.
 */
export const VideoPlayer: React.FC<Props> = ({ url, lessonId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Casual-download deterrents (right click, drag, save shortcut).
  useEffect(() => {
    if (url && isYouTubeUrl(url)) return;
    const video = videoRef.current;
    if (!video) return;

    const prevent = (e: Event) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "u")) e.preventDefault();
    };
    video.addEventListener("contextmenu", prevent);
    video.addEventListener("dragstart", prevent);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      video.removeEventListener("contextmenu", prevent);
      video.removeEventListener("dragstart", prevent);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [url, lessonId]);

  // Protected stream.
  useEffect(() => {
    if (!lessonId) return;
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    let cancelled = false;
    let reloads = 0;
    setError(null);

    const load = async (resumeAt?: number) => {
      const { data } = await api.get<{ type: "hls" | "mp4"; url: string }>(
        `/media/lessons/${encodeURIComponent(lessonId)}/stream`
      );
      if (cancelled) return;

      if (data.type === "hls" && Hls.isSupported()) {
        hls?.destroy();
        hls = new Hls({ enableWorker: true });
        hls.on(Hls.Events.ERROR, (_event, info) => {
          if (!info.fatal) return;
          // Links are short-lived on purpose. After a long pause, fetch fresh ones and continue.
          if (info.type === Hls.ErrorTypes.NETWORK_ERROR && reloads < MAX_RELOADS) {
            reloads += 1;
            const at = video.currentTime;
            load(at).catch(() => setError("動画を読み込めませんでした。ページを再読み込みしてください。"));
          } else if (info.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls?.recoverMediaError();
          } else {
            setError("動画を読み込めませんでした。ページを再読み込みしてください。");
          }
        });
        if (resumeAt) {
          hls.once(Hls.Events.MANIFEST_PARSED, () => {
            video.currentTime = resumeAt;
            video.play().catch(() => undefined);
          });
        }
        hls.loadSource(data.url);
        hls.attachMedia(video);
      } else if (data.type === "hls" && video.canPlayType("application/vnd.apple.mpegurl")) {
        // Older iPhones: Safari plays HLS itself.
        video.src = data.url;
      } else if (data.type === "mp4") {
        video.src = data.url;
      } else {
        setError("このブラウザでは動画を再生できません。最新の Chrome や Safari でお試しください。");
      }
    };

    load().catch((err) => {
      if (cancelled) return;
      setError(
        err?.response?.status === 403
          ? "この動画を見るには、メンバー登録が必要です。"
          : "動画を読み込めませんでした。ページを再読み込みしてください。"
      );
    });

    return () => {
      cancelled = true;
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [lessonId]);

  const isYT = !!url && isYouTubeUrl(url);
  const ytEmbed = isYT ? toYouTubeEmbedUrl(url!) : null;

  return (
    <>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Paper
        sx={{
          position: "relative",
          paddingTop: "56.25%",
          bgcolor: "#23211D",
          borderRadius: "12px",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 18px 40px -24px rgba(60,40,20,.35)",
          overflow: "hidden",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        onContextMenu={(e) => !isYT && e.preventDefault()}
      >
        {isYT ? (
          <iframe
            title="レッスン動画"
            src={ytEmbed!}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          />
        ) : (
          <video
            ref={videoRef}
            aria-label="レッスン動画"
            controls
            playsInline
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            src={lessonId ? undefined : url}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          />
        )}
      </Paper>
    </>
  );
};
