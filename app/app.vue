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
            <nav class="hidden items-center gap-1 md:flex">
              <NuxtLink
                to="/locations"
                class="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950"
              >
                Locations
              </NuxtLink>
              <NuxtLink
                to="/users"
                class="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950"
              >
                Users
              </NuxtLink>
            </nav>
          </div>

          <div class="flex items-center gap-2">
            <NuxtLink
              to="/profile"
              class="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950"
            >
              Profile
            </NuxtLink>
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
