<script setup lang="ts">
  interface DashboardData {
    stats: {
      totalItems: number
      checkedOut: number
      damaged: number
      locations: number
    }
    openCheckouts: {
      id: string
      item: { id: string; name: string }
      user: { id: string; name: string }
      checkedOutFromLocation: { id: string; name: string }
      checkedOutAt: string
      daysOut: number
    }[]
    myItems: {
      id: string
      item: { id: string; name: string }
      checkedOutFromLocation: { id: string; name: string }
      checkedOutAt: string
    }[]
  }

  const { data: session } = await authClient.useSession(useFetch)
  const { data: me } = await useFetch('/api/users/me')
  const { data: dashboard, pending } = await useFetch<DashboardData>('/api/dashboard')

  const isAdminOrSupervisor = computed(
    () => session.value?.user?.role === 'admin' || session.value?.user?.role === 'supervisor'
  )

  function daysOutBadgeColor(days: number) {
    if (days <= 7) return 'success' as const
    if (days <= 30) return 'warning' as const
    return 'error' as const
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
      <p class="mt-1 text-gray-500 dark:text-gray-400">
        Welcome back{{ me?.displayName ? `, ${me.displayName}` : '' }}.
      </p>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <UCard v-for="i in 4" :key="i">
        <USkeleton class="h-8 w-16" />
        <USkeleton class="mt-2 h-4 w-24" />
      </UCard>
    </div>

    <template v-else-if="dashboard">
      <!-- Stats -->
      <div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <NuxtLink to="/items">
          <UCard class="transition-shadow hover:shadow-md">
            <div class="flex items-center gap-3">
              <div class="bg-primary-50 dark:bg-primary-950 rounded-lg p-2.5">
                <UIcon name="i-heroicons-cube-20-solid" class="text-primary-500 h-6 w-6" />
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ dashboard.stats.totalItems }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Total Items</p>
              </div>
            </div>
          </UCard>
        </NuxtLink>

        <NuxtLink :to="isAdminOrSupervisor ? '/checkouts' : '/items'">
          <UCard class="transition-shadow hover:shadow-md">
            <div class="flex items-center gap-3">
              <div class="rounded-lg bg-amber-50 p-2.5 dark:bg-amber-950">
                <UIcon
                  name="i-heroicons-arrow-right-circle-20-solid"
                  class="h-6 w-6 text-amber-500"
                />
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ dashboard.stats.checkedOut }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Checked Out</p>
              </div>
            </div>
          </UCard>
        </NuxtLink>

        <NuxtLink to="/items">
          <UCard class="transition-shadow hover:shadow-md">
            <div class="flex items-center gap-3">
              <div class="rounded-lg bg-red-50 p-2.5 dark:bg-red-950">
                <UIcon
                  name="i-heroicons-exclamation-triangle-20-solid"
                  class="h-6 w-6 text-red-500"
                />
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ dashboard.stats.damaged }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Damaged</p>
              </div>
            </div>
          </UCard>
        </NuxtLink>

        <NuxtLink to="/locations">
          <UCard class="transition-shadow hover:shadow-md">
            <div class="flex items-center gap-3">
              <div class="rounded-lg bg-green-50 p-2.5 dark:bg-green-950">
                <UIcon name="i-heroicons-map-pin-20-solid" class="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ dashboard.stats.locations }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Locations</p>
              </div>
            </div>
          </UCard>
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- My Items (all users) -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-cube-20-solid" class="h-5 w-5 text-gray-500" />
              <h2 class="text-base font-semibold text-gray-900 dark:text-white">My Items</h2>
            </div>
          </template>
          <div v-if="!dashboard.myItems.length" class="py-4 text-center text-gray-500">
            You don't have any items checked out.
          </div>
          <div v-else class="space-y-3">
            <NuxtLink
              v-for="checkout in dashboard.myItems"
              :key="checkout.id"
              :to="`/items/${checkout.item.id}`"
              class="block rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <div class="flex items-center justify-between">
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ checkout.item.name }}
                </span>
                <span class="text-xs text-gray-400">
                  {{ formatDate(checkout.checkedOutAt) }}
                </span>
              </div>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                From {{ checkout.checkedOutFromLocation.name }}
              </p>
            </NuxtLink>
          </div>
        </UCard>

        <!-- Open Checkouts (admin/supervisor) -->
        <UCard v-if="isAdminOrSupervisor">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-heroicons-clipboard-document-list-20-solid"
                  class="h-5 w-5 text-gray-500"
                />
                <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                  Recent Open Checkouts
                </h2>
              </div>
              <NuxtLink
                to="/checkouts"
                class="text-primary-500 text-sm font-medium hover:underline"
              >
                View all
              </NuxtLink>
            </div>
          </template>
          <div v-if="!dashboard.openCheckouts.length" class="py-4 text-center text-gray-500">
            No items are currently checked out.
          </div>
          <div v-else class="space-y-3">
            <NuxtLink
              v-for="checkout in dashboard.openCheckouts"
              :key="checkout.id"
              :to="`/items/${checkout.item.id}`"
              class="block rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <div class="flex items-center justify-between">
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ checkout.item.name }}
                </span>
                <UBadge :color="daysOutBadgeColor(checkout.daysOut)" variant="subtle" size="sm">
                  {{ checkout.daysOut }}d
                </UBadge>
              </div>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {{ checkout.user.name }} &mdash; from {{ checkout.checkedOutFromLocation.name }}
              </p>
            </NuxtLink>
          </div>
        </UCard>
      </div>
    </template>
  </UContainer>
</template>
