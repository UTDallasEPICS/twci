<script setup lang="ts">
  const colorMode = useColorMode()
  const route = useRoute()

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
  const _isAdmin = computed(() => session.value?.user?.role === 'admin')

  const navLinks = computed(() => {
    if (!isLoggedIn.value) return []
    const links = [
      { to: '/', label: 'Dashboard', icon: 'i-heroicons-home-20-solid' },
      { to: '/locations', label: 'Locations', icon: 'i-heroicons-map-pin-20-solid' },
    ]
    return links
  })

  function isActive(path: string) {
    if (path === '/') return route.path === '/'
    return route.path.startsWith(path)
  }
</script>

<template>
  <UApp>
    <div
      class="flex min-h-screen flex-col bg-white text-gray-900 transition-colors duration-300 dark:bg-gray-900 dark:text-gray-100"
    >
      <header
        class="sticky top-0 z-50 border-b border-gray-200 bg-white/75 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/75"
      >
        <UContainer class="flex h-16 items-center justify-between">
          <div class="flex items-center gap-6">
            <NuxtLink to="/" class="flex items-center gap-2 text-xl font-bold">
              <UIcon name="i-heroicons-cube-transparent" class="text-primary-500 h-8 w-8" />
              <span>TWC Inventory</span>
            </NuxtLink>

            <nav v-if="isLoggedIn" class="hidden items-center gap-1 md:flex">
              <NuxtLink
                v-for="link in navLinks"
                :key="link.to"
                :to="link.to"
                class="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors"
                :class="
                  isActive(link.to)
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                "
              >
                <UIcon :name="link.icon" class="h-4 w-4" />
                {{ link.label }}
              </NuxtLink>
            </nav>
          </div>

          <div class="flex items-center gap-2">
            <UButton
              :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
              color="neutral"
              variant="ghost"
              aria-label="Toggle Theme"
              @click="isDark = !isDark"
            />
          </div>
        </UContainer>
      </header>

      <main class="flex-1">
        <NuxtPage />
      </main>
    </div>
  </UApp>
</template>
