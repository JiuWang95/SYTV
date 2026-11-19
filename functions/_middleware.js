// Cloudflare Pages Functions 使用的 sha256 实现
// 注意：Cloudflare Pages Functions 运行在 Workers 环境中，不能直接导入前端 JS 文件
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 从 HTML 里取出 <link rel="modulepreload"> 的 href
// 浏览器解析 body 里的 link 要等 HTML 到手；把这些改写成响应头里的 Link，
// Cloudflare 的 Early Hints 才有东西可发（线上原先只有 7 个空 href 的 Link 头）
function modulepreloadHrefs(html) {
  const hrefs = [];
  const tagRe = /<link\b[^>]*>/gi;
  let match;
  while ((match = tagRe.exec(html)) !== null) {
    const tag = match[0];
    if (!/rel=["']modulepreload["']/i.test(tag)) continue;
    const href = /href=["']([^"']+)["']/i.exec(tag);
    if (href && href[1] && hrefs.indexOf(href[1]) === -1) hrefs.push(href[1]);
  }
  return hrefs;
}

function earlyHintLinkHeader(html, origin) {
  const values = [];
  for (const href of modulepreloadHrefs(html).slice(0, 10)) {
    let absolute;
    try {
      absolute = new URL(href, origin).href;
    } catch (e) {
      continue;
    }
    values.push('<' + absolute + '>; rel=modulepreload; as=script');
  }
  return values.join(', ');
}

export async function onRequest(context) {
  try {
    const { request, env, next } = context;
    const response = await next();
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('text/html')) {
      return response;
    }

    let html = await response.text();

    const password = env.HIDDENKEY || '';
    let passwordHash = '';
    if (password) {
      passwordHash = await sha256(password);
    }
    html = html.replace('window.__ENV__.HIDDENKEY = "{{HIDDENKEY}}";',
      `window.__ENV__.HIDDENKEY = "${passwordHash}";`);

    const tmdbWorkerUrl = env.TMDB_WORKER_URL || '';
    html = html.replace('window.__ENV__.TMDB_WORKER_URL = "{{TMDB_WORKER_URL}}";',
      `window.__ENV__.TMDB_WORKER_URL = "${tmdbWorkerUrl}";`);

    const headers = new Headers(response.headers);
    const linkHeader = earlyHintLinkHeader(html, new URL(request.url).origin);
    if (linkHeader) headers.set('Link', linkHeader);

    return new Response(html, {
      headers,
      status: response.status,
      statusText: response.statusText,
    });
  } catch (error) {
    console.error('[Middleware Error]', error);
    try {
      const { next } = context;
      return await next();
    } catch {
      return new Response('Service temporarily unavailable', { status: 503 });
    }
  }
}
