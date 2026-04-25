<script setup lang="ts">
  import { z } from 'zod'
  import type { FormSubmitEvent } from '@nuxt/ui'

  const toast = useToast()

  const { data: session } = await authClient.useSession(useFetch)
  const isAdmin = computed(() => session.value?.user?.role === 'admin')

  // Filters
  const roleFilter = ref<string>('')
  const statusFilter = ref<string>('active')
  const searchQuery = ref('')
  const debouncedSearch = ref('')

  let searchTimeout: ReturnType<typeof setTimeout>
  watch(searchQuery, (val) => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      debouncedSearch.value = val
    }, 300)
  })

  const fetchQuery = computed(() => {
    const q: Record<string, string> = {}
    if (roleFilter.value) q.role = roleFilter.value
    if (isAdmin.value && statusFilter.value) q.status = statusFilter.value
    if (debouncedSearch.value) q.search = debouncedSearch.value
    return q
  })

  const {
    data: users,
    pending,
    error,
    refresh,
  } = await useFetch('/api/users', { query: fetchQuery })

  // Role options for filter
  const roleOptions = [
    { label: 'All roles', value: '' },
    { label: 'Admin', value: 'admin' },
    { label: 'Supervisor', value: 'supervisor' },
    { label: 'Employee', value: 'employee' },
  ]

  // Create user modal
  const isCreateOpen = ref(false)
  const isSubmitting = ref(false)

  const createUserSchema = z.object({
    legalFirstName: z.string().min(1, 'Required').max(100),
    legalLastName: z.string().min(1, 'Required').max(100),
    preferredFirstName: z.string().max(100).optional(),
    preferredLastName: z.string().max(100).optional(),
    email: z.string().email('Invalid email'),
    role: z.enum(['admin', 'supervisor', 'employee']),
    status: z.enum(['active', 'on_leave', 'inactive']),
  })

  const formState = reactive({
    legalFirstName: '',
    legalLastName: '',
    preferredFirstName: '',
    preferredLastName: '',
    email: '',
    role: 'employee' as const,
    status: 'active' as const,
  })

  function openCreate() {
    formState.legalFirstName = ''
    formState.legalLastName = ''
    formState.preferredFirstName = ''
    formState.preferredLastName = ''
    formState.email = ''
    formState.role = 'employee'
    formState.status = 'active'
    isCreateOpen.value = true
  }

  async function handleCreate(_event: FormSubmitEvent<Record<string, unknown>>) {
    isSubmitting.value = true
    try {
      await $fetch('/api/users', {
        method: 'POST',
        body: {
          ...formState,
          preferredFirstName: formState.preferredFirstName || null,
          preferredLastName: formState.preferredLastName || null,
        },
      })
      toast.add({ title: 'User created', color: 'success' })
      isCreateOpen.value = false
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

  function roleBadgeColor(role: string) {
    if (role === 'admin') return 'error'
    if (role === 'supervisor') return 'warning'
    return 'primary'
  }

  function statusBadgeColor(status: string) {
    if (status === 'active') return 'success'
    if (status === 'on_leave') return 'warning'
    return 'neutral'
  }

  function getImageLink(user: { image: boolean; id: string }) {
    return user.image ? `/api/users/${user.id}/profile` : undefined
  }
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Users</h1>
        <p class="mt-1 text-gray-500 dark:text-gray-400">
          {{ isAdmin ? 'Manage users and their roles.' : 'View team members.' }}
        </p>
      </div>
      <div v-if="isAdmin" class="flex items-center gap-3">
        <UButton
          color="primary"
          icon="i-heroicons-plus-20-solid"
          label="Add User"
          @click="openCreate"
        />
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
      <UInput
        v-model="searchQuery"
        icon="i-heroicons-magnifying-glass-20-solid"
        placeholder="Search by name or email..."
        class="w-full md:w-64"
      />
      <USelect v-model="roleFilter" :items="roleOptions" class="w-full md:w-40" />
      <UButtonGroup v-if="isAdmin">
        <UButton
          :color="statusFilter === 'active' ? 'primary' : 'neutral'"
          :variant="statusFilter === 'active' ? 'solid' : 'outline'"
          label="Active"
          @click="statusFilter = 'active'"
        />
        <UButton
          :color="statusFilter === 'on_leave' ? 'primary' : 'neutral'"
          :variant="statusFilter === 'on_leave' ? 'solid' : 'outline'"
          label="On Leave"
          @click="statusFilter = 'on_leave'"
        />
        <UButton
          :color="statusFilter === 'inactive' ? 'primary' : 'neutral'"
          :variant="statusFilter === 'inactive' ? 'solid' : 'outline'"
          label="Inactive"
          @click="statusFilter = 'inactive'"
        />
      </UButtonGroup>
    </div>

    <!-- Loading -->
    <UCard v-if="pending">
      <div class="space-y-4">
        <div v-for="i in 5" :key="i" class="flex items-center gap-3 py-2">
          <USkeleton class="h-10 w-10 rounded-full" />
          <div class="w-full space-y-2">
            <USkeleton class="h-4 w-1/3" />
            <USkeleton class="h-3 w-1/4" />
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
      title="Error loading users"
      :description="error.message"
    />

    <!-- Empty -->
    <UCard v-else-if="!users?.length">
      <div class="py-8 text-center text-gray-500">No users found.</div>
    </UCard>

    <!-- User list -->
    <div v-else class="space-y-3">
      <NuxtLink v-for="user in users" :key="user.id" :to="`/users/${user.id}`" class="block">
        <UCard
          class="transition-shadow hover:shadow-md"
          :class="{ 'opacity-60': user.status === 'inactive' }"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UAvatar
                :src="getImageLink(user)"
                :alt="user.displayName"
                size="md"
                :as="{ img: 'img' }"
              />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ user.displayName }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ user.email }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UBadge :color="roleBadgeColor(user.role)" variant="subtle" size="sm">
                {{ user.role }}
              </UBadge>
              <UBadge
                v-if="user.status !== 'active'"
                :color="statusBadgeColor(user.status)"
                variant="subtle"
                size="sm"
              >
                {{ user.status === 'on_leave' ? 'on leave' : user.status }}
              </UBadge>
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <!-- Create User Modal -->
    <UModal v-model:open="isCreateOpen">
      <template #content>
        <div class="p-6">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Add User</h3>
          <UForm
            :schema="createUserSchema"
            :state="formState"
            class="space-y-4"
            @submit="handleCreate"
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
            <UFormField label="Email" name="email" required>
              <UInput v-model="formState.email" type="email" class="w-full" />
            </UFormField>
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
              <UButton variant="soft" color="neutral" @click="isCreateOpen = false">Cancel</UButton>
              <UButton type="submit" color="primary" :loading="isSubmitting">Create</UButton>
            </div>
          </UForm>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
