<script setup lang="ts">
  import { z } from 'zod'
  import type { FormSubmitEvent } from '@nuxt/ui'
  import { authClient } from '../utils/auth-client'

  const toast = useToast()
  const isEmailSent = ref(false)

  const schema = computed(() => {
    if (!isEmailSent.value) {
      return z.object({
        email: z.string().email('Invalid email'),
      })
    } else {
      return z.object({
        email: z.string().email('Invalid email'),
        otp: z.array(z.string()).length(6, 'Must be 6 digits'),
      })
    }
  })

  const state = reactive({
    email: '',
    otp: [] as string[],
  })

  async function handleSubmit(_event: FormSubmitEvent<Record<string, unknown>>) {
    if (!isEmailSent.value) {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: state.email,
        type: 'sign-in',
      })

      if (error) {
        toast.add({ title: 'Error', description: error.message, color: 'error' })
      } else {
        isEmailSent.value = true
        toast.add({ title: 'Success', description: 'OTP sent to your email', color: 'success' })
      }
    } else {
      const { error } = await authClient.signIn.emailOtp({
        email: state.email,
        otp: state.otp.join(''),
      })

      if (error) {
        toast.add({ title: 'Error', description: error.message, color: 'error' })
      } else {
        const route = useRoute()
        const redirect = (route.query.redirect as string) || '/'
        const safeRedirect = redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'
        await navigateTo(safeRedirect, { external: true })
      }
    }
  }
</script>

<template>
  <div class="flex h-full w-full items-center justify-center py-12">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="flex items-center justify-center text-xl font-bold">Login</div>
      </template>

      <UForm :schema="schema" :state="state" class="space-y-5" @submit="handleSubmit">
        <UFormField v-if="!isEmailSent" name="email">
          <UInput v-model="state.email" class="w-full" placeholder="Email" />
        </UFormField>

        <UFormField v-if="isEmailSent" name="otp">
          <UPinInput
            v-model="state.otp"
            otp
            :length="6"
            size="xl"
            class="flex w-full items-center justify-center"
          />
        </UFormField>

        <UButton loading-auto type="submit" class="w-full justify-center">
          {{ isEmailSent ? 'Login' : 'Send OTP' }}
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>
