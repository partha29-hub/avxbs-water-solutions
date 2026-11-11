"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

const DEFAULT_VIDEO = "/assets/videos/water-softener-promo.mp4";
const DEFAULT_POSTER = "/assets/videos/hero-poster.jpg";

function getPosterForMedia(item) {
  if (item?.posterUrl) return item.posterUrl;
  if (item?.poster) return item.poster;
  const url = item?.mediaUrl || item?.videoUrl || item?.desktopImageUrl || "";
  if (url.includes("res.cloudinary.com") && url.includes("/video/upload/")) {
    return url
      .replace(/\.(mp4|webm|mov|mkv)(\?.*)?$/i, ".jpg")
      .replace("/video/upload/", "/video/upload/so_0/");
  }
  return DEFAULT_POSTER;
}

export default function AutoVideoPlayer() {
  const videoRef = useRef(null);
  const slideTimerRef = useRef(null);

  const [media, setMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [, setIsLoaded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Clear slide timeout helper
  const clearSlideTimer = () => {
    if (slideTimerRef.current) {
      clearTimeout(slideTimerRef.current);
      slideTimerRef.current = null;
    }
  };

  // Fetch active hero banners from the public API
  const loadHeroContent = useCallback(async () => {
    try {
      const bannerRes = await fetch("/api/banners", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (bannerRes.ok) {
        const ct = bannerRes.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          setLoading(false);
          return;
        }
        const bannerData = await bannerRes.json();
        if (
          bannerData?.success &&
          Array.isArray(bannerData.banners) &&
          bannerData.banners.length > 0
        ) {
          const bannerSlides = bannerData.banners.map((b) => {
            const url = b.mediaUrl || b.desktopImageUrl || "";
            const isVid =
              b.mediaType === "video" ||
              /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(url);
            return {
              _id: b._id,
              mediaUrl: url,
              mediaType: isVid ? "video" : "image",
              posterUrl: b.posterUrl || (isVid ? getPosterForMedia(b) : ""),
              order: b.order !== undefined ? Number(b.order) : 0,
            };
          });

          // Sequence strictly follows admin-configured display order
          bannerSlides.sort((a, b) => (a.order || 0) - (b.order || 0));

          setMedia(bannerSlides);
          setLoading(false);
          return;
        }
      }

      // Fallback: If no active banners in MongoDB, fallback to default promo video cleanly
      setMedia([
        {
          _id: "default-hero-promo",
          mediaUrl: DEFAULT_VIDEO,
          mediaType: "video",
          posterUrl: DEFAULT_POSTER,
          order: 0,
        },
      ]);
    } catch (error) {
      console.warn("[Hero Slider] Banner fetch error, falling back to default asset:", error?.message);
      setMedia([
        {
          _id: "default-hero-promo",
          mediaUrl: DEFAULT_VIDEO,
          mediaType: "video",
          posterUrl: DEFAULT_POSTER,
          order: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadHeroContent();
  }, [loadHeroContent]);

  // Live Sync Listeners:
  // Re-fetches immediately when an admin saves, edits, or toggles banners in another tab,
  // and re-fetches whenever the user returns/focuses the window.
  useEffect(() => {
    const handleStorageUpdate = (e) => {
      if (e.key === "avxbs_banner_updated") {
        loadHeroContent();
      }
    };

    const handleWindowFocus = () => {
      loadHeroContent();
    };

    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("storage", handleStorageUpdate);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [loadHeroContent]);

  const current = media[currentIndex] || media[0];
  const isVideo =
    current?.mediaType === "video" ||
    /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(current?.mediaUrl || "");
  const mediaSource = current?.mediaUrl || DEFAULT_VIDEO;
  const posterSource = getPosterForMedia(current);

  // Safely stop and reset previous video before transitioning to the next slide
  const changeSlide = useCallback(
    (newIndex) => {
      clearSlideTimer();
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        } catch (err) {
          // ignore error if video element is already unmounting
        }
      }
      setIsLoaded(false);
      setCurrentIndex(newIndex);
    },
    []
  );

  const nextSlide = useCallback(() => {
    if (media.length < 2) return;
    changeSlide((currentIndex + 1) % media.length);
  }, [media.length, currentIndex, changeSlide]);

  // Play active video automatically whenever currentIndex changes to a video slide
  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(() => {});
          }
        });
      }
    }
  }, [currentIndex, isVideo]);

  // Video canplay handler
  function handleVideoReady(event) {
    const video = event.currentTarget;
    video.muted = true;
    setIsLoaded(true);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
    }
  }

  // Graceful video error fallback
  function handleVideoError(event) {
    console.warn("Hero video error encountered, falling back to default asset.");
    const video = event.currentTarget;
    if (video.src !== window.location.origin + DEFAULT_VIDEO) {
      video.src = DEFAULT_VIDEO;
      video.poster = DEFAULT_POSTER;
      video.load();
      video.play().catch(() => {});
    }
  }

  // Video finished handler: Automatically move to next slide when current video completes
  const handleVideoEnded = useCallback(() => {
    if (media.length > 1 && !isPaused) {
      nextSlide();
    }
  }, [media.length, isPaused, nextSlide]);

  // When video metadata loads, calculate safe fallback timer based on duration
  const handleVideoLoadedMetadata = (event) => {
    const dur = event.currentTarget.duration;
    if (media.length > 1 && !isPaused && isFinite(dur) && dur > 0) {
      clearSlideTimer();
      // Set fallback timer for video length + 1 second buffer
      slideTimerRef.current = setTimeout(() => {
        nextSlide();
      }, (dur + 1) * 1000);
    }
  };

  // Automatic slide rotation:
  // - Images remain visible for 5 seconds
  // - Videos play until finished (onEnded), with a safe fallback timer (25s) if duration unknown
  useEffect(() => {
    clearSlideTimer();

    if (!current || media.length < 2 || isPaused) {
      return;
    }

    if (!isVideo) {
      // 5 seconds visible duration for image slides
      slideTimerRef.current = setTimeout(() => {
        nextSlide();
      }, 5000);
    } else {
      // Safe fallback timer for videos in case ended event does not fire
      slideTimerRef.current = setTimeout(() => {
        nextSlide();
      }, 25000);
    }

    return () => clearSlideTimer();
  }, [currentIndex, current, isVideo, media.length, isPaused, nextSlide]);

  return (
    <section
      className="hero-media-slider"
      aria-label="AVXBS media showcase"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="hero-media-frame">
        {loading ? (
          <div className="hero-media-loading-placeholder">
            <div className="hero-loading-pulse" />
          </div>
        ) : isVideo ? (
          <video
            key={current?._id || `hero-vid-${currentIndex}`}
            ref={videoRef}
            src={mediaSource}
            poster={posterSource}
            className="hero-media-content"
            autoPlay
            muted
            loop={media.length === 1}
            playsInline
            preload="auto"
            onCanPlay={handleVideoReady}
            onLoadedData={() => setIsLoaded(true)}
            onLoadedMetadata={handleVideoLoadedMetadata}
            onEnded={handleVideoEnded}
            onError={handleVideoError}
          />
        ) : (
          <img
            key={current?._id || `hero-img-${currentIndex}`}
            src={mediaSource}
            alt="AVXBS Hero Banner"
            className="hero-media-content"
            loading="eager"
            onLoad={() => setIsLoaded(true)}
            onError={(e) => {
              console.warn("Hero image failed to load, switching to default poster.");
              e.currentTarget.src = DEFAULT_POSTER;
              setIsLoaded(true);
            }}
          />
        )}
      </div>

      {/* Bottom Slider Progress Indicator Dots (non-clickable progress indicators) */}
      {!loading && media.length > 1 && (
        <div
          className="hero-media-dots"
          aria-hidden="true"
          style={{ pointerEvents: "none" }}
        >
          {media.map((item, index) => (
            <span
              key={item._id || index}
              className={`hero-media-dot ${
                index === currentIndex ? "active" : ""
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
