async function req(
  path,
  { method = "GET", body, auth = true, headers: extraHeaders = {} } = {},
  retry = true
) {
  if (!API_BASE) {
    console.error("❌ API_BASE is missing");
    throw new Error("API base URL not configured");
  }

  const headers = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await withTimeout(
      fetch(joinUrl(API_BASE, path), {
        method,
        headers,
        credentials: "include",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    );

    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      console.error("❌ API ERROR:", res.status, data);
      throw new Error(
        data?.message ||
        data?.error ||
        `Request failed (${res.status})`
      );
    }

    return data;

  } catch (err) {
    console.error("❌ NETWORK ERROR:", err);
    throw err;
  }
}
