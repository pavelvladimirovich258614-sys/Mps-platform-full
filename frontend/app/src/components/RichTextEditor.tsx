import { useRef, useState, type ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import type { Editor } from "@tiptap/core";
import { GapCursor } from "@tiptap/pm/gapcursor";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Selection } from "@tiptap/pm/state";
import { apiForm } from "../api/client";
import { EditorImageNode } from "./EditorImageNodeViews";
import { ImageCarouselNode } from "./ImageCarouselNode";

type RichTextEditorProps = { value: string; onChange: (html: string) => void };

type ToolbarButtonProps = { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode };

function ToolbarButton({ label, active = false, disabled = false, onClick, children }: ToolbarButtonProps) {
  return <button type="button" className={active ? "rich-editor-action active" : "rich-editor-action"} aria-label={label} aria-pressed={active} disabled={disabled} onClick={onClick}>{children}</button>;
}

function groupAdjacentImages(editor: Editor) {
  const { doc, schema } = editor.state;
  const carouselType = schema.nodes.imageCarousel;
  const imageType = schema.nodes.image;
  if (!carouselType || !imageType) return;

  const replacements: { from: number; to: number; images: ProseMirrorNode[] }[] = [];
  let runStart = -1;
  let runEnd = -1;
  let images: ProseMirrorNode[] = [];
  const finishRun = () => {
    if (images.length >= 2) replacements.push({ from: runStart, to: runEnd, images });
    runStart = -1;
    runEnd = -1;
    images = [];
  };

  doc.forEach((node, offset) => {
    const isImageRunNode = node.type === imageType || node.type === carouselType;
    if (!isImageRunNode) {
      finishRun();
      return;
    }
    if (runStart < 0) runStart = offset;
    runEnd = offset + node.nodeSize;
    if (node.type === imageType) images.push(node);
    else node.forEach((image) => images.push(image));
  });
  finishRun();

  if (!replacements.length) return;
  const transaction = editor.state.tr;
  replacements.reverse().forEach((replacement) => transaction.replaceWith(replacement.from, replacement.to, carouselType.create(null, replacement.images)));
  editor.view.dispatch(transaction);
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false }), Link.configure({ openOnClick: false, autolink: false }), EditorImageNode.configure({ allowBase64: false }), ImageCarouselNode],
    content: value,
    editorProps: { attributes: { class: "rich-editor-canvas", role: "textbox", "aria-label": "Текст публикации" } },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  if (!editor) return null;

  const toggleLink = () => {
    const href = window.prompt("Введите ссылку");
    if (href === null) return;
    if (!href.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
  };

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const uploaded = await apiForm<{ url: string }>("/media", "POST", form);
      editor.chain().setImage({ src: uploaded.url, alt: file.name }).command(({ tr }) => {
        const positionAfterImage = tr.selection.to;
        const resolvedAfterImage = tr.doc.resolve(positionAfterImage);
        const forwardTextSelection = Selection.findFrom(resolvedAfterImage, 1, true);
        tr.setSelection(forwardTextSelection ?? new GapCursor(resolvedAfterImage));
        return true;
      }).run();
      groupAdjacentImages(editor);
    } catch (cause) {
      setUploadError(cause instanceof Error ? cause.message : "Не удалось загрузить изображение");
    } finally {
      setUploading(false);
    }
  };

  return <section className="rich-editor" aria-label="Редактор публикации">
    <div className="rich-editor-toolbar" role="toolbar" aria-label="Форматирование текста">
      <div className="rich-editor-group">
        <ToolbarButton label="Жирный" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>B</ToolbarButton>
        <ToolbarButton label="Курсив" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>I</ToolbarButton>
        <ToolbarButton label="Зачёркнутый" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>S</ToolbarButton>
      </div>
      <div className="rich-editor-group">
        {[1, 2, 3].map((level) => <ToolbarButton key={level} label={`Заголовок ${level}`} active={editor.isActive("heading", { level })} onClick={() => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run()}>{`H${level}`}</ToolbarButton>)}
      </div>
      <div className="rich-editor-group">
        <ToolbarButton label="Маркированный список" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>•</ToolbarButton>
        <ToolbarButton label="Нумерованный список" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</ToolbarButton>
        <ToolbarButton label="Цитата" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</ToolbarButton>
      </div>
      <div className="rich-editor-group">
        <ToolbarButton label="Ссылка" active={editor.isActive("link")} onClick={toggleLink}>↗</ToolbarButton>
        <ToolbarButton label="Вставить изображение" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          <svg className="rich-editor-image-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="8.5" cy="9" r="1.5" />
            <path d="m5 17 4.5-4.5 3.2 3.2 2.3-2.3 4 3.6" />
          </svg>
        </ToolbarButton>
      </div>
    </div>
    <input ref={fileInputRef} className="rich-editor-file-input" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Выбрать изображение" onChange={(event) => void uploadImage(event)} />
    {uploadError && <p className="rich-editor-upload-error" role="alert">{uploadError}</p>}
    <EditorContent editor={editor} />
  </section>;
}
