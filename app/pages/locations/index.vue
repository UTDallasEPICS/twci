<script setup lang="ts">
  import { z } from 'zod/v4'
  import { authClient } from '../../utils/auth-client'

  const { data: session } = await authClient.useSession(useFetch)
  const isAdmin = computed(() => (session.value?.user as Record<string, unknown>)?.role === 'admin')

  const { data: locations, pending, error, refresh } = await useFetch('/api/locations')

  const isFormOpen = ref(false)
  const isDeleteOpen = ref(false)
  const editingLocation = ref<{ id: string; name: string; address: string | null } | null>(null)
  const deletingLocation = ref<{ id: string; name: string } | null>(null)
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

  function openCreate() {
    editingLocation.value = null
    formState.name = ''
    formState.address = ''
    isFormOpen.value = true
  }

  function openEdit(loc: { id: string; name: string; address: string | null }) {
    editingLocation.value = loc
    formState.name = loc.name
    formState.address = loc.address ?? ''
    isFormOpen.value = true
  }

  function openDelete(loc: { id: string; name: string }) {
    deletingLocation.value = loc
    deleteError.value = ''
    isDeleteOpen.value = true
  }

  async function submitForm() {
    isSubmitting.value = true
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
      isFormOpen.value = false
      await refresh()
    } catch (err: unknown) {
      const fetchErr = err as { data?: { statusMessage?: string } }
      toast.add({
        title: fetchErr.data?.statusMessage || 'Failed to save location',
        color: 'error',
      })
    } finally {
      isSubmitting.value = false
    }
  }

  async function confirmDelete() {
    if (!deletingLocation.value) return
    isDeleting.value = true
    deleteError.value = ''
    try {
      await $fetch(`/api/locations/${deletingLocation.value.id}`, {
        method: 'DELETE',
      })
      toast.add({ title: 'Location deleted', color: 'success' })
      isDeleteOpen.value = false
      await refresh()
    } catch (err: unknown) {
      const fetchErr = err as { data?: { statusMessage?: string } }
      deleteError.value = fetchErr.data?.statusMessage || 'Failed to delete location'
    } finally {
      isDeleting.value = false
    }
  }
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Locations</h1>
        <p class="mt-1 text-gray-500 dark:text-gray-400">
          Manage physical locations where equipment is stored.
        </p>
      </div>
      <UButton
        v-if="isAdmin"
        color="primary"
        icon="i-heroicons-plus-20-solid"
        label="Add Location"
        @click="openCreate"
      />
    </div>

    <UCard>
      <div v-if="pending" class="space-y-4">
        <div v-for="i in 3" :key="i" class="flex items-center justify-between py-3">
          <div class="w-full space-y-2">
            <USkeleton class="h-4 w-1/3" />
            <USkeleton class="h-3 w-1/2" />
          </div>
        </div>
      </div>

      <div v-else-if="error">
        <UAlert
          icon="i-heroicons-exclamation-triangle-20-solid"
          color="error"
          variant="subtle"
          title="Error loading locations"
          :description="error.message"
        />
      </div>

      <div v-else class="divide-y divide-gray-200 dark:divide-gray-800">
        <NuxtLink
          v-for="loc in locations"
          :key="loc.id"
          :to="`/locations/${loc.id}`"
          class="-mx-4 flex items-center justify-between px-4 py-4 transition-colors first:pt-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <div class="min-w-0 flex-1">
            <p class="font-medium text-gray-900 dark:text-white">{{ loc.name }}</p>
            <p v-if="loc.address" class="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
              {{ loc.address }}
            </p>
          </div>
          <div class="ml-4 flex items-center gap-3">
            <div class="flex gap-2">
              <UBadge variant="subtle" color="primary" size="sm">
                {{ loc.homeItemCount }} home
              </UBadge>
              <UBadge variant="subtle" color="neutral" size="sm">
                {{ loc.currentItemCount }} current
              </UBadge>
            </div>
            <div v-if="isAdmin" class="flex gap-1" @click.prevent>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-pencil-square-20-solid"
                size="sm"
                @click="openEdit(loc)"
              />
              <UButton
                color="error"
                variant="ghost"
                icon="i-heroicons-trash-20-solid"
                size="sm"
                @click="openDelete(loc)"
              />
            </div>
          </div>
        </NuxtLink>

        <div v-if="locations?.length === 0" class="py-8 text-center text-gray-500">
          No locations found.
        </div>
      </div>
    </UCard>

    <!-- Create/Edit Modal -->
    <UModal v-model:open="isFormOpen">
      <template #content>
        <div class="p-6">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {{ editingLocation ? 'Edit Location' : 'Add Location' }}
          </h3>
          <UForm :schema="locationSchema" :state="formState" class="space-y-4" @submit="submitForm">
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
              <UButton variant="soft" color="neutral" @click="isFormOpen = false">Cancel</UButton>
              <UButton type="submit" :loading="isSubmitting">
                {{ editingLocation ? 'Save' : 'Create' }}
              </UButton>
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
            Are you sure you want to delete <strong>{{ deletingLocation?.name }}</strong
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
