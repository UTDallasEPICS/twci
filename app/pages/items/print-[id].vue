<script setup lang="ts">
  import type { LabelSize } from '~/composables/usePrintLabels'
  import { labelSizes, labelSizeOptions } from '~/composables/usePrintLabels'

  definePageMeta({ layout: false })

  const route = useRoute()
  const id = route.params.id as string

  const sizeParam = (route.query.size as string) || 'medium'
  const selectedSize = ref<LabelSize>(sizeParam in labelSizes ? (sizeParam as LabelSize) : 'medium')

  const { data: item, error } = await useFetch<{ name: string }>(`/api/items/${id}`, {
    pick: ['name'],
  })

  function triggerPrint() {
    window.print()
  }

  onMounted(() => {
    nextTick(() => {
      triggerPrint()
    })
  })
</script>

<template>
  <div>
    <!-- Screen controls -->
    <div class="print-controls mx-auto max-w-md px-4 py-8">
      <NuxtLink
        :to="`/items/${id}`"
        class="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        &larr; Back to item
      </NuxtLink>

      <h1 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">Print QR Label</h1>

      <div v-if="error" class="mb-4 text-red-600">Item not found.</div>

      <template v-else-if="item">
        <div class="mb-4">
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Label Size
          </label>
          <select
            v-model="selectedSize"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            <option v-for="opt in labelSizeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <p class="mb-4 text-sm text-gray-500">
          Preview at actual size ({{ labelSizes[selectedSize].inches }}" &times;
          {{ labelSizes[selectedSize].inches }}"):
        </p>

        <!-- Label preview -->
        <div class="mb-6 inline-block border border-dashed border-gray-300 dark:border-gray-600">
          <PrintLabel :item-id="id" :item-name="item.name" :size="selectedSize" />
        </div>

        <div>
          <button
            class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            @click="triggerPrint"
          >
            Print
          </button>
        </div>
      </template>
    </div>

    <!-- Print output -->
    <div class="print-page hidden print:block">
      <PrintLabel v-if="item" :item-id="id" :item-name="item.name" :size="selectedSize" />
    </div>
  </div>
</template>

<style scoped>
  @media print {
    @page {
      margin: 0;
    }
  }
</style>
