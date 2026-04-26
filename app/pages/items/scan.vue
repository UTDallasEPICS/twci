<script setup lang="ts">
  const route = useRoute()

  useHead({ title: 'Loading item...' })

  const id = route.query.id as string | undefined

  if (id) {
    await navigateTo(`/items/${id}`, { replace: true })
  }
</script>

<template>
  <UContainer v-if="!id" class="py-8">
    <UCard>
      <div class="flex flex-col items-center gap-4 py-8 text-center">
        <UIcon name="i-lucide-scan-line" class="text-red-500" size="48" />
        <h1 class="text-xl font-semibold">Invalid QR Code</h1>
        <p class="text-gray-500">No item ID provided. This QR code may be invalid.</p>
        <UButton to="/items" variant="soft"> Browse Items </UButton>
      </div>
    </UCard>
  </UContainer>
</template>
