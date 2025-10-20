import React from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";

/**
 * Modern Image Lightbox component
 * Compatible with React 18+
 *
 * Props:
 *  - src: string | string[]  → image URL or array of URLs
 *  - alt: string             → alt text / caption
 *  - open: boolean           → whether the lightbox is visible
 *  - onClose: function       → callback for closing
 */
export default function ImageLightbox({ src, alt, open, onClose }) {
  if (!src) return null;

  // Allow both single image or gallery array
  const slides = Array.isArray(src)
    ? src.map((s) => ({ src: s, description: alt || "Image" }))
    : [{ src, description: alt || "Image" }];

  return (
    <Lightbox
      open={open}
      close={onClose}
      slides={slides}
      plugins={[Captions, Zoom, Thumbnails]}
      animation={{ fade: 400, swipe: 300 }}
      controller={{ closeOnBackdropClick: true }}
      captions={{ descriptionTextAlign: "center" }}
      zoom={{ maxZoomPixelRatio: 2, scrollToZoom: true }}
      thumbnails={{ width: 80, height: 60, borderRadius: 8 }}
      styles={{
        container: { backgroundColor: "rgba(0,0,0,0.85)" },
        button: { color: "#fff" },
        description: { fontSize: "0.9rem", color: "#ccc", marginTop: 8 },
      }}
    />
  );
}
