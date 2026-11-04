import type { ImgHTMLAttributes } from "react";
import { preload } from "react-dom";
import manifest from "@/lib/image-manifest.json";

type Asset = { width: number; height: number; variants: { width: number; avif: string; webp: string }[] };
type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> & {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
};

// Assets are encoded ahead of time so even an uncached page needs no image server.
export function ResponsiveImage({ src, alt, width, height, fill, priority, sizes = "100vw", style, loading, ...props }: Props) {
  const asset = (manifest as Record<string, Asset>)[src];
  if (!asset) throw new Error(`Responsive image is missing from the manifest: ${src}`);

  const avifSet = asset.variants.map(image => `${image.avif} ${image.width}w`).join(", ");
  const webpSet = asset.variants.map(image => `${image.webp} ${image.width}w`).join(", ");
  const fallback = asset.variants[asset.variants.length - 1];

  if (priority) {
    preload(fallback.avif, { as: "image", type: "image/avif", imageSrcSet: avifSet, imageSizes: sizes, fetchPriority: "high" });
  }

  return (
    <picture style={{ display: "contents" }}>
      <source type="image/avif" srcSet={avifSet} sizes={sizes} />
      <img
        {...props}
        src={fallback.webp}
        srcSet={webpSet}
        sizes={sizes}
        alt={alt}
        width={width ?? asset.width}
        height={height ?? asset.height}
        loading={priority ? "eager" : loading ?? "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style}
      />
    </picture>
  );
}
