<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = withDefaults(
  defineProps<{ imageUrls: string[] }>(),
  { imageUrls: () => [] }
)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const wrapperRef = ref<HTMLDivElement | null>(null)

const loadedImages = ref<(HTMLImageElement | null)[]>([])
const currentIndex = ref(0)
const dragOffsetPx = ref(0)
const isDragging = ref(false)
const pointerStartX = ref(0)
const dragStartOffset = ref(0)
const canvasWidth = ref(0)
const canvasHeight = ref(0)
const dpr = ref(1)
let rafId = 0
let resizeObserver: ResizeObserver | null = null

const imageCount = computed(() => props.imageUrls.length)

function loadImages(): Promise<void> {
  const urls = props.imageUrls
  if (urls.length === 0) {
    loadedImages.value = []
    draw()
    return Promise.resolve()
  }
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.onerror = () => reject(new Error(`Failed to load ${url}`))
          img.src = url
        })
    )
  ).then((imgs) => {
    loadedImages.value = imgs
  })
}

function getContainRect(
  imgWidth: number,
  imgHeight: number,
  viewWidth: number,
  viewHeight: number
): { dx: number; dy: number; dw: number; dh: number } {
  const scale = Math.min(viewWidth / imgWidth, viewHeight / imgHeight)
  const dw = imgWidth * scale
  const dh = imgHeight * scale
  const dx = (viewWidth - dw) / 2
  const dy = (viewHeight - dh) / 2
  return { dx, dy, dw, dh }
}

function draw() {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return

  const w = canvasWidth.value
  const h = canvasHeight.value
  if (w <= 0 || h <= 0) return

  const scale = dpr.value
  ctx.save()
  ctx.scale(scale, scale)
  ctx.clearRect(0, 0, w, h)

  if (loadedImages.value.length === 0) {
    ctx.restore()
    return
  }

  const offset = dragOffsetPx.value
  const idx = currentIndex.value

  const drawImageAt = (image: HTMLImageElement, xOffset: number) => {
    const rect = getContainRect(image.naturalWidth, image.naturalHeight, w, h)
    ctx.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
      rect.dx + xOffset,
      rect.dy,
      rect.dw,
      rect.dh
    )
  }

  if (offset < 0) {
    if (loadedImages.value[idx]) {
      drawImageAt(loadedImages.value[idx]!, offset)
    }
    const nextIdx = idx + 1
    if (nextIdx < imageCount.value && loadedImages.value[nextIdx]) {
      drawImageAt(loadedImages.value[nextIdx]!, offset + w)
    }
  } else if (offset > 0) {
    const prevIdx = idx - 1
    if (prevIdx >= 0 && loadedImages.value[prevIdx]) {
      drawImageAt(loadedImages.value[prevIdx]!, offset - w)
    }
    if (loadedImages.value[idx]) {
      drawImageAt(loadedImages.value[idx]!, offset)
    }
  } else {
    if (loadedImages.value[idx]) {
      drawImageAt(loadedImages.value[idx]!, 0)
    }
  }

  ctx.restore()
}

function resizeCanvas() {
  const canvas = canvasRef.value
  const wrapper = wrapperRef.value
  if (!canvas || !wrapper) return

  const rect = wrapper.getBoundingClientRect()
  const w = Math.floor(rect.width)
  const h = Math.floor(rect.height)
  const scale = window.devicePixelRatio || 1

  canvasWidth.value = w
  canvasHeight.value = h
  dpr.value = scale
  canvas.width = w * scale
  canvas.height = h * scale
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  draw()
}

function clampOffset(rawOffset: number): number {
  const w = canvasWidth.value
  const maxOver = w * 0.3
  if (currentIndex.value <= 0 && rawOffset > 0) {
    return Math.min(rawOffset, maxOver)
  }
  if (currentIndex.value >= imageCount.value - 1 && rawOffset < 0) {
    return Math.max(rawOffset, -maxOver)
  }
  return rawOffset
}

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  isDragging.value = true
  pointerStartX.value = e.clientX
  dragStartOffset.value = dragOffsetPx.value
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  draw()
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  const delta = e.clientX - pointerStartX.value
  dragOffsetPx.value = clampOffset(dragStartOffset.value + delta)
  draw()
}

function onPointerUp(e: PointerEvent) {
  if (e.button !== 0) return
  ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  isDragging.value = false

  const w = canvasWidth.value
  const threshold = w * 0.25
  const offset = dragOffsetPx.value

  if (offset < -threshold && currentIndex.value < imageCount.value - 1) {
    currentIndex.value += 1
    dragOffsetPx.value = offset + w
  } else if (offset > threshold && currentIndex.value > 0) {
    currentIndex.value -= 1
    dragOffsetPx.value = offset - w
  }

  snapAnimation()
}

function onPointerCancel(e: PointerEvent) {
  isDragging.value = false
  ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  snapAnimation()
}

const SNAP_SPEED = 0.2
const SNAP_EPS = 0.5

function snapAnimation() {
  const step = () => {
    const o = dragOffsetPx.value
    if (Math.abs(o) < SNAP_EPS) {
      dragOffsetPx.value = 0
      draw()
      return
    }
    dragOffsetPx.value = o * (1 - SNAP_SPEED)
    draw()
    rafId = requestAnimationFrame(step)
  }
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(step)
}

async function initSlider() {
  await loadImages()
  currentIndex.value = Math.min(currentIndex.value, Math.max(0, imageCount.value - 1))
  dragOffsetPx.value = 0
  resizeCanvas()
  draw()
}

onMounted(async () => {
  await initSlider()
  resizeObserver = new ResizeObserver(() => resizeCanvas())
  if (wrapperRef.value) resizeObserver.observe(wrapperRef.value)

  const canvas = canvasRef.value
  if (canvas) {
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerCancel)
  }
})

watch(
  () => props.imageUrls,
  () => initSlider(),
  { deep: true }
)

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  resizeObserver?.disconnect()
  const canvas = canvasRef.value
  if (canvas) {
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointercancel', onPointerCancel)
  }
})

watch([currentIndex, dragOffsetPx], () => draw(), { flush: 'post' })
</script>

<template>
  <div
    ref="wrapperRef"
    class="slider-wrapper"
    style="touch-action: none"
  >
    <canvas ref="canvasRef" class="slider-canvas" />
  </div>
</template>

<style scoped>
.slider-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  cursor: grab;
  user-select: none;
}

.slider-wrapper:active {
  cursor: grabbing;
}

.slider-canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}
</style>
