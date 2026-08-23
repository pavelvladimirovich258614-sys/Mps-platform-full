import { useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { apiForm } from "../api/client";

type RichTextEditorProps = { value: string; onChange: (html: string) => void };

type ToolbarButtonProps = { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: string };

function ToolbarButton({ label, active = false, disabled = false, onClick, children }: ToolbarButtonProps) {
  return <button type="button" className={active ? "rich-editor-action active" : "rich-editor-action"} aria-label={label} aria-pressed={active} disabled={disabled} onClick={onClick}>{children}</button>;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false }), Link.configure({ openOnClick: false, autolink: false }), Image.configure({ allowBase64: false })],
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
      editor.chain().setImage({ src: uploaded.url, alt: file.name }).run();
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
        <ToolbarButton label="Вставить изображение" disabled={uploading} onClick={() => fileInputRef.current?.click()}>▧</ToolbarButton>
      </div>
    </div>
    <input ref={fileInputRef} className="rich-editor-file-input" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Выбрать изображение" onChange={(event) => void uploadImage(event)} />
    {uploadError && <p className="rich-editor-upload-error" role="alert">{uploadError}</p>}
    <EditorContent editor={editor} />
  </section>;
}
