export function getDisplayName(user: {
  legalFirstName?: string | null
  legalLastName?: string | null
  preferredFirstName?: string | null
  preferredLastName?: string | null
  name?: string | null
}): string {
  const first = user.preferredFirstName || user.legalFirstName
  const last = user.preferredLastName || user.legalLastName
  if (first && last) return `${first} ${last}`
  if (first) return first
  return user.name ?? ''
}
