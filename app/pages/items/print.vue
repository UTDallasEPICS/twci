<script setup lang="ts">
  import type { LabelSize } from '~/composables/usePrintLabels'
  import { labelSizes, labelSizeOptions, pageCount } from '~/composables/usePrintLabels'

  definePageMeta({ layout: false })

  const route = useRoute()

  const idsParam = (route.query.ids as string) || ''
  const selectedIds = idsParam.split(',').filter(Boolean)

  const sizeParam = (route.query.size as string) || 'medium'
  const selectedSize = ref<LabelSize>(sizeParam in labelSizes ? (sizeParam as LabelSize) : 'medium')

  const config = computed(() => labelSizes[selectedSize.value])
  const pages = computed(() => pageCount(selectedIds.length, selectedSize.value))

  // Fetch all items and filter to selected IDs
  const { data: allItems } = await useFetch<{ id: string; name: string }[]>('/api/items')

  const items = computed(() => {
    if (!allItems.value) return []
    const idSet = new Set(selectedIds)
    return allItems.value.filter((item) => idSet.has(item.id))
  })

  // Track image loading for auto-print
  const loadedCount = ref(0)
  const allLoaded = computed(() => loadedCount.value >= items.value.length)

  function onImageLoad() {
    loadedCount.value++
  }

  function triggerPrint() {
    window.print()
  }

  // Auto-print once all images loaded
  watch(allLoaded, (loaded) => {
    if (loaded && items.value.length > 0) {
      nextTick(() => {
        triggerPrint()
      })
    }
  })

  // Group items into pages
  const pagedItems = computed(() => {
    const perPage = config.value.perPage
    const result: { id: string; name: string }[][] = []
    for (let i = 0; i < items.value.length; i += perPage) {
      result.push(items.value.slice(i, i + perPage))
    }
    return result
  })
</script>

<template>
  <div>
    <!-- Screen controls -->
    <div class="print-controls mx-auto max-w-2xl px-4 py-8">
      <NuxtLink
        to="/items"
        class="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        &larr; Back to items
      </NuxtLink>

      <h1 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">Batch Print Labels</h1>

      <div v-if="!selectedIds.length" class="text-red-600">No items selected.</div>

      <template v-else>
        <div class="mb-4 flex flex-wrap items-center gap-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Label Size
            </label>
            <select
              v-model="selectedSize"
              class="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            >
              <option v-for="opt in labelSizeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            {{ items.length }} labels &middot; {{ pages }}
            {{ pages === 1 ? 'page' : 'pages' }}
          </div>
          <button
            class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            :disabled="!allLoaded"
            @click="triggerPrint"
          >
            {{ allLoaded ? 'Print' : 'Loading...' }}
          </button>
        </div>

        <!-- Screen preview -->
        <p class="mb-3 text-sm text-gray-500">
          Preview ({{ config.cols }} &times; {{ config.rows }} per page):
        </p>
        <div class="overflow-auto border border-dashed border-gray-300 p-2 dark:border-gray-600">
          <div
            class="grid gap-0"
            :style="{
              gridTemplateColumns: `repeat(${config.cols}, ${config.inches}in)`,
            }"
          >
            <div v-for="item in items" :key="item.id" class="border border-dotted border-gray-200">
              <PrintLabel :item-id="item.id" :item-name="item.name" :size="selectedSize" />
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Print output -->
    <div class="print-page hidden print:block">
      <div
        v-for="(page, pageIndex) in pagedItems"
        :key="pageIndex"
        :class="{ 'print-page-break': pageIndex < pagedItems.length - 1 }"
      >
        <div
          class="grid gap-0"
          :style="{
            gridTemplateColumns: `repeat(${config.cols}, ${config.inches}in)`,
            gridAutoRows: config.inches + 'in',
          }"
        >
          <PrintLabel
            v-for="item in page"
            :key="item.id"
            :item-id="item.id"
            :item-name="item.name"
            :size="selectedSize"
            @loaded="onImageLoad"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  @media print {
    @page {
      size: letter;
      margin: 0.25in;
    }
  }
</style>
