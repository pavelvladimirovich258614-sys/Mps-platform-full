import { useEffect, useRef, useState, type ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import Link from "@tiptap/extension-link";
import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { apiForm } from "../api/client";
import { EditorImageNode } from "./EditorImageNodeViews";
import { ImageCarouselNode } from "./ImageCarouselNode";

type RichTextEditorProps = { value: string; onChange: (html: string) => void };
type ToolbarState = {
  bold: boolean;
  italic: boolean;
  strike: boolean;
  heading1: boolean;
  heading2: boolean;
  heading3: boolean;
  bulletList: boolean;
  orderedList: boolean;
  blockquote: boolean;
  link: boolean;
};

function getToolbarState(editor: Editor | null): ToolbarState {
  return {
    bold: editor?.isActive("bold") ?? false,
    italic: editor?.isActive("italic") ?? false,
    strike: editor?.isActive("strike") ?? false,
    heading1: editor?.isActive("heading", { level: 1 }) ?? false,
    heading2: editor?.isActive("heading", { level: 2 }) ?? false,
    heading3: editor?.isActive("heading", { level: 3 }) ?? false,
    bulletList: editor?.isActive("bulletList") ?? false,
    orderedList: editor?.isActive("orderedList") ?? false,
    blockquote: editor?.isActive("blockquote") ?? false,
    link: editor?.isActive("link") ?? false,
  };
}

type ToolbarButtonProps = { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode };

function ToolbarButton({ label, active = false, disabled = false, onClick, children }: ToolbarButtonProps) {
  return <button type="button" className={active ? "rich-editor-action active" : "rich-editor-action"} aria-label={label} aria-pressed={active} disabled={disabled} onClick={onClick}>{children}</button>;
}

function insertImageAtDocumentStart(editor: Editor, src: string, alt: string) {
  const { doc, schema } = editor.state;
  const carouselType = schema.nodes.imageCarousel;
  const imageType = schema.nodes.image;
  if (!carouselType || !imageType) return;

  const images: ProseMirrorNode[] = [];
  let leadingMediaEnd = 0;
  let readingLeadingMedia = true;

  doc.forEach((node, offset) => {
    if (!readingLeadingMedia) return;
    if (node.type === imageType) images.push(node);
    else if (node.type === carouselType) node.forEach((image) => images.push(image));
    else {
      readingLeadingMedia = false;
      return;
    }
    leadingMediaEnd = offset + node.nodeSize;
  });

  const uploadedImage = imageType.create({ src, alt });
  const transaction = editor.state.tr;
  if (leadingMediaEnd === 0) transaction.insert(0, uploadedImage);
  else transaction.replaceWith(0, leadingMediaEnd, carouselType.create(null, [...images, uploadedImage]));
  editor.view.dispatch(transaction);
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false, bold: false, italic: false, strike: false }),
      Bold.extend({ inclusive: false }),
      Italic.extend({ inclusive: false }),
      Strike.extend({ inclusive: false }),
      Link.configure({ openOnClick: false, autolink: false }),
      EditorImageNode.configure({ allowBase64: false }),
      ImageCarouselNode,
    ],
    content: value,
    editorProps: { attributes: { class: "rich-editor-canvas", role: "textbox", "aria-label": "Текст публикации" } },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });
  const [toolbarState, setToolbarState] = useState<ToolbarState>(() => getToolbarState(editor));

  useEffect(() => {
    if (!editor) return;
    const syncToolbarState = () => setToolbarState(getToolbarState(editor));
    syncToolbarState();
    editor.on("selectionUpdate", syncToolbarState);
    editor.on("transaction", syncToolbarState);
    return () => {
      editor.off("selectionUpdate", syncToolbarState);
      editor.off("transaction", syncToolbarState);
    };
  }, [editor]);

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
      insertImageAtDocumentStart(editor, uploaded.url, file.name);
    } catch (cause) {
      setUploadError(cause instanceof Error ? cause.message : "Не удалось загрузить изображение");
    } finally {
      setUploading(false);
    }
  };

  return <section className="rich-editor" aria-label="Редактор публикации">
    <div className="rich-editor-toolbar" role="toolbar" aria-label="Форматирование текста">
      <div className="rich-editor-group">
        <ToolbarButton label="Жирный" active={toolbarState.bold} onClick={() => editor.chain().focus().toggleBold().run()}>B</ToolbarButton>
        <ToolbarButton label="Курсив" active={toolbarState.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>I</ToolbarButton>
        <ToolbarButton label="Зачёркнутый" active={toolbarState.strike} onClick={() => editor.chain().focus().toggleStrike().run()}>S</ToolbarButton>
      </div>
      <div className="rich-editor-group">
        {[1, 2, 3].map((level) => <ToolbarButton key={level} label={`Заголовок ${level}`} active={toolbarState[`heading${level}` as "heading1" | "heading2" | "heading3"]} onClick={() => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run()}>{`H${level}`}</ToolbarButton>)}
      </div>
      <div className="rich-editor-group">
        <ToolbarButton label="Маркированный список" active={toolbarState.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>•</ToolbarButton>
        <ToolbarButton label="Нумерованный список" active={toolbarState.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</ToolbarButton>
        <ToolbarButton label="Цитата" active={toolbarState.blockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</ToolbarButton>
      </div>
      <div className="rich-editor-group">
        <ToolbarButton label="Ссылка" active={toolbarState.link} onClick={toggleLink}>↗</ToolbarButton>
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
