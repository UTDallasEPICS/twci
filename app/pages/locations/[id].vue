<script setup lang="ts">
  import { z } from 'zod/v4'
  import { authClient } from '../../utils/auth-client'

  const route = useRoute()
  const locationId = route.params.id as string

  const { data: session } = await authClient.useSession(useFetch)
  const isAdmin = computed(() => (session.value?.user as Record<string, unknown>)?.role === 'admin')

  const { data: location, pending, error, refresh } = await useFetch(`/api/locations/${locationId}`)

  const isEditOpen = ref(false)
  const isDeleteOpen = ref(false)
  const isSubmitting = ref(false)
  const isDeleting = ref(false)
  const deleteError = ref('')

  const toast = useToast()

  const locationSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less'),
    address: z.string().max(500, 'Address must be 500 characters or less').optional(),
  })

  type LocationFormState = {
    name: string
    address?: string
  }

  const formState = reactive<LocationFormState>({
    name: '',
    address: '',
  })

  function openEdit() {
    if (!location.value) return
    formState.name = location.value.name
    formState.address = location.value.address ?? ''
    isEditOpen.value = true
  }

  function openDelete() {
    deleteError.value = ''
    isDeleteOpen.value = true
  }

  async function submitEdit() {
    isSubmitting.value = true
    try {
      await $fetch(`/api/locations/${locationId}`, {
        method: 'PUT',
        body: { name: formState.name, address: formState.address || undefined },
      })
      toast.add({ title: 'Location updated', color: 'success' })
      isEditOpen.value = false
      await refresh()
    } catch (err: unknown) {
      const fetchErr = err as { data?: { statusMessage?: string } }
      toast.add({
        title: fetchErr.data?.statusMessage || 'Failed to update location',
        color: 'error',
      })
    } finally {
      isSubmitting.value = false
    }
  }

  async function confirmDelete() {
    isDeleting.value = true
    deleteError.value = ''
    try {
      await $fetch(`/api/locations/${locationId}`, {
        method: 'DELETE',
      })
      toast.add({ title: 'Location deleted', color: 'success' })
      await navigateTo('/locations')
    } catch (err: unknown) {
      const fetchErr = err as { data?: { statusMessage?: string } }
      deleteError.value = fetchErr.data?.statusMessage || 'Failed to delete location'
    } finally {
      isDeleting.value = false
    }
  }

  type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

  const conditionColor: Record<string, BadgeColor> = {
    good: 'success',
    fair: 'warning',
    damaged: 'error',
    retired: 'neutral',
  }

  const statusColor: Record<string, BadgeColor> = {
    available: 'success',
    checked_out: 'warning',
  }
</script>

<template>
  <UContainer class="py-10">
    <div v-if="pending" class="space-y-4">
      <USkeleton class="h-8 w-1/3" />
      <USkeleton class="h-4 w-1/2" />
      <USkeleton class="mt-6 h-40 w-full" />
    </div>

    <div v-else-if="error">
      <UAlert
        icon="i-heroicons-exclamation-triangle-20-solid"
        color="error"
        variant="subtle"
        title="Error loading location"
        :description="error.message"
      />
      <UButton class="mt-4" variant="soft" to="/locations" icon="i-heroicons-arrow-left-20-solid">
        Back to locations
      </UButton>
    </div>

    <div v-else-if="location">
      <div class="mb-6">
        <NuxtLink
          to="/locations"
          class="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <UIcon name="i-heroicons-arrow-left-20-solid" class="h-4 w-4" />
          Back to locations
        </NuxtLink>

        <div class="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {{ location.name }}
            </h1>
            <p v-if="location.address" class="mt-1 text-gray-500 dark:text-gray-400">
              {{ location.address }}
            </p>
          </div>
          <div v-if="isAdmin" class="flex gap-2">
            <UButton
              color="neutral"
              variant="soft"
              icon="i-heroicons-pencil-square-20-solid"
              label="Edit"
              @click="openEdit"
            />
            <UButton
              color="error"
              variant="soft"
              icon="i-heroicons-trash-20-solid"
              label="Delete"
              @click="openDelete"
            />
          </div>
        </div>
      </div>

      <div class="mb-6 grid gap-4 md:grid-cols-2">
        <UCard>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-home-20-solid" class="text-primary-500 h-8 w-8" />
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ location.homeItemCount }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Home items</p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-map-pin-20-solid" class="text-primary-500 h-8 w-8" />
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ location.currentItemCount }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Items currently here</p>
            </div>
          </div>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-cube-20-solid" class="h-5 w-5 text-gray-500" />
            <h2 class="text-base leading-7 font-semibold text-gray-900 dark:text-white">
              Items Currently Here
            </h2>
          </div>
        </template>

        <div class="divide-y divide-gray-200 dark:divide-gray-800">
          <div
            v-for="item in location.currentItems"
            :key="item.id"
            class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
          >
            <p class="font-medium text-gray-900 dark:text-white">{{ item.name }}</p>
            <div class="flex gap-2">
              <UBadge
                :color="conditionColor[item.condition] || 'neutral'"
                variant="subtle"
                size="sm"
              >
                {{ item.condition }}
              </UBadge>
              <UBadge :color="statusColor[item.status] || 'neutral'" variant="subtle" size="sm">
                {{ item.status.replace('_', ' ') }}
              </UBadge>
            </div>
          </div>

          <div v-if="location.currentItems.length === 0" class="py-8 text-center text-gray-500">
            No items currently at this location.
          </div>
        </div>
      </UCard>
    </div>

    <!-- Edit Modal -->
    <UModal v-model:open="isEditOpen">
      <template #content>
        <div class="p-6">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Edit Location</h3>
          <UForm :schema="locationSchema" :state="formState" class="space-y-4" @submit="submitEdit">
            <UFormField label="Name" name="name" required>
              <UInput v-model="formState.name" placeholder="Location name" class="w-full" />
            </UFormField>
            <UFormField label="Address" name="address">
              <UInput
                v-model="formState.address"
                placeholder="Street address (optional)"
                class="w-full"
              />
            </UFormField>
            <div class="flex justify-end gap-2 pt-2">
              <UButton variant="soft" color="neutral" @click="isEditOpen = false">Cancel</UButton>
              <UButton type="submit" :loading="isSubmitting">Save</UButton>
            </div>
          </UForm>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteOpen">
      <template #content>
        <div class="p-6">
          <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Delete Location</h3>
          <p class="mb-4 text-gray-500 dark:text-gray-400">
            Are you sure you want to delete <strong>{{ location?.name }}</strong
            >? This action cannot be undone.
          </p>
          <UAlert
            v-if="deleteError"
            icon="i-heroicons-exclamation-triangle-20-solid"
            color="error"
            variant="subtle"
            :title="deleteError"
            class="mb-4"
          />
          <div class="flex justify-end gap-2">
            <UButton variant="soft" color="neutral" @click="isDeleteOpen = false">Cancel</UButton>
            <UButton color="error" :loading="isDeleting" @click="confirmDelete">Delete</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
