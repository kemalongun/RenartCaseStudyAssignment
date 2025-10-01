import React, { useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";

export default function Carousel({ images = [], currentIndex = 0, onIndexChange }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    onIndexChange?.(emblaApi.selectedScrollSnap());
  }, [emblaApi, onIndexChange]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (emblaApi && Number.isInteger(currentIndex)) emblaApi.scrollTo(currentIndex);
  }, [currentIndex, emblaApi]);

  return (
    <div style={{ position: "relative" }}>
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {images.map((src, i) => (
            <div className="embla__slide" key={i}>
              <div className="embla__slideInner">
                {src ? (
                  <img
                    src={src}
                    alt={`slide-${i}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div style={{ padding: 16, color: "#888" }}>No image</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Left arrow */}
      <button
        onClick={() => emblaApi && emblaApi.scrollPrev()}
        aria-label="Previous image"
        className="embla__arrow embla__arrow--left"
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>

      {/* Right arrow */}
      <button
        onClick={() => emblaApi && emblaApi.scrollNext()}
        aria-label="Next image"
        className="embla__arrow embla__arrow--right"
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
    </div>
  );
}
