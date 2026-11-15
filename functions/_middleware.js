export async function onRequest(context) {
  const response = await context.next();
  const host = new URL(context.request.url).hostname;
  if (host.endsWith(".pages.dev")) {
    const res = new Response(response.body, response);
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }
  return response;
}
