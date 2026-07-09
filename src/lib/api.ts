export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = "ApiError"
  }
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const { headers: optionHeaders, ...restOptions } = options || {}
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...optionHeaders,
    },
    ...restOptions,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(body.error || `Request failed with status ${res.status}`, res.status)
  }

  return res.json()
}
