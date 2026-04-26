<script setup lang="ts">
  const { data: session } = await authClient.useSession(useFetch)
  const { data: me } = await useFetch('/api/users/me')

  const isAdminOrSupervisor = computed(
    () => session.value?.user?.role === 'admin' || session.value?.user?.role === 'supervisor'
  )
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
      <p class="mt-1 text-gray-500 dark:text-gray-400">
        Welcome back{{ me?.displayName ? `, ${me.displayName}` : '' }}.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NuxtLink to="/locations">
        <UCard class="transition-shadow hover:shadow-md">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-map-pin-20-solid" class="text-primary-500 h-8 w-8" />
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">Locations</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">View equipment locations</p>
            </div>
          </div>
        </UCard>
      </NuxtLink>

      <NuxtLink v-if="isAdminOrSupervisor" to="/users">
        <UCard class="transition-shadow hover:shadow-md">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-users-20-solid" class="text-primary-500 h-8 w-8" />
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">Users</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Manage team members</p>
            </div>
          </div>
        </UCard>
      </NuxtLink>

      <NuxtLink to="/profile">
        <UCard class="transition-shadow hover:shadow-md">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-user-circle-20-solid" class="text-primary-500 h-8 w-8" />
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">Profile</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">View your account</p>
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>
  </UContainer>
</template>
