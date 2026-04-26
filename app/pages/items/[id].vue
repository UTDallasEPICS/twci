<script setup lang="ts">
  import { z } from 'zod'
  import type { FormSubmitEvent } from '@nuxt/ui'

  interface ItemDetail {
    id: string
    name: string
    description: string | null
    condition: string
    status: string
    qrCodeUrl: string | null
    createdAt: string
    updatedAt: string
    homeLocation: { id: string; name: string }
    currentLocation: { id: string; name: string }
    currentCheckout: {
      id: string
      user: { id: string; name: string }
      checkedOutBy: { id: string; name: string }
      checkedOutFromLocation: { id: string; name: string }
      checkedOutAt: string
    } | null
    recentHistory: {
      id: string
      user: { id: string; name: string }
      checkedOutBy: { id: string; name: string }
      checkedOutFromLocation: { id: string; name: string }
      checkedOutAt: string
      checkedInBy: { id: string; name: string } | null
      checkedInAtLocation: { id: string; name: string } | null
      checkedInAt: string | null
      conditionOnReturn: string | null
      isOpen: boolean
    }[]
  }

  const route = useRoute()
  const toast = useToast()
  const id = route.params.id as string

  const { data: session } = await authClient.useSession(useFetch)
  const isAdmin = computed(() => session.value?.user?.role === 'admin')
  const isAdminOrSupervisor = computed(
    () => session.value?.user?.role === 'admin' || session.value?.user?.role === 'supervisor'
  )

  const { data: item, pending, error, refresh } = await useFetch<ItemDetail>(`/api/items/${id}`)

  // Fetch locations for edit form
  const { data: locations } = await useFetch('/api/locations')

  // Fetch users for checkout modal (admin/supervisor only)
  const { data: users } = await useFetch('/api/users', {
    immediate: isAdminOrSupervisor.value,
    watch: false,
  })

  // Edit modal
  const isEditOpen = ref(false)
  const isSubmitting = ref(false)

  const updateItemSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    description: z.string().max(1000).optional(),
    condition: z.enum(['good', 'fair', 'damaged', 'retired']),
    homeLocationId: z.string().min(1, 'Location is required'),
  })

  const formState = reactive({
    name: '',
    description: '',
    condition: 'good' as 'good' | 'fair' | 'damaged' | 'retired',
    homeLocationId: '',
  })

  function openEdit() {
    if (!item.value) return
    formState.name = item.value.name
    formState.description = item.value.description ?? ''
    formState.condition = item.value.condition as 'good' | 'fair' | 'damaged' | 'retired'
    formState.homeLocationId = item.value.homeLocation.id
    isEditOpen.value = true
  }

  async function handleEdit(_event: FormSubmitEvent<Record<string, unknown>>) {
    isSubmitting.value = true
    try {
      await $fetch(`/api/items/${id}`, {
        method: 'PUT',
        body: {
          name: formState.name,
          description: formState.description || null,
          condition: formState.condition,
          homeLocationId: formState.homeLocationId,
        },
      })
      toast.add({ title: 'Item updated', color: 'success' })
      isEditOpen.value = false
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

  // Checkout modal
  const isCheckoutOpen = ref(false)
  const isCheckingOut = ref(false)
  const selectedUserOption = ref<{ label: string; value: string } | undefined>()

  const userOptions = computed(() =>
    (users.value ?? []).map((u: { id: string; displayName: string; email: string }) => ({
      label: `${u.displayName} (${u.email})`,
      value: u.id,
    }))
  )

  const selectedUser = computed(() =>
    (users.value ?? []).find(
      (u: { id: string; status: string }) => u.id === selectedUserOption.value?.value
    )
  )

  function openCheckout() {
    selectedUserOption.value = undefined
    isCheckoutOpen.value = true
  }

  async function handleCheckout() {
    if (!selectedUserOption.value) return
    isCheckingOut.value = true
    try {
      const result = await $fetch<{ warning?: string }>(`/api/items/${id}/checkout`, {
        method: 'POST',
        body: { userId: selectedUserOption.value.value },
      })
      toast.add({ title: 'Item checked out', color: 'success' })
      if (result.warning) {
        toast.add({ title: 'Warning', description: result.warning, color: 'warning' })
      }
      isCheckoutOpen.value = false
      await refresh()
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'statusMessage' in err
          ? (err as { statusMessage: string }).statusMessage
          : 'Something went wrong'
      toast.add({ title: 'Error', description: message, color: 'error' })
    } finally {
      isCheckingOut.value = false
    }
  }

  // Check-in modal
  const isCheckinOpen = ref(false)
  const isCheckingIn = ref(false)
  const checkinLocationId = ref('')
  const checkinCondition = ref<'good' | 'fair' | 'damaged' | 'retired'>('good')

  const locationOptions = computed(() =>
    (locations.value ?? []).map((loc: { id: string; name: string }) => ({
      label: loc.name,
      value: loc.id,
    }))
  )

  function openCheckin() {
    if (!item.value) return
    checkinLocationId.value = item.value.homeLocation.id
    checkinCondition.value =
      (item.value.condition as 'good' | 'fair' | 'damaged' | 'retired') || 'good'
    isCheckinOpen.value = true
  }

  async function handleCheckin() {
    if (!checkinLocationId.value || !checkinCondition.value) return
    isCheckingIn.value = true
    try {
      await $fetch(`/api/items/${id}/checkin`, {
        method: 'POST',
        body: {
          locationId: checkinLocationId.value,
          condition: checkinCondition.value,
        },
      })
      toast.add({ title: 'Item checked in', color: 'success' })
      isCheckinOpen.value = false
      await refresh()
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'statusMessage' in err
          ? (err as { statusMessage: string }).statusMessage
          : 'Something went wrong'
      toast.add({ title: 'Error', description: message, color: 'error' })
    } finally {
      isCheckingIn.value = false
    }
  }

  // Retire / Reactivate
  const isRetiring = ref(false)

  async function toggleRetire() {
    if (!item.value) return
    const retiring = item.value.condition !== 'retired'
    isRetiring.value = true
    try {
      await $fetch(`/api/items/${id}`, {
        method: 'PUT',
        body: { condition: retiring ? 'retired' : 'good' },
      })
      toast.add({
        title: retiring ? 'Item retired' : 'Item reactivated',
        color: 'success',
      })
      await refresh()
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'statusMessage' in err
          ? (err as { statusMessage: string }).statusMessage
          : 'Something went wrong'
      toast.add({ title: 'Error', description: message, color: 'error' })
    } finally {
      isRetiring.value = false
    }
  }

  function conditionBadgeColor(condition: string) {
    if (condition === 'good') return 'success' as const
    if (condition === 'fair') return 'warning' as const
    if (condition === 'damaged') return 'error' as const
    return 'neutral' as const
  }

  function statusBadgeColor(status: string) {
    if (status === 'available') return 'success' as const
    if (status === 'checked_out') return 'warning' as const
    return 'neutral' as const
  }

  function statusLabel(status: string) {
    if (status === 'checked_out') return 'checked out'
    return status
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }
</script>

<template>
  <UContainer class="py-10">
    <!-- Back link -->
    <NuxtLink
      to="/items"
      class="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    >
      <UIcon name="i-heroicons-arrow-left-20-solid" class="h-4 w-4" />
      Back to items
    </NuxtLink>

    <!-- Loading -->
    <UCard v-if="pending">
      <div class="space-y-3">
        <USkeleton class="h-6 w-1/3" />
        <USkeleton class="h-4 w-1/2" />
      </div>
    </UCard>

    <!-- Error -->
    <UAlert
      v-else-if="error"
      icon="i-heroicons-exclamation-triangle-20-solid"
      color="error"
      variant="subtle"
      title="Item not found"
      description="This item does not exist or you don't have access."
    />

    <!-- Item detail -->
    <template v-else-if="item">
      <!-- Retired banner -->
      <UAlert
        v-if="item.condition === 'retired'"
        class="mb-4"
        icon="i-heroicons-archive-box-20-solid"
        color="warning"
        variant="subtle"
        title="This item is retired"
        description="It is no longer in active use."
      />

      <!-- Current checkout banner -->
      <UAlert
        v-if="item.currentCheckout"
        class="mb-4"
        icon="i-heroicons-arrow-right-circle-20-solid"
        color="info"
        variant="subtle"
        :title="`Checked out to ${item.currentCheckout.user.name}`"
        :description="`By ${item.currentCheckout.checkedOutBy.name} from ${item.currentCheckout.checkedOutFromLocation.name} on ${formatDate(item.currentCheckout.checkedOutAt)}`"
      />

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ item.name }}
              </h1>
              <div class="mt-2 flex items-center gap-2">
                <UBadge :color="conditionBadgeColor(item.condition)" variant="subtle" size="sm">
                  {{ item.condition }}
                </UBadge>
                <UBadge :color="statusBadgeColor(item.status)" variant="subtle" size="sm">
                  {{ statusLabel(item.status) }}
                </UBadge>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <template v-if="isAdminOrSupervisor">
                <UButton
                  v-if="item.status === 'available'"
                  variant="soft"
                  color="primary"
                  icon="i-heroicons-arrow-right-circle-20-solid"
                  label="Check Out"
                  size="sm"
                  @click="openCheckout"
                />
                <UButton
                  v-else-if="item.status === 'checked_out'"
                  variant="soft"
                  color="primary"
                  icon="i-heroicons-arrow-left-circle-20-solid"
                  label="Check In"
                  size="sm"
                  @click="openCheckin"
                />
              </template>
              <template v-if="isAdmin">
                <UButton
                  variant="soft"
                  color="neutral"
                  icon="i-heroicons-pencil-square-20-solid"
                  label="Edit"
                  size="sm"
                  @click="openEdit"
                />
                <UButton
                  v-if="item.condition === 'retired'"
                  variant="soft"
                  color="success"
                  icon="i-heroicons-arrow-path-20-solid"
                  label="Reactivate"
                  size="sm"
                  :loading="isRetiring"
                  @click="toggleRetire"
                />
                <UButton
                  v-else
                  variant="soft"
                  color="warning"
                  icon="i-heroicons-archive-box-20-solid"
                  label="Retire"
                  size="sm"
                  :loading="isRetiring"
                  @click="toggleRetire"
                />
              </template>
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <div v-if="item.description">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Description</p>
            <p class="text-gray-900 dark:text-white">{{ item.description }}</p>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Home Location</p>
              <NuxtLink
                :to="`/locations/${item.homeLocation.id}`"
                class="text-primary-500 hover:underline"
              >
                {{ item.homeLocation.name }}
              </NuxtLink>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Current Location</p>
              <NuxtLink
                :to="`/locations/${item.currentLocation.id}`"
                class="text-primary-500 hover:underline"
              >
                {{ item.currentLocation.name }}
              </NuxtLink>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Created</p>
              <p class="text-gray-900 dark:text-white">{{ formatDate(item.createdAt) }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
              <p class="text-gray-900 dark:text-white">{{ formatDate(item.updatedAt) }}</p>
            </div>
          </div>

          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">QR Code</p>
            <p class="text-gray-400 dark:text-gray-500">Not yet generated</p>
          </div>
        </div>
      </UCard>

      <!-- Checkout History -->
      <UCard class="mt-6">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-heroicons-clipboard-document-list-20-solid"
              class="h-5 w-5 text-gray-500"
            />
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">Checkout History</h2>
          </div>
        </template>
        <div v-if="!item.recentHistory.length" class="py-6 text-center text-gray-500">
          No checkout history yet.
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="log in item.recentHistory"
            :key="log.id"
            class="rounded-lg border p-3"
            :class="
              log.isOpen
                ? 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-950'
                : 'border-gray-200 dark:border-gray-700'
            "
          >
            <div class="flex items-center justify-between">
              <div class="text-sm">
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ log.user.name }}
                </span>
                <span class="text-gray-500 dark:text-gray-400">
                  &mdash; checked out by {{ log.checkedOutBy.name }} from
                  {{ log.checkedOutFromLocation.name }}
                </span>
              </div>
              <UBadge v-if="log.isOpen" color="warning" variant="subtle" size="sm"> open </UBadge>
            </div>
            <div class="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Out: {{ formatDate(log.checkedOutAt) }}
              <template v-if="log.checkedInAt">
                &bull; In: {{ formatDate(log.checkedInAt) }} at
                {{ log.checkedInAtLocation?.name }} by {{ log.checkedInBy?.name }}
                <template v-if="log.conditionOnReturn">
                  &bull; Condition: {{ log.conditionOnReturn }}
                </template>
              </template>
            </div>
          </div>
        </div>
      </UCard>
    </template>

    <!-- Checkout Modal -->
    <UModal v-model:open="isCheckoutOpen">
      <template #content>
        <div class="p-6">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Check Out Item</h3>

          <div class="mb-4 space-y-2">
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Item</p>
              <p class="text-gray-900 dark:text-white">{{ item?.name }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">From Location</p>
              <p class="text-gray-900 dark:text-white">{{ item?.currentLocation.name }}</p>
            </div>
          </div>

          <UFormField label="Check out to" name="userId" required class="mb-4">
            <USelectMenu
              v-model="selectedUserOption"
              :items="userOptions"
              :search-input="{ placeholder: 'Search by name or email...' }"
              placeholder="Select a user..."
              class="w-full"
            />
          </UFormField>

          <UAlert
            v-if="selectedUser?.status === 'on_leave'"
            class="mb-4"
            icon="i-heroicons-exclamation-triangle-20-solid"
            color="warning"
            variant="subtle"
            title="This user is currently on leave"
          />

          <div class="flex justify-end gap-2">
            <UButton variant="soft" color="neutral" @click="isCheckoutOpen = false">
              Cancel
            </UButton>
            <UButton
              color="primary"
              :loading="isCheckingOut"
              :disabled="!selectedUserOption"
              @click="handleCheckout"
            >
              Check Out
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Check-in Modal -->
    <UModal v-model:open="isCheckinOpen">
      <template #content>
        <div class="p-6">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Check In Item</h3>

          <div class="mb-4 space-y-2">
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Item</p>
              <p class="text-gray-900 dark:text-white">{{ item?.name }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Returning for</p>
              <p class="text-gray-900 dark:text-white">
                {{ item?.currentCheckout?.user.name }}
              </p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Checked out from</p>
              <p class="text-gray-900 dark:text-white">
                {{ item?.currentCheckout?.checkedOutFromLocation.name }}
              </p>
            </div>
          </div>

          <div class="mb-4 space-y-4">
            <UFormField label="Check-in location" name="locationId" required>
              <USelect v-model="checkinLocationId" :items="locationOptions" class="w-full" />
            </UFormField>

            <UFormField label="Condition on return" name="condition" required>
              <USelect
                v-model="checkinCondition"
                :items="[
                  { label: 'Good', value: 'good' },
                  { label: 'Fair', value: 'fair' },
                  { label: 'Damaged', value: 'damaged' },
                  { label: 'Retired', value: 'retired' },
                ]"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="flex justify-end gap-2">
            <UButton variant="soft" color="neutral" @click="isCheckinOpen = false">
              Cancel
            </UButton>
            <UButton
              color="primary"
              :loading="isCheckingIn"
              :disabled="!checkinLocationId || !checkinCondition"
              @click="handleCheckin"
            >
              Check In
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Edit Modal -->
    <UModal v-model:open="isEditOpen">
      <template #content>
        <div class="p-6">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Edit Item</h3>
          <UForm
            :schema="updateItemSchema"
            :state="formState"
            class="space-y-4"
            @submit="handleEdit"
          >
            <UFormField label="Name" name="name" required>
              <UInput v-model="formState.name" class="w-full" />
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
              <UFormField label="Home Location" name="homeLocationId" required>
                <USelect
                  v-model="formState.homeLocationId"
                  :items="locations?.map((loc) => ({ label: loc.name, value: loc.id })) ?? []"
                  class="w-full"
                />
              </UFormField>
            </div>
            <div class="flex justify-end gap-2">
              <UButton variant="soft" color="neutral" @click="isEditOpen = false">Cancel</UButton>
              <UButton type="submit" color="primary" :loading="isSubmitting">Save</UButton>
            </div>
          </UForm>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
