interface UserWithNames {
  legalFirstName: string | null
  legalLastName: string | null
  preferredFirstName: string | null
  preferredLastName: string | null
}

export function getDisplayName(user: UserWithNames): string {
  const first = user.preferredFirstName || user.legalFirstName || ''
  const last = user.preferredLastName || user.legalLastName || ''
  return `${first} ${last}`.trim()
}
