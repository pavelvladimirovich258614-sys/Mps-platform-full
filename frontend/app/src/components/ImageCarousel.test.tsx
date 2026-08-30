import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ImageCarousel, type CarouselImage } from "./ImageCarousel";

describe("ImageCarousel media loading", () => {
  const images: Array<CarouselImage & { srcSet: string; sizes: string }> = [
      {
        src: "/media/one-large.webp",
        alt: "Первый слайд",
        srcSet: "/media/one-thumbnail.webp 320w, /media/one-medium.webp 960w, /media/one-large.webp 1600w",
        sizes: "(max-width: 900px) 100vw, 760px",
      },
      {
        src: "/media/two-large.webp",
        alt: "Второй слайд",
        srcSet: "/media/two-thumbnail.webp 320w, /media/two-medium.webp 960w, /media/two-large.webp 1600w",
        sizes: "(max-width: 900px) 100vw, 760px",
      },
  ];

  it("does not expose an inactive slide until the user selects it", () => {
    const { container } = render(<ImageCarousel images={images} />);

    expect(screen.getByRole("img", { name: "Первый слайд" })).toBeTruthy();
    expect(screen.queryByRole("img", { name: "Второй слайд" })).toBeNull();
    expect(container.innerHTML).not.toContain("two-medium.webp");

    fireEvent.click(screen.getByRole("button", { name: "Следующее изображение" }));

    expect(screen.getByRole("img", { name: "Второй слайд" })).toBeTruthy();
    expect(screen.queryByRole("img", { name: "Первый слайд" })).toBeNull();
    expect(container.innerHTML).not.toContain("one-medium.webp");
  });

  it("exposes responsive sources and async decoding on the active slide", () => {
    render(<ImageCarousel images={images} />);

    const first = screen.getByRole("img", { name: "Первый слайд" });
    expect(first.getAttribute("srcset")).toBe(images[0].srcSet);
    expect(first.getAttribute("sizes")).toBe(images[0].sizes);
    expect(first.getAttribute("decoding")).toBe("async");
  });
});
