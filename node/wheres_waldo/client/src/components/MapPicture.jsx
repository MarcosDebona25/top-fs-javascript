import { mapPlaceholder, mapSrcSet } from '../lib/maps.js';

// A scene at the widths the build generated, AVIF first, WebP as the fallback.
export function MapPicture({ slug, alt, sizes, width, height, className, imgClassName, eager = false, style, imgStyle, widths }) {
  return (
    <picture className={className} style={style}>
      <source type="image/avif" srcSet={mapSrcSet(slug, 'avif', widths)} sizes={sizes} />
      <source type="image/webp" srcSet={mapSrcSet(slug, 'webp', widths)} sizes={sizes} />
      <img
        src={`/img/maps/${slug}-1024.webp`}
        alt={alt}
        width={width}
        height={height}
        className={imgClassName}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        style={{ backgroundImage: `url(${mapPlaceholder(slug)})`, backgroundSize: 'cover', ...imgStyle }}
      />
    </picture>
  );
}
