<script setup lang="ts">
  const colorMode = useColorMode()

  const isDark = computed({
    get() {
      return colorMode.value === 'dark'
    },
    set() {
      colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
    },
  })

  const { data: session } = await authClient.useSession(useFetch)
  const isLoggedIn = computed(() => !!session.value)
  const userRole = computed(() => session.value?.user?.role)

  const navItems = computed(() => {
    if (!isLoggedIn.value) return []
    const items = [
      { to: '/locations', label: 'Locations', icon: 'i-heroicons-map-pin-20-solid' },
      { to: '/items', label: 'Items', icon: 'i-heroicons-cube-20-solid' },
    ]
    if (userRole.value === 'admin' || userRole.value === 'supervisor') {
      items.push({
        to: '/checkouts',
        label: 'Checkouts',
        icon: 'i-heroicons-clipboard-document-list-20-solid',
      })
      items.push({ to: '/users', label: 'Users', icon: 'i-heroicons-users-20-solid' })
    }
    items.push({ to: '/profile', label: 'Profile', icon: 'i-heroicons-user-circle-20-solid' })
    return items
  })
</script>

<template>
  <UApp>
    <div
      class="flex min-h-screen flex-col bg-white text-gray-900 transition-colors duration-300 dark:bg-gray-900 dark:text-gray-100"
    >
      <UHeader title="TWC Inventory" to="/" mode="slideover">
        <template #title>
          <UIcon name="i-heroicons-cube-transparent" class="text-primary-500 h-7 w-7" />
          <span>TWC Inventory</span>
        </template>

        <!-- Desktop nav (center slot, visible lg+) -->
        <UNavigationMenu v-if="isLoggedIn" :items="navItems" highlight />

        <!-- Right side (theme toggle) -->
        <template #right>
          <UButton
            :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
            color="neutral"
            variant="ghost"
            aria-label="Toggle Theme"
            @click="isDark = !isDark"
          />
        </template>

        <!-- Mobile menu (inside slideover) -->
        <template #body>
          <UNavigationMenu
            v-if="isLoggedIn"
            :items="navItems"
            orientation="vertical"
            class="-mx-2.5"
          />
        </template>
      </UHeader>

      <main class="flex-1">
        <NuxtPage />
      </main>
    </div>
  </UApp>
</template>
