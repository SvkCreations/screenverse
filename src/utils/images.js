// OMDb posters are small (300px wide). Amazon image URLs accept a larger size in the URL.
export function bigPoster(url) {
  if (!url) return null
  return url.replace(/_SX\d+/, '_SX1000')
}
