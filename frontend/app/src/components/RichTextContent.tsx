import DOMPurify from "dompurify";

const richTextPattern = /<(?:p|br|strong|em|s|h[1-3]|ul|ol|li|blockquote|a|img)(?:\s|\/?>)/i;
const allowedTags = ["p", "br", "strong", "em", "s", "h1", "h2", "h3", "ul", "ol", "li", "blockquote", "a", "img"];
const allowedAttributes = ["href", "src", "alt"];

type RichTextContentProps = { html: string; className?: string };

/** Renders the server-approved editor format, with a second client-side sanitization boundary. */
export function RichTextContent({ html, className = "" }: RichTextContentProps) {
  if (!richTextPattern.test(html)) {
    return <p className={`rich-text-content legacy-text ${className}`.trim()}>{html}</p>;
  }

  const safeHtml = DOMPurify.sanitize(html, { ALLOWED_TAGS: allowedTags, ALLOWED_ATTR: allowedAttributes });
  return <div className={`rich-text-content ${className}`.trim()} dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}
