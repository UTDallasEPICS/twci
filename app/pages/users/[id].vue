<script setup lang="ts">
  import { z } from 'zod'
  import type { FormSubmitEvent } from '@nuxt/ui'

  interface UserDetail {
    id: string
    email: string
    displayName: string
    role: string
    status: string
    legalFirstName: string | null
    legalLastName: string | null
    preferredFirstName: string | null
    preferredLastName: string | null
    image: boolean
    emailVerified: boolean
    createdAt: string
    updatedAt: string
  }

  const route = useRoute()
  const toast = useToast()
  const id = route.params.id as string

  const { data: session } = await authClient.useSession(useFetch)
  const isAdmin = computed(() => session.value?.user?.role === 'admin')

  const { data: user, pending, error, refresh } = await useFetch<UserDetail>(`/api/users/${id}`)

  // Edit modal
  const isEditOpen = ref(false)
  const isSubmitting = ref(false)

  const updateUserSchema = z.object({
    legalFirstName: z.string().min(1, 'Required').max(100),
    legalLastName: z.string().min(1, 'Required').max(100),
    preferredFirstName: z.string().max(100).optional(),
    preferredLastName: z.string().max(100).optional(),
    role: z.enum(['admin', 'supervisor', 'employee']),
    status: z.enum(['active', 'on_leave', 'inactive']),
  })

  const formState = reactive({
    legalFirstName: '',
    legalLastName: '',
    preferredFirstName: '',
    preferredLastName: '',
    role: 'employee' as 'admin' | 'supervisor' | 'employee',
    status: 'active' as 'active' | 'on_leave' | 'inactive',
  })

  function openEdit() {
    if (!user.value) return
    formState.legalFirstName = user.value.legalFirstName ?? ''
    formState.legalLastName = user.value.legalLastName ?? ''
    formState.preferredFirstName = user.value.preferredFirstName ?? ''
    formState.preferredLastName = user.value.preferredLastName ?? ''
    formState.role = user.value.role as 'admin' | 'supervisor' | 'employee'
    formState.status = user.value.status as 'active' | 'on_leave' | 'inactive'
    isEditOpen.value = true
  }

  async function handleEdit(_event: FormSubmitEvent<Record<string, unknown>>) {
    isSubmitting.value = true
    try {
      await $fetch(`/api/users/${id}`, {
        method: 'PUT',
        body: {
          ...formState,
          preferredFirstName: formState.preferredFirstName || null,
          preferredLastName: formState.preferredLastName || null,
        },
      })
      toast.add({ title: 'User updated', color: 'success' })
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

  // Delete
  const isDeleteOpen = ref(false)
  const isDeleting = ref(false)

  async function handleDelete() {
    isDeleting.value = true
    try {
      await $fetch(`/api/users/${id}`, { method: 'DELETE' })
      toast.add({ title: 'User deleted', color: 'success' })
      await navigateTo('/users')
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'statusMessage' in err
          ? (err as { statusMessage: string }).statusMessage
          : 'Failed to delete user'
      toast.add({ title: 'Error', description: message, color: 'error' })
    } finally {
      isDeleting.value = false
      isDeleteOpen.value = false
    }
  }

  function roleBadgeColor(role: string) {
    if (role === 'admin') return 'error' as const
    if (role === 'supervisor') return 'warning' as const
    return 'primary' as const
  }

  function statusBadgeColor(status: string) {
    if (status === 'active') return 'success' as const
    if (status === 'on_leave') return 'warning' as const
    return 'neutral' as const
  }

  function getImageLink() {
    if (!user.value?.image) return undefined
    return `/api/users/${id}/profile`
  }
</script>

<template>
  <UContainer class="py-10">
    <!-- Back link -->
    <NuxtLink
      to="/users"
      class="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    >
      <UIcon name="i-heroicons-arrow-left-20-solid" class="h-4 w-4" />
      Back to users
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
      title="User not found"
      description="This user does not exist or you don't have access."
    />

    <!-- User detail -->
    <template v-else-if="user">
      <!-- Inactive banner -->
      <UAlert
        v-if="user.status === 'inactive'"
        class="mb-4"
        icon="i-heroicons-no-symbol-20-solid"
        color="warning"
        variant="subtle"
        title="This user is inactive"
        description="They cannot log in and won't appear in user selections."
      />

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <UAvatar
                :src="getImageLink()"
                :alt="user.displayName"
                size="xl"
                :as="{ img: 'img' }"
              />
              <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ user.displayName }}
                </h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ user.email }}</p>
                <div class="mt-1 flex items-center gap-2">
                  <UBadge :color="roleBadgeColor(user.role)" variant="subtle" size="sm">
                    {{ user.role }}
                  </UBadge>
                  <UBadge :color="statusBadgeColor(user.status)" variant="subtle" size="sm">
                    {{ user.status === 'on_leave' ? 'on leave' : user.status }}
                  </UBadge>
                </div>
              </div>
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
                color="error"
                icon="i-heroicons-trash-20-solid"
                label="Delete"
                size="sm"
                @click="isDeleteOpen = true"
              />
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Legal Name</p>
              <p class="text-gray-900 dark:text-white">
                {{ user.legalFirstName }} {{ user.legalLastName }}
              </p>
            </div>
            <div v-if="user.preferredFirstName || user.preferredLastName">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Preferred Name</p>
              <p class="text-gray-900 dark:text-white">
                {{ user.preferredFirstName || user.legalFirstName }}
                {{ user.preferredLastName || user.legalLastName }}
              </p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Checkout History Placeholder -->
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
        <div class="py-6 text-center text-gray-500">
          Checkout history will appear here once the check-in/check-out system is implemented.
        </div>
      </UCard>
    </template>

    <!-- Edit Modal -->
    <UModal v-model:open="isEditOpen">
      <template #content>
        <div class="p-6">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Edit User</h3>
          <UForm
            :schema="updateUserSchema"
            :state="formState"
            class="space-y-4"
            @submit="handleEdit"
          >
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
                <UInput
                  v-model="formState.preferredFirstName"
                  class="w-full"
                  placeholder="Optional"
                />
              </UFormField>
              <UFormField label="Preferred Last Name" name="preferredLastName">
                <UInput
                  v-model="formState.preferredLastName"
                  class="w-full"
                  placeholder="Optional"
                />
              </UFormField>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Role" name="role">
                <USelect
                  v-model="formState.role"
                  :items="[
                    { label: 'Employee', value: 'employee' },
                    { label: 'Supervisor', value: 'supervisor' },
                    { label: 'Admin', value: 'admin' },
                  ]"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Status" name="status">
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
            <div class="flex justify-end gap-2">
              <UButton variant="soft" color="neutral" @click="isEditOpen = false">Cancel</UButton>
              <UButton type="submit" color="primary" :loading="isSubmitting">Save</UButton>
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
          <div class="flex justify-end gap-2">
            <UButton variant="soft" color="neutral" @click="isDeleteOpen = false">Cancel</UButton>
            <UButton color="error" :loading="isDeleting" @click="handleDelete">Delete</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
