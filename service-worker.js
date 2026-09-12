/**
 * LeLeTV — Service Worker 退役文件（kill switch）
 *
 * 背景：
 *   本项目在 2026-05-19 之前曾注册过 Service Worker（提交 503c498 移除了注册调用），
 *   但「删掉注册代码」并不会让已经装进老访客浏览器的 SW 消失 —— 它会继续拦截请求
 *   （包括视频分片），拖慢播放。本文件唯一的用途是：让那些残留的旧 SW 在更新到
 *   本版本后，立即注销自己并清空缓存。
 *
 * 重要：
 *   - 本站没有任何代码注册本文件，它对新访客零影响；
 *   - 它的职责就是「什么都不做，然后把自己删掉」，因此请勿在此添加任何
 *     fetch / cache / 离线逻辑；
 *   - 待老访客基本清理完毕后（通常数月），本文件可以直接删除。
 */

self.addEventListener('install', () => {
  // 跳过 waiting，立即进入 activating，以便尽快执行注销
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // 1) 清空本 SW 创建过的所有缓存
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    } catch (e) { /* 静默处理 */ }

    // 2) 注销自身
    try {
      await self.registration.unregister();
    } catch (e) { /* 静默处理 */ }

    // 3) 刷新仍被本 SW 控制的页面，使其脱离 SW 上下文
    //    注意：unregister() 不会解除已打开页面的控制，必须重新导航一次
    try {
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(client => {
        if (typeof client.navigate === 'function') {
          client.navigate(client.url).catch(() => {});
        }
      });
    } catch (e) { /* 静默处理 */ }
  })());
});
