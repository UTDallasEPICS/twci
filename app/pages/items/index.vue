<script setup lang="ts">
  import { z } from 'zod'
  import type { FormSubmitEvent } from '@nuxt/ui'

  const toast = useToast()

  const { data: session } = await authClient.useSession(useFetch)
  const isAdmin = computed(() => session.value?.user?.role === 'admin')

  // Filters
  const statusFilter = ref<string>('all')
  const conditionFilter = ref<string>('all')
  const locationFilter = ref<string>('all')
  const searchQuery = ref('')
  const debouncedSearch = ref('')

  let searchTimeout: ReturnType<typeof setTimeout>
  watch(searchQuery, (val) => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      debouncedSearch.value = val
    }, 300)
  })

  // Fetch locations for filter dropdown
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
    if (statusFilter.value && statusFilter.value !== 'all') q.status = statusFilter.value
    if (conditionFilter.value && conditionFilter.value !== 'all')
      q.condition = conditionFilter.value
    if (locationFilter.value && locationFilter.value !== 'all') q.locationId = locationFilter.value
    if (debouncedSearch.value) q.search = debouncedSearch.value
    return q
  })

  const {
    data: items,
    pending,
    error,
    refresh,
  } = await useFetch('/api/items', { query: fetchQuery })

  // Condition options for filter
  const conditionOptions = [
    { label: 'All conditions', value: 'all' },
    { label: 'Good', value: 'good' },
    { label: 'Fair', value: 'fair' },
    { label: 'Damaged', value: 'damaged' },
    { label: 'Retired', value: 'retired' },
  ]

  // Create/edit modal
  const isModalOpen = ref(false)
  const isSubmitting = ref(false)
  const editingItemId = ref<string | null>(null)

  const createItemSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    description: z.string().max(1000).optional(),
    condition: z.enum(['good', 'fair', 'damaged', 'retired']),
    locationId: z.string().min(1, 'Location is required'),
  })

  const formState = reactive({
    name: '',
    description: '',
    condition: 'good' as 'good' | 'fair' | 'damaged' | 'retired',
    locationId: '',
  })

  function openCreate() {
    editingItemId.value = null
    formState.name = ''
    formState.description = ''
    formState.condition = 'good'
    formState.locationId = ''
    isModalOpen.value = true
  }

  function openEdit(item: {
    id: string
    name: string
    description: string | null
    condition: string
    homeLocation: { id: string }
  }) {
    editingItemId.value = item.id
    formState.name = item.name
    formState.description = item.description ?? ''
    formState.condition = item.condition as 'good' | 'fair' | 'damaged' | 'retired'
    formState.locationId = item.homeLocation.id
    isModalOpen.value = true
  }

  async function handleSubmit(_event: FormSubmitEvent<Record<string, unknown>>) {
    isSubmitting.value = true
    try {
      if (editingItemId.value) {
        await $fetch(`/api/items/${editingItemId.value}`, {
          method: 'PUT',
          body: {
            name: formState.name,
            description: formState.description || null,
            condition: formState.condition,
            homeLocationId: formState.locationId,
          },
        })
        toast.add({ title: 'Item updated', color: 'success' })
      } else {
        await $fetch('/api/items', {
          method: 'POST',
          body: {
            name: formState.name,
            description: formState.description || null,
            condition: formState.condition,
            locationId: formState.locationId,
          },
        })
        toast.add({ title: 'Item created', color: 'success' })
      }
      isModalOpen.value = false
      await refresh()
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'statusMessage' in err
          ? (err as { statusMessage: string }).statusMessage
          : 'Something went wrong'
      toast.add({ title: 'Error', description: message, color: 'error' })
    } finally {
      isSubmitting.value = false
    }
  }

  function conditionBadgeColor(condition: string) {
    if (condition === 'good') return 'success'
    if (condition === 'fair') return 'warning'
    if (condition === 'damaged') return 'error'
    return 'neutral'
  }

  function statusBadgeColor(status: string) {
    if (status === 'available') return 'success'
    if (status === 'checked_out') return 'warning'
    return 'neutral'
  }

  function statusLabel(status: string) {
    if (status === 'checked_out') return 'checked out'
    return status
  }
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Items</h1>
        <p class="mt-1 text-gray-500 dark:text-gray-400">
          {{ isAdmin ? 'Manage inventory items.' : 'View inventory items.' }}
        </p>
      </div>
      <div v-if="isAdmin" class="flex items-center gap-3">
        <UButton
          color="primary"
          icon="i-heroicons-plus-20-solid"
          label="Add Item"
          @click="openCreate"
        />
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
      <UInput
        v-model="searchQuery"
        icon="i-heroicons-magnifying-glass-20-solid"
        placeholder="Search by name..."
        class="w-full md:w-64"
      />
      <USelect v-model="conditionFilter" :items="conditionOptions" class="w-full md:w-44" />
      <USelect v-model="locationFilter" :items="locationOptions" class="w-full md:w-52" />
      <UButtonGroup>
        <UButton
          :color="statusFilter === 'all' ? 'primary' : 'neutral'"
          :variant="statusFilter === 'all' ? 'solid' : 'outline'"
          label="All"
          @click="statusFilter = 'all'"
        />
        <UButton
          :color="statusFilter === 'available' ? 'primary' : 'neutral'"
          :variant="statusFilter === 'available' ? 'solid' : 'outline'"
          label="Available"
          @click="statusFilter = 'available'"
        />
        <UButton
          :color="statusFilter === 'checked_out' ? 'primary' : 'neutral'"
          :variant="statusFilter === 'checked_out' ? 'solid' : 'outline'"
          label="Checked Out"
          @click="statusFilter = 'checked_out'"
        />
      </UButtonGroup>
    </div>

    <!-- Loading -->
    <UCard v-if="pending">
      <div class="space-y-4">
        <div v-for="i in 5" :key="i" class="flex items-center gap-3 py-2">
          <div class="w-full space-y-2">
            <USkeleton class="h-4 w-1/3" />
            <USkeleton class="h-3 w-1/2" />
          </div>
        </div>
      </div>
    </UCard>

    <!-- Error -->
    <UAlert
      v-else-if="error"
      icon="i-heroicons-exclamation-triangle-20-solid"
      color="error"
      variant="subtle"
      title="Error loading items"
      :description="error.message"
    />

    <!-- Empty -->
    <UCard v-else-if="!items?.length">
      <div class="py-8 text-center text-gray-500">No items found.</div>
    </UCard>

    <!-- Item list -->
    <div v-else class="space-y-3">
      <NuxtLink v-for="item in items" :key="item.id" :to="`/items/${item.id}`" class="block">
        <UCard
          class="transition-shadow hover:shadow-md"
          :class="{ 'opacity-60': item.condition === 'retired' }"
        >
          <div class="flex items-center justify-between">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="truncate font-medium text-gray-900 dark:text-white">{{ item.name }}</p>
                <UBadge :color="conditionBadgeColor(item.condition)" variant="subtle" size="sm">
                  {{ item.condition }}
                </UBadge>
                <UBadge :color="statusBadgeColor(item.status)" variant="subtle" size="sm">
                  {{ statusLabel(item.status) }}
                </UBadge>
              </div>
              <p
                v-if="item.description"
                class="mt-1 truncate text-sm text-gray-500 dark:text-gray-400"
              >
                {{ item.description }}
              </p>
              <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {{ item.currentLocation.name }}
              </p>
            </div>
            <div v-if="isAdmin" class="ml-4 flex shrink-0 items-center gap-2">
              <UButton
                variant="ghost"
                color="neutral"
                icon="i-heroicons-pencil-square-20-solid"
                size="sm"
                @click.prevent="openEdit(item)"
              />
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <!-- Create/Edit Modal -->
    <UModal v-model:open="isModalOpen">
      <template #content>
        <div class="p-6">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {{ editingItemId ? 'Edit Item' : 'Add Item' }}
          </h3>
          <UForm
            :schema="createItemSchema"
            :state="formState"
            class="space-y-4"
            @submit="handleSubmit"
          >
            <UFormField label="Name" name="name" required>
              <UInput v-model="formState.name" class="w-full" placeholder="e.g., iPad Pro #3" />
            </UFormField>
            <UFormField label="Description" name="description">
              <UTextarea
                v-model="formState.description"
                class="w-full"
                placeholder="Optional details..."
                :rows="3"
              />
            </UFormField>
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Condition" name="condition">
                <USelect
                  v-model="formState.condition"
                  :items="[
                    { label: 'Good', value: 'good' },
                    { label: 'Fair', value: 'fair' },
                    { label: 'Damaged', value: 'damaged' },
                    { label: 'Retired', value: 'retired' },
                  ]"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Location" name="locationId" required>
                <USelect
                  v-model="formState.locationId"
                  :items="locations?.map((loc) => ({ label: loc.name, value: loc.id })) ?? []"
                  class="w-full"
                  placeholder="Select location"
                />
              </UFormField>
            </div>
            <div class="flex justify-end gap-2">
              <UButton variant="soft" color="neutral" @click="isModalOpen = false">Cancel</UButton>
              <UButton type="submit" color="primary" :loading="isSubmitting">
                {{ editingItemId ? 'Save' : 'Create' }}
              </UButton>
            </div>
          </UForm>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
