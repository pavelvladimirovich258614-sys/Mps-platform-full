import { useState } from "react";

export type CarouselImage = { src: string; alt: string };

type ImageCarouselProps = { images: CarouselImage[] };

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];
  const previous = () => setActiveIndex((index) => (index - 1 + images.length) % images.length);
  const next = () => setActiveIndex((index) => (index + 1) % images.length);

  return <section className="image-carousel" role="region" aria-label="Карусель изображений">
    <div className="image-carousel-stage">
      <img src={activeImage.src} alt={activeImage.alt} />
      <button type="button" className="image-carousel-arrow image-carousel-previous" aria-label="Предыдущее изображение" onClick={previous}>‹</button>
      <button type="button" className="image-carousel-arrow image-carousel-next" aria-label="Следующее изображение" onClick={next}>›</button>
    </div>
    <div className="image-carousel-dots" role="group" aria-label="Выбор изображения">
      {images.map((image, index) => <button key={image.src} type="button" aria-label={`Слайд ${index + 1}`} aria-current={index === activeIndex ? "true" : undefined} onClick={() => setActiveIndex(index)} />)}
    </div>
  </section>;
}
