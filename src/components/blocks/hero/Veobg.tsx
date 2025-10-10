"use client";
import { useEffect, useRef, useState } from "react";

export default function Veobg(videoUrls: string[]) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => setCurrent((prev) => (prev + 1) % videoUrls.length);
    video.addEventListener("ended", handleEnded);

    video.load();
    video.play().catch(() => {

    })
    return () => video.removeEventListener("ended", handleEnded); 
  }, [current]);
  
  const active = videoUrls[current];

  return (
    <div className="absolute inset-0 -z-10 h-full w-full overflow-hidden">
      <video
        key={active}
        ref={videoRef}
        className="h-full w-full object-cover"
        src={active}
        muted
        autoPlay
        playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/95" />
    </div>
  );
}
