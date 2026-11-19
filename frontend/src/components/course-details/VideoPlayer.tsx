import React, { useEffect, useRef } from "react";
import { Paper } from "@mui/material";
import { isYouTubeUrl, toYouTubeEmbedUrl } from "../../utils/youtub";

export const VideoPlayer: React.FC<{ url: string }> = ({ url }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isYouTubeUrl(url)) return;

    const video = videoRef.current;
    if (!video) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === "s" || e.key === "a")) ||
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "C")) ||
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault();
        return false;
      }
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    video.addEventListener("contextmenu", handleContextMenu);
    video.addEventListener("dragstart", handleDragStart);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      video.removeEventListener("contextmenu", handleContextMenu);
      video.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [url]);

  const isYT = isYouTubeUrl(url);
  const ytEmbed = isYT ? toYouTubeEmbedUrl(url) : null;

  return (
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
        MozUserSelect: "none",
        msUserSelect: "none",
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
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: 0,
          }}
        />
      ) : (
        <video
          ref={videoRef}
          aria-label="レッスン動画"
          controls
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "auto",
          }}
          src={url}
          onLoadStart={() => {
            if (videoRef.current) {
              videoRef.current.removeAttribute("download");
            }
          }}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
      )}
    </Paper>
  );
};
