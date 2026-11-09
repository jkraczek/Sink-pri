import { z } from 'zod'
import { SlugSchema } from '#shared/schemas/link'

defineRouteMeta({
  openAPI: {
    description: 'Assign or reassign a link\'s owner. Admin only.',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['slug', 'ownerEmail'],
            properties: {
              slug: { type: 'string', description: 'The slug of the link to reassign' },
              ownerEmail: { type: 'string', nullable: true, description: 'New owner email, or null/empty to unassign' },
            },
          },
        },
      },
    },
  },
})

const SetOwnerSchema = z.object({
  slug: SlugSchema.min(1),
  ownerEmail: z.string().nullable(),
})

export default eventHandler(async (event) => {
  const body = await readValidatedBody(event, SetOwnerSchema.parse)

  if (!isAdmin(event)) {
    throw createError({ status: 403, statusText: 'Forbidden' })
  }

  const { previewMode } = useRuntimeConfig(event).public
  if (previewMode) {
    throw createError({
      status: 403,
      statusText: 'Preview mode cannot reassign link owners.',
    })
  }

  const slug = normalizeSlug(event, body.slug)
  const trimmed = body.ownerEmail?.trim() ?? ''
  const ownerEmail = trimmed ? trimmed.toLowerCase() : null

  if (ownerEmail && !z.string().email().safeParse(ownerEmail).success) {
    throw createError({ status: 400, statusText: 'Invalid owner email' })
  }

  const existingLink = await getAnyAuthoritativeLink(event, slug)
  if (!existingLink) {
    throw createError({
      status: 404,
      statusText: 'Link not found',
    })
  }

  await setLinkOwner(event, slug, ownerEmail)

  return { slug, ownerEmail }
})
