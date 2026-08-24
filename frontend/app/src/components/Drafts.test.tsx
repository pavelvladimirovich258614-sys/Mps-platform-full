import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Drafts } from "./Drafts";

const draft = { id: 24, title: "Черновик Бали", updated_at: "2026-08-24T08:00:00+00:00" };

describe("Drafts", () => {
  it("shows a delete control on every draft card", () => {
    render(<Drafts drafts={[draft]} loading={false} onOpen={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Удалить черновик: Черновик Бали" })).toBeTruthy();
  });

  it("does not delete before the editor confirms", () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<Drafts drafts={[draft]} loading={false} onOpen={vi.fn()} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: "Удалить черновик: Черновик Бали" }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Удалить черновик" })).toBeTruthy();
  });

  it("deletes the draft only after confirmation", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<Drafts drafts={[draft]} loading={false} onOpen={vi.fn()} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: "Удалить черновик: Черновик Бали" }));
    fireEvent.click(screen.getByRole("button", { name: "Подтвердить удаление" }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(draft));
  });
});
