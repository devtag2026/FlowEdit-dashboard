"use client";
import { useRef, forwardRef, useImperativeHandle } from "react";
import { Play } from "lucide-react";

const VideoPlayer = forwardRef(function VideoPlayer({ src }, ref) {
  const videoRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getCurrentTime: () => videoRef.current?.currentTime ?? 0,
    seekTo: (t) => {
      if (videoRef.current) videoRef.current.currentTime = t;
    },
  }));

  if (!src) {
    return (
      <div className="aspect-video bg-slate-black rounded-xl md:rounded-2xl flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 to-black/80" />
        <div className="relative z-10 text-center">
          <div className="w-10 h-10 md:w-16 md:h-16 bg-white backdrop-blur rounded-full flex items-center justify-center mb-3 mx-auto">
            <Play className="w-4 h-4 md:w-8 md:h-8 ml-1" />
          </div>
          <p className="text-white/80 text-xs md:text-sm">No video uploaded yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-xl md:rounded-2xl overflow-hidden">
      <video
        ref={videoRef}
        src={src}
        controls
        className="w-full h-full"
        preload="metadata"
      />
    </div>
  );
});

export default VideoPlayer;
