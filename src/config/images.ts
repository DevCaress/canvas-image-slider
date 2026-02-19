const BASE_URL = import.meta.env.BASE_URL ?? '/'

export function resolveImageUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return BASE_URL + path.replace(/^\//, '')
}

export const SLIDER_IMAGE_PATHS: string[] = [
  '/images/0.jpg',
  '/images/1.jpg',
  '/images/2.jpg',
  '/images/3.jpg',
]

export const SLIDER_IMAGE_URLS: string[] = SLIDER_IMAGE_PATHS.map(resolveImageUrl)
