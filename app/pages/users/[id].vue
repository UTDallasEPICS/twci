<script setup lang="ts">
  import { z } from 'zod/v4'
  import { authClient } from '../../utils/auth-client'

  const route = useRoute()
  const userId = route.params.id as string

  const { data: session } = await authClient.useSession(useFetch)
  const userRole = computed(() => (session.value?.user as Record<string, unknown>)?.role as string)
  const isAdmin = computed(() => userRole.value === 'admin')

  interface UserDetail {
    id: string
    email: string
    name: string
    legalFirstName: string | null
    legalLastName: string | null
    preferredFirstName: string | null
    preferredLastName: string | null
    displayName: string
    role: string
    status: string
    image: boolean
    emailVerified: boolean
    createdAt: string
    currentItemsHeld: number
    pastCheckoutCount: number
  }

  interface HistoryEntry {
    id: string
    item: { id: string; name: string }
    checkedOutAt: string
    checkedOutFromLocation: { id: string; name: string }
    checkedInAt: string | null
    checkedInAtLocation: { id: string; name: string } | null
    conditionOnReturn: string | null
  }

  const { data: user, pending, error, refresh } = await useFetch<UserDetail>(`/api/users/${userId}`)

  const { data: history } = await useFetch<HistoryEntry[]>(`/api/users/${userId}/history`)

  const isEditOpen = ref(false)
  const isDeleteOpen = ref(false)
  const isSubmitting = ref(false)
  const isDeleting = ref(false)
  const deleteError = ref('')

  const toast = useToast()

  const editSchema = z.object({
    legalFirstName: z.string().min(1, 'Legal first name is required'),
    legalLastName: z.string().min(1, 'Legal last name is required'),
    preferredFirstName: z.string().optional(),
    preferredLastName: z.string().optional(),
    role: z.enum(['admin', 'supervisor', 'employee']),
    status: z.enum(['active', 'on_leave', 'inactive']),
  })

  type EditFormState = {
    legalFirstName: string
    legalLastName: string
    preferredFirstName: string
    preferredLastName: string
    role: 'admin' | 'supervisor' | 'employee'
    status: 'active' | 'on_leave' | 'inactive'
  }

  const formState = reactive<EditFormState>({
    legalFirstName: '',
    legalLastName: '',
    preferredFirstName: '',
    preferredLastName: '',
    role: 'employee',
    status: 'active',
  })

  function openEdit() {
    if (!user.value) return
    Object.assign(formState, {
      legalFirstName: user.value.legalFirstName || '',
      legalLastName: user.value.legalLastName || '',
      preferredFirstName: user.value.preferredFirstName || '',
      preferredLastName: user.value.preferredLastName || '',
      role: user.value.role || 'employee',
      status: user.value.status || 'active',
    })
    isEditOpen.value = true
  }

  function openDelete() {
    deleteError.value = ''
    isDeleteOpen.value = true
  }

  async function submitEdit() {
    isSubmitting.value = true
    try {
      await $fetch(`/api/users/${userId}`, {
        method: 'PUT',
        body: {
          legalFirstName: formState.legalFirstName,
          legalLastName: formState.legalLastName,
          preferredFirstName: formState.preferredFirstName || null,
          preferredLastName: formState.preferredLastName || null,
          role: formState.role,
          status: formState.status,
        },
      })
      toast.add({ title: 'User updated', color: 'success' })
      isEditOpen.value = false
      await refresh()
    } catch (err: unknown) {
      const fetchErr = err as { data?: { statusMessage?: string } }
      toast.add({
        title: fetchErr.data?.statusMessage || 'Failed to update user',
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
      await $fetch(`/api/users/${userId}`, { method: 'DELETE' })
      toast.add({ title: 'User deleted', color: 'success' })
      await navigateTo('/users')
    } catch (err: unknown) {
      const fetchErr = err as { data?: { statusMessage?: string } }
      deleteError.value = fetchErr.data?.statusMessage || 'Failed to delete user'
    } finally {
      isDeleting.value = false
    }
  }

  type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

  const roleColor: Record<string, BadgeColor> = {
    admin: 'error',
    supervisor: 'warning',
    employee: 'info',
  }

  const statusColor: Record<string, BadgeColor> = {
    active: 'success',
    on_leave: 'warning',
    inactive: 'neutral',
  }

  function getImageLink(u: { image: boolean; id: string }) {
    return u.image ? `/api/users/${u.id}/profile` : undefined
  }

  function hasPreferredName(u: NonNullable<typeof user.value>) {
    return (
      (u.preferredFirstName && u.preferredFirstName !== u.legalFirstName) ||
      (u.preferredLastName && u.preferredLastName !== u.legalLastName)
    )
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
        title="Error loading user"
        :description="error.message"
      />
      <UButton class="mt-4" variant="soft" to="/users" icon="i-heroicons-arrow-left-20-solid">
        Back to users
      </UButton>
    </div>

    <div v-else-if="user">
      <div class="mb-6">
        <NuxtLink
          to="/users"
          class="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <UIcon name="i-heroicons-arrow-left-20-solid" class="h-4 w-4" />
          Back to users
        </NuxtLink>

        <div class="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div class="flex items-center gap-4">
            <UAvatar :src="getImageLink(user)" :alt="user.displayName" size="xl" />
            <div>
              <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                {{ user.displayName }}
              </h1>
              <p v-if="hasPreferredName(user)" class="text-sm text-gray-500 dark:text-gray-400">
                Legal name: {{ user.legalFirstName }} {{ user.legalLastName }}
              </p>
              <p class="mt-0.5 text-gray-500 dark:text-gray-400">{{ user.email }}</p>
              <div class="mt-2 flex gap-2">
                <UBadge :color="roleColor[user.role] || 'neutral'" variant="subtle">
                  {{ user.role }}
                </UBadge>
                <UBadge :color="statusColor[user.status] || 'neutral'" variant="subtle">
                  {{ user.status.replace('_', ' ') }}
                </UBadge>
              </div>
            </div>
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

      <!-- Stats -->
      <div class="mb-6 grid gap-4 md:grid-cols-2">
        <UCard>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-cube-20-solid" class="text-primary-500 h-8 w-8" />
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ user.currentItemsHeld }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Items currently held</p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-clock-20-solid" class="text-primary-500 h-8 w-8" />
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ user.pastCheckoutCount }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Past checkouts</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Checkout History -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-heroicons-clipboard-document-list-20-solid"
              class="h-5 w-5 text-gray-500"
            />
            <h2 class="text-base leading-7 font-semibold text-gray-900 dark:text-white">
              Checkout History
            </h2>
          </div>
        </template>

        <div class="divide-y divide-gray-200 dark:divide-gray-800">
          <div
            v-for="log in history"
            :key="log.id"
            class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
          >
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ log.item.name }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                From {{ log.checkedOutFromLocation.name }} &mdash;
                {{ new Date(log.checkedOutAt).toLocaleDateString() }}
              </p>
            </div>
            <div>
              <UBadge v-if="!log.checkedInAt" color="warning" variant="subtle" size="sm">
                Checked out
              </UBadge>
              <UBadge v-else color="success" variant="subtle" size="sm">
                Returned {{ new Date(log.checkedInAt).toLocaleDateString() }}
              </UBadge>
            </div>
          </div>

          <div v-if="!history || history.length === 0" class="py-8 text-center text-gray-500">
            No checkout history.
          </div>
        </div>
      </UCard>
    </div>

    <!-- Edit Modal -->
    <UModal v-model:open="isEditOpen">
      <template #content>
        <div class="p-6">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Edit User</h3>
          <UForm :schema="editSchema" :state="formState" class="space-y-4" @submit="submitEdit">
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Legal First Name" name="legalFirstName" required>
                <UInput v-model="formState.legalFirstName" class="w-full" />
              </UFormField>
              <UFormField label="Legal Last Name" name="legalLastName" required>
                <UInput v-model="formState.legalLastName" class="w-full" />
              </UFormField>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Preferred First Name" name="preferredFirstName">
                <UInput v-model="formState.preferredFirstName" class="w-full" />
              </UFormField>
              <UFormField label="Preferred Last Name" name="preferredLastName">
                <UInput v-model="formState.preferredLastName" class="w-full" />
              </UFormField>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Role" name="role" required>
                <USelect
                  v-model="formState.role"
                  :items="[
                    { label: 'Admin', value: 'admin' },
                    { label: 'Supervisor', value: 'supervisor' },
                    { label: 'Employee', value: 'employee' },
                  ]"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Status" name="status" required>
                <USelect
                  v-model="formState.status"
                  :items="[
                    { label: 'Active', value: 'active' },
                    { label: 'On Leave', value: 'on_leave' },
                    { label: 'Inactive', value: 'inactive' },
                  ]"
                  class="w-full"
                />
              </UFormField>
            </div>
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
          <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Delete User</h3>
          <p class="mb-4 text-gray-500 dark:text-gray-400">
            Are you sure you want to delete <strong>{{ user?.displayName }}</strong
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
