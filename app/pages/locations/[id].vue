<script setup lang="ts">
  import { z } from 'zod'
  import type { FormSubmitEvent } from '@nuxt/ui'

  const route = useRoute()
  const toast = useToast()
  const id = route.params.id as string

  const { data: session } = await authClient.useSession(useFetch)
  const isAdmin = computed(() => session.value?.user?.role === 'admin')

  const { data: location, pending, error, refresh } = await useFetch(`/api/locations/${id}`)

  // Edit modal
  const isEditOpen = ref(false)
  const locationSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    address: z.string().max(500).optional(),
  })
  const formState = reactive({ name: '', address: '' })

  function openEdit() {
    if (!location.value) return
    formState.name = location.value.name
    formState.address = location.value.address ?? ''
    isEditOpen.value = true
  }

  async function handleEdit(_event: FormSubmitEvent<Record<string, unknown>>) {
    try {
      await $fetch(`/api/locations/${id}`, {
        method: 'PUT',
        body: { name: formState.name, address: formState.address || undefined },
      })
      toast.add({ title: 'Location updated', color: 'success' })
      isEditOpen.value = false
      await refresh()
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'statusMessage' in err
          ? (err as { statusMessage: string }).statusMessage
          : 'Something went wrong'
      toast.add({ title: 'Error', description: message, color: 'error' })
    }
  }

  async function toggleStatus() {
    if (!location.value) return
    const newStatus = location.value.status === 'active' ? 'inactive' : 'active'
    const action = newStatus === 'inactive' ? 'deactivate' : 'reactivate'
    try {
      await $fetch(`/api/locations/${id}`, {
        method: 'PUT',
        body: { status: newStatus },
      })
      toast.add({ title: `Location ${action}d`, color: 'success' })
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
    <!-- Back link -->
    <NuxtLink
      to="/locations"
      class="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    >
      <UIcon name="i-heroicons-arrow-left-20-solid" class="h-4 w-4" />
      Back to locations
    </NuxtLink>

    <!-- Loading -->
    <UCard v-if="pending">
      <div class="space-y-3">
        <USkeleton class="h-6 w-1/3" />
        <USkeleton class="h-4 w-1/2" />
      </div>
    </UCard>

    <!-- Error / Not found -->
    <UAlert
      v-else-if="error"
      icon="i-heroicons-exclamation-triangle-20-solid"
      color="error"
      variant="subtle"
      title="Location not found"
      description="This location does not exist or you don't have access to it."
    />

    <!-- Location detail -->
    <template v-else-if="location">
      <!-- Inactive banner -->
      <UAlert
        v-if="location.status === 'inactive'"
        class="mb-4"
        icon="i-heroicons-archive-box-20-solid"
        color="warning"
        variant="subtle"
        title="This location is inactive"
        description="It won't appear in location lists or dropdowns for non-admin users."
      />

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ location.name }}
              </h1>
              <UBadge
                :color="location.status === 'active' ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
              >
                {{ location.status }}
              </UBadge>
            </div>
            <div v-if="isAdmin" class="flex items-center gap-2">
              <UButton
                variant="soft"
                color="neutral"
                icon="i-heroicons-pencil-square-20-solid"
                label="Edit"
                size="sm"
                @click="openEdit"
              />
              <UButton
                variant="soft"
                :color="location.status === 'active' ? 'error' : 'success'"
                :label="location.status === 'active' ? 'Deactivate' : 'Reactivate'"
                size="sm"
                @click="toggleStatus"
              />
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <div v-if="location.address">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Address</p>
            <p class="text-gray-900 dark:text-white">{{ location.address }}</p>
          </div>

          <div class="flex gap-4">
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Home Items</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ location.homeItemCount }}
              </p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Items Here Now</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ location.currentItemCount }}
              </p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Current items -->
      <UCard class="mt-6">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-cube-20-solid" class="h-5 w-5 text-gray-500" />
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">
              Items at This Location
            </h2>
            <UBadge variant="subtle" color="primary" size="xs">
              {{ location.currentItems?.length ?? 0 }}
            </UBadge>
          </div>
        </template>

        <div v-if="!location.currentItems?.length" class="py-6 text-center text-gray-500">
          No items currently at this location.
        </div>

        <div v-else class="divide-y divide-gray-200 dark:divide-gray-800">
          <div
            v-for="item in location.currentItems"
            :key="item.id"
            class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
          >
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ item.name }}</p>
            </div>
            <div class="flex items-center gap-2">
              <UBadge
                :color="
                  item.condition === 'good'
                    ? 'success'
                    : item.condition === 'fair'
                      ? 'warning'
                      : item.condition === 'damaged'
                        ? 'error'
                        : 'neutral'
                "
                variant="subtle"
                size="xs"
              >
                {{ item.condition }}
              </UBadge>
              <UBadge
                :color="item.status === 'available' ? 'success' : 'warning'"
                variant="subtle"
                size="xs"
              >
                {{ item.status === 'checked_out' ? 'checked out' : item.status }}
              </UBadge>
            </div>
          </div>
        </div>
      </UCard>
    </template>

    <!-- Edit Modal -->
    <UModal v-model:open="isEditOpen">
      <template #content>
        <div class="p-6">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Edit Location</h3>
          <UForm :schema="locationSchema" :state="formState" class="space-y-4" @submit="handleEdit">
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
              <UButton variant="soft" color="neutral" @click="isEditOpen = false">Cancel</UButton>
              <UButton type="submit" color="primary">Save</UButton>
            </div>
          </UForm>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
