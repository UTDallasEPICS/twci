<script setup lang="ts">
  import { z } from 'zod/v4'
  import { authClient } from '../../utils/auth-client'

  const { data: session } = await authClient.useSession(useFetch)
  const userRole = computed(() => (session.value?.user as Record<string, unknown>)?.role as string)
  const isAdmin = computed(() => userRole.value === 'admin')

  // Redirect employees away
  if (userRole.value === 'employee') {
    await navigateTo('/')
  }

  const roleFilter = ref('')
  const statusFilter = ref('')
  const search = ref('')

  const queryParams = computed(() => {
    const params: Record<string, string> = {}
    if (roleFilter.value) params.role = roleFilter.value
    if (statusFilter.value) params.status = statusFilter.value
    if (search.value) params.search = search.value
    return params
  })

  const {
    data: users,
    pending,
    error,
    refresh,
  } = await useFetch('/api/users', { query: queryParams })

  const isFormOpen = ref(false)
  const isDeleteOpen = ref(false)
  const editingUser = ref<Record<string, unknown> | null>(null)
  const deletingUser = ref<{ id: string; displayName: string } | null>(null)
  const isSubmitting = ref(false)
  const isDeleting = ref(false)
  const deleteError = ref('')

  const toast = useToast()

  const userSchema = z.object({
    legalFirstName: z.string().min(1, 'Legal first name is required'),
    legalLastName: z.string().min(1, 'Legal last name is required'),
    preferredFirstName: z.string().optional(),
    preferredLastName: z.string().optional(),
    email: z.email('Invalid email address'),
    role: z.enum(['admin', 'supervisor', 'employee']),
    status: z.enum(['active', 'on_leave', 'inactive']),
  })

  type UserFormState = {
    legalFirstName: string
    legalLastName: string
    preferredFirstName: string
    preferredLastName: string
    email: string
    role: 'admin' | 'supervisor' | 'employee'
    status: 'active' | 'on_leave' | 'inactive'
  }

  const formState = reactive<UserFormState>({
    legalFirstName: '',
    legalLastName: '',
    preferredFirstName: '',
    preferredLastName: '',
    email: '',
    role: 'employee',
    status: 'active',
  })

  function openCreate() {
    editingUser.value = null
    Object.assign(formState, {
      legalFirstName: '',
      legalLastName: '',
      preferredFirstName: '',
      preferredLastName: '',
      email: '',
      role: 'employee',
      status: 'active',
    })
    isFormOpen.value = true
  }

  function openEdit(user: Record<string, unknown>) {
    editingUser.value = user
    Object.assign(formState, {
      legalFirstName: user.legalFirstName || '',
      legalLastName: user.legalLastName || '',
      preferredFirstName: user.preferredFirstName || '',
      preferredLastName: user.preferredLastName || '',
      email: user.email || '',
      role: user.role || 'employee',
      status: user.status || 'active',
    })
    isFormOpen.value = true
  }

  function openDelete(user: { id: string; displayName: string }) {
    deletingUser.value = user
    deleteError.value = ''
    isDeleteOpen.value = true
  }

  async function submitForm() {
    isSubmitting.value = true
    try {
      if (editingUser.value) {
        await $fetch(`/api/users/${editingUser.value.id}`, {
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
      } else {
        await $fetch('/api/users', {
          method: 'POST',
          body: {
            legalFirstName: formState.legalFirstName,
            legalLastName: formState.legalLastName,
            preferredFirstName: formState.preferredFirstName || null,
            preferredLastName: formState.preferredLastName || null,
            email: formState.email,
            role: formState.role,
            status: formState.status,
          },
        })
        toast.add({ title: 'User created', color: 'success' })
      }
      isFormOpen.value = false
      await refresh()
    } catch (err: unknown) {
      const fetchErr = err as { data?: { statusMessage?: string } }
      toast.add({
        title: fetchErr.data?.statusMessage || 'Failed to save user',
        color: 'error',
      })
    } finally {
      isSubmitting.value = false
    }
  }

  async function confirmDelete() {
    if (!deletingUser.value) return
    isDeleting.value = true
    deleteError.value = ''
    try {
      await $fetch(`/api/users/${deletingUser.value.id}`, { method: 'DELETE' })
      toast.add({ title: 'User deleted', color: 'success' })
      isDeleteOpen.value = false
      await refresh()
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

  const roleOptions = [
    { label: 'All Roles', value: '' },
    { label: 'Admin', value: 'admin' },
    { label: 'Supervisor', value: 'supervisor' },
    { label: 'Employee', value: 'employee' },
  ]

  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'On Leave', value: 'on_leave' },
    { label: 'Inactive', value: 'inactive' },
  ]

  function getImageLink(user: { image: boolean; id: string }) {
    return user.image ? `/api/users/${user.id}/profile` : undefined
  }
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Users</h1>
        <p class="mt-1 text-gray-500 dark:text-gray-400">Manage user accounts and roles.</p>
      </div>
      <UButton
        v-if="isAdmin"
        color="primary"
        icon="i-heroicons-plus-20-solid"
        label="Add User"
        @click="openCreate"
      />
    </div>

    <!-- Filters -->
    <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
      <UInput
        v-model="search"
        placeholder="Search by name or email..."
        icon="i-heroicons-magnifying-glass-20-solid"
        class="md:w-64"
      />
      <USelect v-model="roleFilter" :items="roleOptions" class="md:w-40" />
      <USelect v-model="statusFilter" :items="statusOptions" class="md:w-40" />
    </div>

    <UCard>
      <div v-if="pending" class="space-y-4">
        <div v-for="i in 5" :key="i" class="flex items-center gap-3 py-3">
          <USkeleton class="h-10 w-10 rounded-full" />
          <div class="w-full space-y-2">
            <USkeleton class="h-4 w-1/3" />
            <USkeleton class="h-3 w-1/4" />
          </div>
        </div>
      </div>

      <div v-else-if="error">
        <UAlert
          icon="i-heroicons-exclamation-triangle-20-solid"
          color="error"
          variant="subtle"
          title="Error loading users"
          :description="error.message"
        />
      </div>

      <div v-else class="divide-y divide-gray-200 dark:divide-gray-800">
        <NuxtLink
          v-for="user in users"
          :key="user.id"
          :to="`/users/${user.id}`"
          class="-mx-4 flex items-center justify-between px-4 py-4 transition-colors first:pt-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <div class="flex items-center gap-3">
            <UAvatar :src="getImageLink(user)" :alt="user.displayName" size="md" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ user.displayName }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ user.email }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UBadge :color="roleColor[user.role] || 'neutral'" variant="subtle" size="sm">
              {{ user.role }}
            </UBadge>
            <UBadge :color="statusColor[user.status] || 'neutral'" variant="subtle" size="sm">
              {{ user.status.replace('_', ' ') }}
            </UBadge>
            <div v-if="isAdmin" class="ml-2 flex gap-1" @click.prevent>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-pencil-square-20-solid"
                size="sm"
                @click="openEdit(user)"
              />
              <UButton
                color="error"
                variant="ghost"
                icon="i-heroicons-trash-20-solid"
                size="sm"
                @click="openDelete(user)"
              />
            </div>
          </div>
        </NuxtLink>

        <div v-if="users?.length === 0" class="py-8 text-center text-gray-500">No users found.</div>
      </div>
    </UCard>

    <!-- Create/Edit Modal -->
    <UModal v-model:open="isFormOpen">
      <template #content>
        <div class="p-6">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {{ editingUser ? 'Edit User' : 'Add User' }}
          </h3>
          <UForm :schema="userSchema" :state="formState" class="space-y-4" @submit="submitForm">
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
            <UFormField v-if="!editingUser" label="Email" name="email" required>
              <UInput v-model="formState.email" type="email" class="w-full" />
            </UFormField>
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
              <UButton variant="soft" color="neutral" @click="isFormOpen = false">Cancel</UButton>
              <UButton type="submit" :loading="isSubmitting">
                {{ editingUser ? 'Save' : 'Create' }}
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
          <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Delete User</h3>
          <p class="mb-4 text-gray-500 dark:text-gray-400">
            Are you sure you want to delete <strong>{{ deletingUser?.displayName }}</strong
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
