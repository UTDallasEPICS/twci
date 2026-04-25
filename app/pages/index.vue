<script setup lang="ts">
  import { authClient } from '../utils/auth-client'

  const { data: session } = await authClient.useSession(useFetch)
  const user = computed(() => session.value?.user as Record<string, unknown> | undefined)
  const userRole = computed(() => user.value?.role as string)
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
      <p class="mt-1 text-gray-500 dark:text-gray-400">Welcome back, {{ user?.name || 'User' }}.</p>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NuxtLink to="/profile">
        <UCard class="transition-shadow hover:shadow-md">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-user-circle-20-solid" class="text-primary-500 h-8 w-8" />
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">My Profile</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">View your profile and history</p>
            </div>
          </div>
        </UCard>
      </NuxtLink>

      <NuxtLink v-if="userRole === 'admin' || userRole === 'supervisor'" to="/users">
        <UCard class="transition-shadow hover:shadow-md">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-users-20-solid" class="text-primary-500 h-8 w-8" />
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">Users</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Manage user accounts</p>
            </div>
          </div>
        </UCard>
      </NuxtLink>

      <NuxtLink to="/locations">
        <UCard class="transition-shadow hover:shadow-md">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-map-pin-20-solid" class="text-primary-500 h-8 w-8" />
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">Locations</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">View and manage locations</p>
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>
  </UContainer>
</template>
