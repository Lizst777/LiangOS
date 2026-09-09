/** Decode offscreen before replacing live resources. Caller owns bitmap disposal. */
export async function prepareImage(blob, thumbnailTemplate) {
  const url = blob
    ? URL.createObjectURL(blob)
    : new URL("./ocean.png", import.meta.url).href;
  let bitmap;
  try {
    const source = new Image();
    source.src = url;
    await source.decode();
    const factor = Math.min(
      1,
      2400 / Math.max(source.naturalWidth, source.naturalHeight),
    );
    bitmap = await createImageBitmap(source, {
      resizeWidth: Math.round(source.naturalWidth * factor),
      resizeHeight: Math.round(source.naturalHeight * factor),
      resizeQuality: "high",
    });
    const thumbnail = thumbnailTemplate.cloneNode();
    thumbnail.src = url;
    await thumbnail.decode();
    return { bitmap, thumbnail };
  } catch (error) {
    bitmap?.close();
    throw error;
  } finally {
    if (blob) URL.revokeObjectURL(url);
  }
}
