import { Node } from "@tiptap/core";

/** A strict block that serializes to the server-approved carousel HTML. */
export const ImageCarouselNode = Node.create({
  name: "imageCarousel",
  group: "block",
  content: "image{2,}",
  defining: true,
  parseHTML: () => [{ tag: 'figure[data-carousel="images"]' }],
  renderHTML: () => ["figure", { "data-carousel": "images" }, 0],
});
