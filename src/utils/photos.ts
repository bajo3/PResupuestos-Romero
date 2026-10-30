/** Achica y comprime una foto (JPEG) para guardarla dentro del registro sin pesar de más. */
export async function compressPhoto(file: File, maxSide = 1000, quality = 0.7): Promise<string> {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer la imagen'))
    reader.readAsDataURL(file)
  })
  const image = new Image()
  image.src = source
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('El archivo no es una imagen válida'))
  })
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) return source
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', quality)
}
