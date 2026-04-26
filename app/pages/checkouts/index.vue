<script setup lang="ts">
  interface OpenCheckout {
    id: string
    item: { id: string; name: string; condition: string }
    user: { id: string; name: string }
    checkedOutBy: { id: string; name: string }
    checkedOutFromLocation: { id: string; name: string }
    checkedOutAt: string
    daysOut: number
  }

  interface OpenCheckoutsResponse {
    checkouts: OpenCheckout[]
    total: number
  }

  const { data: session } = await authClient.useSession(useFetch)
  const userRole = computed(() => session.value?.user?.role)

  // Redirect non-admin/supervisor to home
  if (userRole.value !== 'admin' && userRole.value !== 'supervisor') {
    await navigateTo('/')
  }

  // Filters
  const locationFilter = ref<string>('all')

  const { data: locations } = await useFetch('/api/locations')

  const locationOptions = computed(() => {
    const opts = [{ label: 'All locations', value: 'all' }]
    if (locations.value) {
      for (const loc of locations.value) {
        opts.push({ label: loc.name, value: loc.id })
      }
    }
    return opts
  })

  const fetchQuery = computed(() => {
    const q: Record<string, string> = {}
    if (locationFilter.value && locationFilter.value !== 'all') q.locationId = locationFilter.value
    return q
  })

  const { data, pending, error } = await useFetch<OpenCheckoutsResponse>('/api/checkouts/open', {
    query: fetchQuery,
  })

  const checkouts = computed(() => data.value?.checkouts ?? [])
  const total = computed(() => data.value?.total ?? 0)

  function daysOutBadgeColor(days: number) {
    if (days <= 7) return 'success' as const
    if (days <= 30) return 'warning' as const
    return 'error' as const
  }

  function conditionBadgeColor(condition: string) {
    if (condition === 'good') return 'success' as const
    if (condition === 'fair') return 'warning' as const
    if (condition === 'damaged') return 'error' as const
    return 'neutral' as const
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Open Checkouts
        </h1>
        <p class="mt-1 text-gray-500 dark:text-gray-400">
          Currently checked-out items across all locations.
        </p>
      </div>
      <div v-if="total > 0" class="text-sm text-gray-500 dark:text-gray-400">
        {{ total }} item{{ total === 1 ? '' : 's' }} checked out
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
      <USelect v-model="locationFilter" :items="locationOptions" class="w-full md:w-52" />
    </div>

    <!-- Loading -->
    <UCard v-if="pending">
      <div class="space-y-3">
        <USkeleton class="h-16 w-full" />
        <USkeleton class="h-16 w-full" />
        <USkeleton class="h-16 w-full" />
      </div>
    </UCard>

    <!-- Error -->
    <UAlert
      v-else-if="error"
      icon="i-heroicons-exclamation-triangle-20-solid"
      color="error"
      variant="subtle"
      title="Error loading checkouts"
      :description="error.message"
    />

    <!-- Empty -->
    <UCard v-else-if="!checkouts.length">
      <div class="py-12 text-center">
        <UIcon
          name="i-heroicons-check-circle-20-solid"
          class="mx-auto mb-4 h-12 w-12 text-green-400"
        />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">All clear</h3>
        <p class="mt-1 text-gray-500 dark:text-gray-400">No items are currently checked out.</p>
      </div>
    </UCard>

    <!-- Checkout list -->
    <div v-else class="space-y-3">
      <NuxtLink
        v-for="checkout in checkouts"
        :key="checkout.id"
        :to="`/items/${checkout.item.id}`"
        class="block"
      >
        <UCard class="transition-shadow hover:shadow-md">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="truncate font-medium text-gray-900 dark:text-white">
                  {{ checkout.item.name }}
                </span>
                <UBadge
                  :color="conditionBadgeColor(checkout.item.condition)"
                  variant="subtle"
                  size="sm"
                >
                  {{ checkout.item.condition }}
                </UBadge>
              </div>
              <div class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Held by
                <span class="font-medium text-gray-700 dark:text-gray-300">
                  {{ checkout.user.name }}
                </span>
                &mdash; checked out by {{ checkout.checkedOutBy.name }} from
                {{ checkout.checkedOutFromLocation.name }}
              </div>
              <div class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {{ formatDate(checkout.checkedOutAt) }}
              </div>
            </div>
            <div class="flex items-center gap-2 md:flex-shrink-0">
              <UBadge :color="daysOutBadgeColor(checkout.daysOut)" variant="subtle" size="sm">
                {{ checkout.daysOut }} day{{ checkout.daysOut === 1 ? '' : 's' }} out
              </UBadge>
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>
  </UContainer>
</template>
