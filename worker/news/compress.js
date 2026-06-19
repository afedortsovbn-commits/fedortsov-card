// Сжатие JPEG в воркере через Photon (WASM). В рантайме Cloudflare нет canvas,
// поэтому ресайз/перекодирование делаем этой библиотекой. Любой сбой не критичен
// — вызывающий код откатывается на оригинал.

import { PhotonImage, resize, SamplingFilter } from '@cf-wasm/photon'

// bytes: ArrayBuffer | Uint8Array. Возвращает Uint8Array (JPEG).
export function compressImage(bytes, options = {}) {
  const { maxWidth = 800, quality = 72 } = options
  let img
  let resized
  try {
    img = PhotonImage.new_from_byteslice(new Uint8Array(bytes))
    const width = img.get_width()
    const height = img.get_height()
    if (width <= maxWidth) {
      return img.get_bytes_jpeg(quality)
    }
    const targetHeight = Math.round((height * maxWidth) / width)
    resized = resize(img, maxWidth, targetHeight, SamplingFilter.Lanczos3)
    return resized.get_bytes_jpeg(quality)
  } finally {
    img?.free?.()
    resized?.free?.()
  }
}
