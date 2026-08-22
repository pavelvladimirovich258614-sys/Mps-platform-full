import type { FormEventHandler } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const setContent = vi.fn();
const run = vi.fn();
let onEditorUpdate: ((payload: { editor: { getHTML: () => string } }) => void) | undefined;
const chain = {
  focus: () => chain,
  toggleBold: () => chain,
  run,
};

vi.mock("@tiptap/react", () => ({
  EditorContent: ({ onInput }: { onInput?: FormEventHandler<HTMLDivElement> }) => <div aria-label="Текст публикации" contentEditable onInput={onInput} role="textbox" />,
  useEditor: (options: { onUpdate?: (payload: { editor: { getHTML: () => string } }) => void }) => {
    onEditorUpdate = options.onUpdate;
    return {
      chain: () => chain,
      commands: { setContent },
      getHTML: () => "<p><strong>привет мир</strong></p>",
      isActive: () => false,
    };
  },
}));

import { RichTextEditor } from "./RichTextEditor";

describe("RichTextEditor transaction ownership", () => {
  it("does not replace the TipTap document from a bold input containing a space", () => {
    render(<RichTextEditor value="<p></p>" onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Жирный" }));
    const canvas = screen.getByRole("textbox", { name: "Текст публикации" });
    canvas.innerHTML = "<p><strong>привет мир</strong></p>";
    fireEvent.input(canvas);

    expect(setContent).not.toHaveBeenCalled();
  });

  it("emits bold text with spaces through TipTap onUpdate", () => {
    const onChange = vi.fn();
    render(<RichTextEditor value="<p></p>" onChange={onChange} />);

    onEditorUpdate?.({ editor: { getHTML: () => "<p><strong>привет мир</strong></p>" } });

    expect(onChange).toHaveBeenCalledWith("<p><strong>привет мир</strong></p>");
  });
});
