<script setup lang="ts">
import type { LinkOwner } from '#shared/types/link'
import type { DashboardLink } from '@/types/dashboard-links'
import { Loader2 } from '@lucide/vue'
import { toast } from 'vue-sonner'

const props = defineProps<{
  link: DashboardLink
}>()

const emit = defineEmits<{
  closeAutoFocus: [event: Event]
}>()

const { t } = useI18n()
const linksStore = useDashboardLinksStore()
const open = defineModel<boolean>('open', { default: false })
const saving = shallowRef(false)
const emailInput = shallowRef('')
const owners = shallowRef<LinkOwner[]>([])
const pendingLink = shallowRef<DashboardLink | null>(null)
const knownOwnerEmails = computed(() => owners.value.flatMap(owner => owner.email ? [owner.email] : []))

watch(open, (isOpen) => {
  if (!isOpen)
    return
  emailInput.value = props.link.ownerEmail ?? ''
  void fetchOwners()
})

async function fetchOwners() {
  try {
    owners.value = await useAPI<LinkOwner[]>('/api/link/owners')
  }
  catch (error) {
    console.error(error)
  }
}

async function save() {
  if (saving.value)
    return

  saving.value = true
  try {
    const response = await useAPI<{ slug: string, ownerEmail: string | null }>('/api/link/owner', {
      method: 'POST',
      body: {
        slug: props.link.slug,
        ownerEmail: emailInput.value.trim() || null,
      },
    })
    pendingLink.value = { ...props.link, ownerEmail: response.ownerEmail }
    open.value = false
    toast(t('links.owner.reassign_success'))
  }
  catch (error) {
    console.error(error)
    toast.error(t('links.owner.reassign_failed'))
  }
  finally {
    saving.value = false
  }
}

function updateOpen(value: boolean) {
  if (!value && saving.value)
    return

  open.value = value
}

function handleCloseAutoFocus(event: Event) {
  emit('closeAutoFocus', event)

  const link = pendingLink.value
  if (!link)
    return

  pendingLink.value = null
  linksStore.notifyLinkUpdate(link, 'edit')
}
</script>

<template>
  <ResponsiveModal
    v-model:open="open"
    :title="t('links.owner.reassign')"
    :description="t('links.owner.reassign_description')"
    :prevent-close="saving"
    @close-auto-focus="handleCloseAutoFocus"
  >
    <div class="flex flex-col gap-2">
      <Label for="reassign-owner-email">{{ t('links.owner.email_label') }}</Label>
      <Input
        id="reassign-owner-email"
        v-model="emailInput"
        type="email"
        list="reassign-owner-suggestions"
        :placeholder="t('links.owner.email_placeholder')"
        :disabled="saving"
        @keydown.enter.prevent="save"
      />
      <datalist id="reassign-owner-suggestions">
        <option v-for="email in knownOwnerEmails" :key="email" :value="email" />
      </datalist>
      <Button
        v-if="emailInput"
        type="button"
        variant="link"
        class="h-auto w-fit px-0 text-xs"
        :disabled="saving"
        @click="emailInput = ''"
      >
        {{ t('links.owner.clear') }}
      </Button>
    </div>

    <template #footer>
      <Button
        type="button"
        variant="secondary"
        class="
          w-full
          sm:w-auto
        "
        :disabled="saving"
        @click="updateOpen(false)"
      >
        {{ $t('common.cancel') }}
      </Button>
      <Button
        type="button"
        class="
          w-full
          sm:w-auto
        "
        :disabled="saving"
        :aria-busy="saving"
        @click="save"
      >
        <Loader2 v-if="saving" class="motion-safe:animate-spin" aria-hidden="true" />
        {{ $t('common.save') }}
      </Button>
    </template>
  </ResponsiveModal>
</template>
