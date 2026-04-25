<script setup lang="ts">
  import { z } from 'zod'
  import type { FormSubmitEvent } from '@nuxt/ui'

  const toast = useToast()

  // Auth state
  const { data: session } = await authClient.useSession(useFetch)
  const isAdmin = computed(() => session.value?.user?.role === 'admin')

  // Status filter (admin only)
  const statusFilter = ref<'active' | 'inactive'>('active')

  // Fetch locations
  const {
    data: locations,
    pending,
    error,
    refresh,
  } = await useFetch('/api/locations', {
    query: computed(() => (isAdmin.value ? { status: statusFilter.value } : {})),
  })

  // Create/edit modal
  const isModalOpen = ref(false)
  const editingLocation = ref<{ id: string; name: string; address: string | null } | null>(null)

  const locationSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    address: z.string().max(500).optional(),
  })

  const formState = reactive({
    name: '',
    address: '',
  })

  function openCreate() {
    editingLocation.value = null
    formState.name = ''
    formState.address = ''
    isModalOpen.value = true
  }

  function openEdit(loc: { id: string; name: string; address: string | null }) {
    editingLocation.value = loc
    formState.name = loc.name
    formState.address = loc.address ?? ''
    isModalOpen.value = true
  }

  async function handleSubmit(_event: FormSubmitEvent<Record<string, unknown>>) {
    try {
      if (editingLocation.value) {
        await $fetch(`/api/locations/${editingLocation.value.id}`, {
          method: 'PUT',
          body: { name: formState.name, address: formState.address || undefined },
        })
        toast.add({ title: 'Location updated', color: 'success' })
      } else {
        await $fetch('/api/locations', {
          method: 'POST',
          body: { name: formState.name, address: formState.address || undefined },
        })
        toast.add({ title: 'Location created', color: 'success' })
      }
      isModalOpen.value = false
      await refresh()
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'statusMessage' in err
          ? (err as { statusMessage: string }).statusMessage
          : 'Something went wrong'
      toast.add({ title: 'Error', description: message, color: 'error' })
    }
  }

  // Deactivate / reactivate
  async function toggleStatus(loc: { id: string; name: string; status: string }) {
    const newStatus = loc.status === 'active' ? 'inactive' : 'active'
    const action = newStatus === 'inactive' ? 'deactivate' : 'reactivate'
    try {
      await $fetch(`/api/locations/${loc.id}`, {
        method: 'PUT',
        body: { status: newStatus },
      })
      toast.add({
        title: `Location ${action}d`,
        description: loc.name,
        color: 'success',
      })
      await refresh()
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'statusMessage' in err
          ? (err as { statusMessage: string }).statusMessage
          : `Failed to ${action} location`
      toast.add({ title: 'Error', description: message, color: 'error' })
    }
  }
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Locations</h1>
        <p class="mt-1 text-gray-500 dark:text-gray-400">
          {{ isAdmin ? 'Manage locations where equipment is stored.' : 'Equipment locations.' }}
        </p>
      </div>
      <div v-if="isAdmin" class="flex items-center gap-3">
        <UButtonGroup>
          <UButton
            :color="statusFilter === 'active' ? 'primary' : 'neutral'"
            :variant="statusFilter === 'active' ? 'solid' : 'outline'"
            label="Active"
            @click="statusFilter = 'active'"
          />
          <UButton
            :color="statusFilter === 'inactive' ? 'primary' : 'neutral'"
            :variant="statusFilter === 'inactive' ? 'solid' : 'outline'"
            label="Inactive"
            @click="statusFilter = 'inactive'"
          />
        </UButtonGroup>
        <UButton
          color="primary"
          icon="i-heroicons-plus-20-solid"
          label="Add Location"
          @click="openCreate"
        />
      </div>
    </div>

    <!-- Loading -->
    <UCard v-if="pending">
      <div class="space-y-4">
        <div v-for="i in 3" :key="i" class="flex items-center justify-between py-2">
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
      title="Error loading locations"
      :description="error.message"
    />

    <!-- Empty state -->
    <UCard v-else-if="!locations?.length">
      <div class="py-8 text-center text-gray-500">
        {{
          statusFilter === 'inactive'
            ? 'No inactive locations.'
            : 'No locations found. Add one to get started.'
        }}
      </div>
    </UCard>

    <!-- Location list -->
    <div v-else class="space-y-3">
      <NuxtLink v-for="loc in locations" :key="loc.id" :to="`/locations/${loc.id}`" class="block">
        <UCard
          class="transition-shadow hover:shadow-md"
          :class="{ 'opacity-60': loc.status === 'inactive' }"
        >
          <div class="flex items-center justify-between">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <h3 class="truncate font-semibold text-gray-900 dark:text-white">
                  {{ loc.name }}
                </h3>
                <UBadge
                  v-if="isAdmin && loc.status === 'inactive'"
                  color="neutral"
                  variant="subtle"
                  size="xs"
                >
                  Inactive
                </UBadge>
              </div>
              <p v-if="loc.address" class="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                {{ loc.address }}
              </p>
              <div class="mt-2 flex gap-3">
                <UBadge variant="subtle" color="primary" size="xs">
                  {{ loc.homeItemCount }} home item{{ loc.homeItemCount === 1 ? '' : 's' }}
                </UBadge>
                <UBadge variant="subtle" color="success" size="xs">
                  {{ loc.currentItemCount }} item{{ loc.currentItemCount === 1 ? '' : 's' }} here
                  now
                </UBadge>
              </div>
            </div>
            <div v-if="isAdmin" class="ml-4 flex items-center gap-2" @click.prevent>
              <UButton
                variant="ghost"
                color="neutral"
                icon="i-heroicons-pencil-square-20-solid"
                size="sm"
                @click="openEdit(loc)"
              />
              <UButton
                variant="ghost"
                :color="loc.status === 'active' ? 'error' : 'success'"
                :icon="
                  loc.status === 'active'
                    ? 'i-heroicons-archive-box-20-solid'
                    : 'i-heroicons-arrow-path-20-solid'
                "
                size="sm"
                @click="toggleStatus(loc)"
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
            {{ editingLocation ? 'Edit Location' : 'Add Location' }}
          </h3>
          <UForm
            :schema="locationSchema"
            :state="formState"
            class="space-y-4"
            @submit="handleSubmit"
          >
            <UFormField label="Name" name="name" required>
              <UInput v-model="formState.name" class="w-full" placeholder="Location name" />
            </UFormField>
            <UFormField label="Address" name="address">
              <UInput
                v-model="formState.address"
                class="w-full"
                placeholder="Street address (optional)"
              />
            </UFormField>
            <div class="flex justify-end gap-2">
              <UButton variant="soft" color="neutral" @click="isModalOpen = false">Cancel</UButton>
              <UButton type="submit" color="primary">
                {{ editingLocation ? 'Save' : 'Create' }}
              </UButton>
            </div>
          </UForm>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
