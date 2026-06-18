export async function POST() {
  const apiKey = process.env.API_VIDEO_KEY;
  if (!apiKey) {
    return Response.json({ error: "API_VIDEO_KEY not configured" }, { status: 500 });
  }

  const res = await fetch("https://ws.api.video/upload-tokens", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ttl: 3600 }),
  });

  if (!res.ok) {
    const text = await res.text();
    return Response.json({ error: `api.video error: ${text}` }, { status: 500 });
  }

  const data = await res.json();
  return Response.json({ token: data.token });
}
