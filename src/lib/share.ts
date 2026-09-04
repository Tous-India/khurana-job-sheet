/**
 * WhatsApp sharing (README 7). Chosen over email deliberately: the customer
 * base uses it universally, and it needs no email service, no domain
 * verification and no per-message cost.
 */

export function pdfUrlFor(shareToken: string, baseUrl?: string): string {
  const base =
    baseUrl ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base.replace(/\/$/, '')}/job/${shareToken}/pdf`
}

export function whatsappMessage(input: {
  contactPerson: string
  jobNo: string
  date: Date
  pdfUrl: string
}): string {
  const date = input.date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  return [
    `Namaste ${input.contactPerson},`,
    '',
    'Your job sheet from Khurana Electronics is ready.',
    `Job No: ${input.jobNo}`,
    `Date: ${date}`,
    '',
    `View / download: ${input.pdfUrl}`,
    '',
    'Thank you for your business.',
    'Khurana Electronics, Sonipat',
    '0130-4018060 | 9053000270',
  ].join('\n')
}

/**
 * Indian numbers are stored as 10 digits; wa.me needs the country code and no
 * punctuation. A missing or malformed number still yields a valid link that
 * opens WhatsApp's contact picker rather than failing.
 */
export function whatsappHref(input: {
  mobileNo: string
  contactPerson: string
  jobNo: string
  date: Date
  pdfUrl: string
}): string {
  const digits = input.mobileNo.replace(/\D/g, '')
  const withCode = digits.length === 10 ? `91${digits}` : digits
  const text = encodeURIComponent(whatsappMessage(input))
  return withCode ? `https://wa.me/${withCode}?text=${text}` : `https://wa.me/?text=${text}`
}
