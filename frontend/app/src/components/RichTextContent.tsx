import DOMPurify from "dompurify";
import { ImageCarousel, type CarouselImage } from "./ImageCarousel";

const richTextPattern = /<(?:p|br|strong|em|s|h[1-3]|ul|ol|li|blockquote|a|img|figure)(?:\s|\/?>)/i;
const allowedTags = ["p", "br", "strong", "em", "s", "h1", "h2", "h3", "ul", "ol", "li", "blockquote", "a", "img", "figure"];
const allowedAttributes = ["href", "src", "alt", "data-carousel"];

type RichTextContentProps = { html: string; className?: string };
type ContentSegment = { kind: "html"; html: string } | { kind: "carousel"; images: CarouselImage[] };

export function sanitizeRichTextHtml(html: string) {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: allowedTags, ALLOWED_ATTR: allowedAttributes, ALLOW_DATA_ATTR: false });
}

function carouselImages(node: Element): CarouselImage[] | null {
  if (node.tagName !== "FIGURE" || node.getAttribute("data-carousel") !== "images") return null;
  const children = Array.from(node.children);
  if (children.length < 2 || children.some((child) => child.tagName !== "IMG")) return null;
  return children.map((image) => ({ src: image.getAttribute("src") ?? "", alt: image.getAttribute("alt") ?? "" }));
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

/** Renders the server-approved editor format, with a second client-side sanitization boundary. */
export function RichTextContent({ html, className = "" }: RichTextContentProps) {
  if (!richTextPattern.test(html)) {
    return <p className={`rich-text-content legacy-text ${className}`.trim()}>{html}</p>;
  }

  const safeHtml = sanitizeRichTextHtml(html);
  const segments = splitCarouselSegments(safeHtml);
  if (!segments.some((segment) => segment.kind === "carousel")) {
    return <div className={`rich-text-content ${className}`.trim()} dangerouslySetInnerHTML={{ __html: safeHtml }} />;
  }
  return <div className={`rich-text-content ${className}`.trim()}>{segments.map((segment, index) => segment.kind === "carousel"
    ? <ImageCarousel key={`carousel-${index}`} images={segment.images} />
    : <div key={`html-${index}`} dangerouslySetInnerHTML={{ __html: segment.html }} />,
  )}</div>;
}
