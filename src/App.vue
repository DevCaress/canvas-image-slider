<script setup lang="ts">
import { ref } from 'vue'
import CanvasImageSlider from './components/CanvasImageSlider.vue'
import { SLIDER_IMAGE_URLS, resolveImageUrl } from './config/images'

const imageUrls = ref<string[]>([...SLIDER_IMAGE_URLS])
const newUrl = ref('')

function removeImage(index: number) {
  imageUrls.value.splice(index, 1)
}

function addImage() {
  const url = newUrl.value.trim()
  if (!url) return
  imageUrls.value.push(resolveImageUrl(url))
  newUrl.value = ''
}
</script>

<template>
  <div class="app">
    <div class="container">
      <header class="header">
        <h1 class="title">Image Slider</h1>
      </header>
      <main class="main">
        <CanvasImageSlider :image-urls="imageUrls" />
      </main>
      <section class="gallery-ui">
        <div class="thumbnails">
          <div
            v-for="(url, index) in imageUrls"
            :key="index"
            class="thumb"
          >
            <img
              :src="url"
              :alt="`Image ${index + 1}`"
              class="thumb-img"
              loading="lazy"
              @error="($event.target as HTMLImageElement).style.background = '#eee'"
            />
            <button
              type="button"
              class="thumb-remove"
              aria-label="Remove image"
              @click="removeImage(index)"
            >
              ×
            </button>
          </div>
        </div>
        <div class="add-url">
          <input
            v-model="newUrl"
            type="url"
            class="add-input"
            placeholder="Paste image URL and press Enter"
            @keyup.enter="addImage()"
          />
          <button
            type="button"
            class="add-btn"
            @click="addImage()"
          >
            Add
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  font-family: system-ui, -apple-system, sans-serif;
}
#app {
  width: 100%;
  height: 100%;
}
</style>
<style scoped>
.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f5f5f5;
}

.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1200px;
  height: 100%;
  padding: 0 1rem;
  box-sizing: border-box;
}

@media (min-width: 640px) {
  .container {
    padding: 0 1.5rem;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 2rem;
  }
}

.header {
  flex-shrink: 0;
  padding: 1rem 0;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #111;
}

@media (min-width: 640px) {
  .title {
    font-size: 1.75rem;
  }
}

.main {
  flex: 0 0 auto;
  height: 400px;
  overflow: hidden;
  margin-top: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.gallery-ui {
  flex: 0 0 auto;
  padding: 2rem;
  background: #fff;
  border-radius: 8px;
  margin-top: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.thumbnails {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.thumb {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: #f0f0f0;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.thumb-remove:hover {
  background: rgba(0, 0, 0, 0.85);
}

.add-url {
  display: flex;
  gap: 0.5rem;
}

.add-input {
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.9375rem;
}

.add-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.add-btn {
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  background: #3b82f6;
  color: #fff;
  font-size: 0.9375rem;
  cursor: pointer;
}

.add-btn:hover {
  background: #2563eb;
}
</style>
