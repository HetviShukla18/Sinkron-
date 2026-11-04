"use client";

import { Children, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { A11y, Autoplay, EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/a11y";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeToMotionPreference(notify: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}
const getMotionPreference = () => window.matchMedia(motionQuery).matches;
const getServerMotionPreference = () => true;

export function HeroImageSlider({ children }: { children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [swiperVersion, setSwiperVersion] = useState(0);
  const [imagesReady, setImagesReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = useSyncExternalStore(subscribeToMotionPreference, getMotionPreference, getServerMotionPreference);

  useEffect(() => {
    const controller = new AbortController();
    const images = Array.from(container.current?.querySelectorAll("img") ?? []);
    // All images are eagerly preloaded by the server. Wait for decoding as well
    // as loading before allowing the first transition, including on slow links.
    Promise.all(images.map(async image => {
      if (!image.complete) {
        await new Promise<void>((resolve, reject) => {
          image.addEventListener("load", () => resolve(), { once: true, signal: controller.signal });
          image.addEventListener("error", () => reject(new Error("Hero image unavailable")), { once: true, signal: controller.signal });
        });
      }
      await image.decode();
      if (!image.naturalWidth) throw new Error("Hero image unavailable");
    })).then(() => {
      if (!controller.signal.aborted && images.length > 1) setImagesReady(true);
    }).catch(() => {
      // Retain the first image if another image cannot be prepared.
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper || swiper.destroyed) return;
    swiper.allowTouchMove = imagesReady;
    const element = swiper.el;
    const controller = new AbortController();
    const options = { signal: controller.signal };
    function syncPlayback() {
      if (!swiper || swiper.destroyed) return;
      if (imagesReady && !reducedMotion && !document.hidden && !element.matches(":focus-visible")) {
        if (!swiper.autoplay.running) swiper.autoplay.start();
      } else swiper.autoplay.stop();
    }
    element.addEventListener("focusin", syncPlayback, options);
    element.addEventListener("focusout", () => queueMicrotask(syncPlayback), options);
    element.addEventListener("keydown", event => {
      if (!imagesReady || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
      event.preventDefault();
      syncPlayback();
      if (event.key === "ArrowLeft") swiper.slidePrev();
      else swiper.slideNext();
    }, options);
    document.addEventListener("visibilitychange", syncPlayback, options);
    syncPlayback();
    return () => {
      controller.abort();
      if (!swiper.destroyed) swiper.autoplay.stop();
    };
  }, [imagesReady, reducedMotion, swiperVersion]);

  return (
    <div ref={container} className="hero-image-layer">
      <Swiper
        className="hero-image-slider"
        modules={[A11y, Autoplay, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        speed={reducedMotion ? 0 : 900}
        slidesPerView={1}
        loop
        allowTouchMove={imagesReady}
        autoplay={{ delay: 3_000, disableOnInteraction: false, waitForTransition: false, pauseOnMouseEnter: false }}
        a11y={{ containerRoleDescriptionMessage: "carousel", itemRoleDescriptionMessage: "slide" }}
        role="group"
        aria-label="Water meter installation images. Use the arrow keys to change images. Automatic rotation pauses during keyboard focus."
        aria-live="off"
        tabIndex={0}
        onSwiper={instance => {
          instance.autoplay.stop();
          swiperRef.current = instance;
          setSwiperVersion(version => version + 1);
        }}
        onRealIndexChange={instance => setActiveIndex(instance.realIndex)}
      >
        {Children.toArray(children).map((image, index) => (
          <SwiperSlide key={index} aria-hidden={index !== activeIndex}>{image}</SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
