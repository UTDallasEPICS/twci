<script setup lang="ts">
  const toast = useToast()

  const { data: user, pending, error, refresh } = await useFetch('/api/users/me')

  // Profile picture upload
  const selectedFile = ref<File | null>(null)
  const imagePreview = ref('')
  const isUploading = ref(false)
  const isUploadOpen = ref(false)

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

  async function uploadPhoto() {
    if (!selectedFile.value) return
    isUploading.value = true
    try {
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      await $fetch('/api/users/upload', { method: 'POST', body: formData })
      toast.add({ title: 'Profile picture updated', color: 'success' })
      selectedFile.value = null
      imagePreview.value = ''
      isUploadOpen.value = false
      await refresh()
    } catch {
      toast.add({ title: 'Upload failed', color: 'error' })
    } finally {
      isUploading.value = false
    }
  }

  async function logout() {
    await authClient.signOut()
    await navigateTo('/auth', { external: true })
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
    return `/api/users/${user.value.id}/profile`
  }
</script>

<template>
  <UContainer class="py-10">
    <div class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Profile</h1>
        <p class="mt-1 text-gray-500 dark:text-gray-400">Your account information.</p>
      </div>
      <UButton
        color="error"
        variant="soft"
        icon="i-heroicons-arrow-right-on-rectangle-20-solid"
        label="Logout"
        @click="logout"
      />
    </div>

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
      title="Error loading profile"
      :description="error.message"
    />

    <!-- Profile -->
    <template v-else-if="user">
      <UCard>
        <div class="flex flex-col gap-6 md:flex-row md:items-start">
          <!-- Avatar section -->
          <div class="flex flex-col items-center gap-3">
            <UAvatar
              :src="getImageLink()"
              :alt="user.displayName"
              size="3xl"
              :as="{ img: 'img' }"
            />
            <UButton
              variant="soft"
              color="neutral"
              icon="i-heroicons-camera-20-solid"
              label="Change Photo"
              size="sm"
              @click="isUploadOpen = true"
            />
          </div>

          <!-- Info section -->
          <div class="flex-1 space-y-4">
            <div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ user.displayName }}
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ user.email }}</p>
              <div class="mt-2 flex items-center gap-2">
                <UBadge :color="roleBadgeColor(user.role)" variant="subtle" size="sm">
                  {{ user.role }}
                </UBadge>
                <UBadge :color="statusBadgeColor(user.status)" variant="subtle" size="sm">
                  {{ user.status === 'on_leave' ? 'on leave' : user.status }}
                </UBadge>
              </div>
            </div>

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

            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</p>
              <p class="text-gray-900 dark:text-white">
                {{ new Date(user.createdAt).toLocaleDateString() }}
              </p>
            </div>
          </div>
        </div>
      </UCard>
    </template>

    <!-- Upload Photo Modal -->
    <UModal v-model:open="isUploadOpen">
      <template #content>
        <div class="space-y-4 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Update Profile Picture
          </h3>

          <div v-if="imagePreview" class="flex justify-center">
            <UAvatar :src="imagePreview" size="3xl" />
          </div>

          <input
            type="file"
            accept="image/*"
            class="file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100 block w-full cursor-pointer text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold"
            @change="handleImageUpload"
          />

          <div class="flex justify-end gap-2">
            <UButton variant="soft" color="neutral" @click="isUploadOpen = false">Cancel</UButton>
            <UButton
              color="success"
              :loading="isUploading"
              :disabled="!selectedFile"
              @click="uploadPhoto"
            >
              Upload
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
