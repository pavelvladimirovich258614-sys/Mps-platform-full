import Image from "@tiptap/extension-image";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";

import { ImageCarousel, type CarouselImage } from "./ImageCarousel";

function imageLabel(alt: unknown, fallback: string) {
  return typeof alt === "string" && alt ? alt : fallback;
}

function EditorImageView({ node, deleteNode }: NodeViewProps) {
  const alt = imageLabel(node.attrs.alt, "Изображение");

  return <NodeViewWrapper className="editor-image-node" contentEditable={false}>
    <img src={node.attrs.src} alt={typeof node.attrs.alt === "string" ? node.attrs.alt : ""} draggable={false} />
    <button type="button" className="editor-image-remove" aria-label={`Удалить изображение: ${alt}`} onMouseDown={(event) => event.preventDefault()} onClick={deleteNode}>×</button>
  </NodeViewWrapper>;
}

export function EditorImageCarouselView({ editor, getPos, node }: NodeViewProps) {
  const images: CarouselImage[] = [];
  node.forEach((image, _offset, index) => {
    images.push({
      src: typeof image.attrs.src === "string" ? image.attrs.src : "",
      alt: imageLabel(image.attrs.alt, `Слайд ${index + 1}`),
    });
  });

  const removeImage = (index: number) => {
    const position = getPos();
    if (typeof position !== "number") return;

    const remaining: ProseMirrorNode[] = [];
    node.forEach((image, _offset, childIndex) => {
      if (childIndex !== index) remaining.push(image);
    });

    const transaction = editor.state.tr;
    if (remaining.length >= 2) {
      transaction.replaceWith(position, position + node.nodeSize, node.type.create(node.attrs, remaining));
    } else if (remaining.length === 1) {
      transaction.replaceWith(position, position + node.nodeSize, remaining[0]);
    } else {
      transaction.delete(position, position + node.nodeSize);
    }
    editor.view.dispatch(transaction);
  };

  return <NodeViewWrapper className="editor-image-carousel-node" contentEditable={false}>
    <NodeViewContent className="editor-image-carousel-source" hidden aria-hidden="true" />
    <ImageCarousel images={images} onRemoveImage={removeImage} />
  </NodeViewWrapper>;
}

export const EditorImageNode = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(EditorImageView);
  },
});
