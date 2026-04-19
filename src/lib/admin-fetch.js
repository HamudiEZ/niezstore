export async function fetchJson(url, options) {
  const headers = { ...(options?.headers ?? {}) };
  if (options?.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Ocurrio un error inesperado.");
  }
  return data;
}
