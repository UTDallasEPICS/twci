<script setup lang="ts">
  import type { LabelSize } from '~/composables/usePrintLabels'
  import { labelSizes } from '~/composables/usePrintLabels'

  const props = defineProps<{
    itemId: string
    itemName: string
    size: LabelSize
  }>()

  const emit = defineEmits<{ loaded: [] }>()

  const config = computed(() => labelSizes[props.size])
  const shortId = computed(() => props.itemId.slice(0, 8))
</script>

<template>
  <div
    class="print-label flex flex-col items-center justify-center"
    :style="{
      width: config.inches + 'in',
      height: config.inches + 'in',
    }"
  >
    <!-- eslint-disable-next-line vue/html-self-closing -->
    <img
      :src="`/api/items/${itemId}/qr?size=${config.qrPx}`"
      alt="QR Code"
      class="max-h-[70%] max-w-[80%]"
      @load="emit('loaded')"
    />
    <p
      class="mt-0.5 max-w-[90%] truncate text-center"
      :style="{ fontSize: config.inches <= 1 ? '6pt' : '8pt' }"
    >
      {{ itemName }}
    </p>
    <p class="font-mono text-[#666]" :style="{ fontSize: config.inches <= 1 ? '5pt' : '6pt' }">
      {{ shortId }}
    </p>
  </div>
</template>
