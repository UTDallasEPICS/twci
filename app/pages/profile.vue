<script setup lang="ts">
  import { authClient } from '../utils/auth-client'

  interface HistoryEntry {
    id: string
    item: { id: string; name: string }
    checkedOutAt: string
    checkedOutFromLocation: { id: string; name: string }
    checkedInAt: string | null
    checkedInAtLocation: { id: string; name: string } | null
    conditionOnReturn: string | null
  }

  const { data: user, pending, error } = await useFetch('/api/users/me')

  const { data: history } = await useFetch<HistoryEntry[]>(
    computed(() => `/api/users/${user.value?.id}/history`),
    { immediate: !!user.value }
  )

  const selectedFile = ref<File | null>(null)
  const imagePreview = ref<string>('')
  const isUploading = ref(false)
  const isModalOpen = ref(false)

  async function logout() {
    await authClient.signOut()
    await navigateTo('/auth', { external: true })
  }

  function getImageLink() {
    return user.value?.image ? `/api/users/${user.value.id}/profile` : undefined
  }

  function handleImageUpload(event: Event) {
    const target = event.target as HTMLInputElement
    const files = target.files as FileList
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file?.type.startsWith('image/')) return

    selectedFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  async function uploadPfp() {
    if (!selectedFile.value) return
    isUploading.value = true
    try {
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      await $fetch('/api/users/upload', { method: 'POST', body: formData })
      await refreshNuxtData()
      selectedFile.value = null
      imagePreview.value = ''
      isModalOpen.value = false
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      isUploading.value = false
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
</script>

<template>
  <UContainer class="py-10">
    <div v-if="pending" class="space-y-4">
      <USkeleton class="h-8 w-1/3" />
      <USkeleton class="h-4 w-1/2" />
    </div>

    <div v-else-if="error">
      <UAlert
        icon="i-heroicons-exclamation-triangle-20-solid"
        color="error"
        variant="subtle"
        title="Error loading profile"
        :description="error.message"
      />
    </div>

    <div v-else-if="user">
      <div class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div class="flex items-center gap-4">
          <UAvatar :src="getImageLink()" :alt="user.displayName" size="xl" />
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {{ user.displayName }}
            </h1>
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
        <div class="flex gap-2">
          <UModal :open="isModalOpen">
            <UButton
              color="neutral"
              variant="soft"
              icon="i-heroicons-camera-20-solid"
              label="Update Photo"
              @click="isModalOpen = true"
            />
            <template #content>
              <div class="space-y-4 p-6">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  Update Profile Picture
                </h3>
                <div v-if="imagePreview" class="flex justify-center">
                  <UAvatar :src="imagePreview" size="3xl" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  class="file:bg-primary-50 file:text-brand4 hover:file:bg-primary-100 block w-full cursor-pointer text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold"
                  @change="handleImageUpload"
                />
                <div class="flex justify-end gap-2">
                  <UButton variant="soft" color="neutral" @click="isModalOpen = false">
                    Cancel
                  </UButton>
                  <UButton
                    color="primary"
                    :loading="isUploading"
                    :disabled="!selectedFile"
                    @click="uploadPfp"
                  >
                    Upload
                  </UButton>
                </div>
              </div>
            </template>
          </UModal>
          <UButton
            color="error"
            variant="soft"
            icon="i-heroicons-arrow-right-on-rectangle-20-solid"
            label="Logout"
            @click="logout"
          />
        </div>
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
              My Checkout History
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
            No checkout history yet.
          </div>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>
