import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

type RichTextEditorProps = { value: string; onChange: (html: string) => void };

type ToolbarButtonProps = { label: string; active?: boolean; onClick: () => void; children: string };

function ToolbarButton({ label, active = false, onClick, children }: ToolbarButtonProps) {
  return <button type="button" className={active ? "rich-editor-action active" : "rich-editor-action"} aria-label={label} aria-pressed={active} onClick={onClick}>{children}</button>;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false }), Link.configure({ openOnClick: false, autolink: false })],
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
      </div>
    </div>
    <EditorContent editor={editor} onInput={(event) => {
      editor.commands.setContent(event.currentTarget.innerHTML, { emitUpdate: false });
      onChange(editor.getHTML());
    }} />
  </section>;
}
