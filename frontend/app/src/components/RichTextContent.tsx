import DOMPurify from "dompurify";
import { useEffect, useState } from "react";
import { ImageCarousel, type CarouselImage } from "./ImageCarousel";
import { POST_IMAGE_SIZES, responsivePostImageSources } from "./ResponsivePostImage";

const richTextPattern = /<(?:p|br|strong|em|s|h[1-3]|ul|ol|li|blockquote|a|img|figure)(?:\s|\/?>)/i;
const allowedTags = ["p", "br", "strong", "em", "s", "h1", "h2", "h3", "ul", "ol", "li", "blockquote", "a", "img", "figure"];
const allowedAttributes = ["href", "src", "alt", "data-carousel", "loading", "decoding", "srcset", "sizes"];

type RichTextContentProps = { html: string; className?: string; preview?: boolean; collapseCarouselInPreview?: boolean };
type ContentSegment = { kind: "html"; html: string } | { kind: "carousel"; images: CarouselImage[] };
const previewTextBlocks = 3;
const previewTextCharacters = 420;

export function sanitizeRichTextHtml(html: string) {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: allowedTags, ALLOWED_ATTR: allowedAttributes, ALLOW_DATA_ATTR: false });
}

function carouselImages(node: Element): CarouselImage[] | null {
  if (node.tagName !== "FIGURE" || node.getAttribute("data-carousel") !== "images") return null;
  const children = Array.from(node.children);
  if (children.length < 2 || children.some((child) => child.tagName !== "IMG")) return null;
  return children.map((image) => ({
    src: image.getAttribute("src") ?? "",
    alt: image.getAttribute("alt") ?? "",
    srcSet: image.getAttribute("srcset") ?? undefined,
    sizes: image.getAttribute("sizes") ?? undefined,
  }));
}

function enhanceInlineImages(html: string) {
  const template = document.createElement("template");
  template.innerHTML = html;
  template.content.querySelectorAll("img").forEach((image) => {
    const src = image.getAttribute("src") ?? "";
    const sources = responsivePostImageSources(src);
    const webpSrcSet = image.getAttribute("srcset") ?? sources.webpSrcSet;
    const sizes = image.getAttribute("sizes") ?? POST_IMAGE_SIZES;

    image.setAttribute("loading", "lazy");
    image.setAttribute("decoding", "async");
    if (webpSrcSet) {
      image.setAttribute("srcset", webpSrcSet);
      image.setAttribute("sizes", sizes);
    }

    if (!sources.avifSrcSet || image.parentElement?.tagName === "PICTURE") return;
    const picture = document.createElement("picture");
    const source = document.createElement("source");
    source.setAttribute("type", "image/avif");
    source.setAttribute("srcset", sources.avifSrcSet);
    source.setAttribute("sizes", sizes);
    image.replaceWith(picture);
    picture.append(source, image);
  });
  return template.innerHTML;
}

function splitCarouselSegments(safeHtml: string): ContentSegment[] {
  const template = document.createElement("template");
  template.innerHTML = safeHtml;
  const segments: ContentSegment[] = [];
  const htmlNodes: ChildNode[] = [];
  const flushHtml = () => {
    if (!htmlNodes.length) return;
    const container = document.createElement("div");
    htmlNodes.forEach((node) => container.append(node.cloneNode(true)));
    segments.push({ kind: "html", html: container.innerHTML });
    htmlNodes.length = 0;
  };

  Array.from(template.content.childNodes).forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const images = carouselImages(node as Element);
      if (images) {
        flushHtml();
        segments.push({ kind: "carousel", images });
        return;
      }
    }
    htmlNodes.push(node);
  });
  flushHtml();
  return segments;
}

function textNodes(node: Node): Text[] {
  if (node.nodeType === Node.TEXT_NODE) return [node as Text];
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const result: Text[] = [];
  while (walker.nextNode()) result.push(walker.currentNode as Text);
  return result;
}

function containsImage(node: Node): boolean {
  return node.nodeType === Node.ELEMENT_NODE && ((node as Element).tagName === "IMG" || Boolean((node as Element).querySelector("img")));
}

function previewHtml(safeHtml: string): { html: string; truncated: boolean } {
  const template = document.createElement("template");
  template.innerHTML = safeHtml;
  let blockCount = 0;
  let characterCount = 0;
  let truncated = false;

  Array.from(template.content.childNodes).forEach((node) => {
    const nodeText = node.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (!nodeText) return;
    blockCount += 1;
    if (blockCount > previewTextBlocks) {
      truncated = true;
      if (!containsImage(node)) {
        node.remove();
        return;
      }
      textNodes(node).forEach((textNode) => textNode.remove());
      return;
    }

    textNodes(node).forEach((textNode) => {
      const normalized = textNode.data.replace(/\s+/g, " ");
      const meaningfulLength = normalized.trim().length;
      if (!meaningfulLength) return;
      const remaining = previewTextCharacters - characterCount;
      if (remaining <= 0) {
        truncated = true;
        textNode.remove();
        return;
      }
      if (meaningfulLength > remaining) {
        textNode.data = `${normalized.trim().slice(0, remaining).trimEnd()}…`;
        characterCount = previewTextCharacters;
        truncated = true;
        return;
      }
      characterCount += meaningfulLength;
    });
  });

  return { html: template.innerHTML, truncated };
}

function previewLegacyText(text: string): { text: string; truncated: boolean } {
  const blocks = text.split(/\n\s*\n/);
  const byBlocks = blocks.slice(0, previewTextBlocks).join("\n\n");
  const truncated = blocks.length > previewTextBlocks || byBlocks.length > previewTextCharacters;
  if (!truncated) return { text, truncated: false };
  return { text: `${byBlocks.slice(0, previewTextCharacters).trimEnd()}…`, truncated: true };
}

function RichHtml({ html, className, showCarousels = true }: { html: string; className: string; showCarousels?: boolean }) {
  const segments = splitCarouselSegments(html);
  if (!segments.some((segment) => segment.kind === "carousel")) {
    return <div className={`rich-text-content ${className}`.trim()} dangerouslySetInnerHTML={{ __html: enhanceInlineImages(html) }} />;
  }
  return <div className={`rich-text-content ${className}`.trim()}>{segments.filter((segment) => showCarousels || segment.kind !== "carousel").map((segment, index) => segment.kind === "carousel"
    ? <ImageCarousel key={`carousel-${index}`} images={segment.images} />
    : <div key={`html-${index}`} dangerouslySetInnerHTML={{ __html: enhanceInlineImages(segment.html) }} />,
  )}</div>;
}

/** Renders the server-approved editor format, with a second client-side sanitization boundary. */
export function RichTextContent({ html, className = "", preview = false, collapseCarouselInPreview = false }: RichTextContentProps) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => setExpanded(false), [html]);

  if (!richTextPattern.test(html)) {
    const collapsed = previewLegacyText(html);
    return <><p className={`rich-text-content legacy-text ${className}`.trim()}>{preview && !expanded ? collapsed.text : html}</p>{preview && collapsed.truncated && <button type="button" className="rich-text-toggle" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}>{expanded ? "Свернуть" : "Читать полностью"}</button>}</>;
  }

  const safeHtml = sanitizeRichTextHtml(html);
  const collapsed = previewHtml(safeHtml);
  const hasCarousel = splitCarouselSegments(safeHtml).some((segment) => segment.kind === "carousel");
  const carouselCollapsed = preview && collapseCarouselInPreview && !expanded && hasCarousel;
  const canExpand = collapsed.truncated || (collapseCarouselInPreview && hasCarousel);
  return <><RichHtml html={preview && !expanded ? collapsed.html : safeHtml} className={className} showCarousels={!carouselCollapsed} />{preview && canExpand && <button type="button" className="rich-text-toggle" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}>{expanded ? "Свернуть" : "Читать полностью"}</button>}</>;
}
