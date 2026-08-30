import type { ImgHTMLAttributes } from "react";

export const POST_IMAGE_SIZES = "(max-width: 900px) 100vw, 760px";

export type ResponsivePostImageSources = {
  webpSrcSet?: string;
  avifSrcSet?: string;
  sizes: string;
};

type ResponsivePostImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes" | "decoding"> & {
  src: string;
  srcSet?: string;
  avifSrcSet?: string;
  sizes?: string;
};

const variantUrlPattern = /^(.*)-(?:thumbnail|medium|large)\.(?:webp|avif)(\?.*)?$/i;

export function responsivePostImageSources(src: string, sizes = POST_IMAGE_SIZES): ResponsivePostImageSources {
  const match = src.match(variantUrlPattern);
  if (!match) return { sizes };

  const [, stem, query = ""] = match;
  const srcSet = (format: "webp" | "avif") => [
    `${stem}-thumbnail.${format}${query} 320w`,
    `${stem}-medium.${format}${query} 960w`,
    `${stem}-large.${format}${query} 1600w`,
  ].join(", ");

  return { webpSrcSet: srcSet("webp"), avifSrcSet: srcSet("avif"), sizes };
}

export function ResponsivePostImage({ src, srcSet, avifSrcSet, sizes = POST_IMAGE_SIZES, alt, ...imageProps }: ResponsivePostImageProps) {
  const derived = responsivePostImageSources(src, sizes);
  const webpSources = srcSet ?? derived.webpSrcSet;
  const avifSources = avifSrcSet ?? derived.avifSrcSet;
  const image = <img {...imageProps} src={src} alt={alt} srcSet={webpSources} sizes={webpSources ? sizes : undefined} decoding="async" />;

  if (!avifSources) return image;
  return <picture>
    <source type="image/avif" srcSet={avifSources} sizes={sizes} />
    {image}
  </picture>;
}
