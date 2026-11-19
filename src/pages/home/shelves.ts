/**
 * 首页内容：继续观看、片源数，以及给聚合动效供海报（本周热门榜只用来喂海报）。
 * 点击行为复用现有的事件委托：
 *   - data-action="tmdb-search-video" + data-title → 进入结果页搜索
 *   - data-action="play-from-history" + data-url/title/index/position → 续播
 */

import { API_SITES, isHiddenContentMode, scopedKey, selectedAPIs } from '../../core/state';
import { TMDB_IMAGE_BASE } from '../../core/config';
import { HubFlow } from './hub-flow';
import type { HubFlowApi, HubStage } from './hub-flow';

interface TrendPoster {
  title: string;
  year: string;
  type: string;
  rating: string;
  img: string;
}

interface TrendSourceItem {
  title?: string;
  name?: string;
  media_type?: string;
  poster_path?: string;
  vote_count?: number;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

interface PosterCardOptions {
  action: string;
  data?: Record<string, string | number | undefined>;
  title: string;
  label?: string;
  sub?: string;
  img?: string;
  badge?: string;
  rating?: string;
  votes?: string;
  progress?: number;
}

export interface HomeShelvesApi {
  ensure: () => Promise<void> | null;
  refresh: () => void;
  loadTrending: () => Promise<TrendPoster[]>;
  posterCard: (opts: PosterCardOptions) => HTMLElement;
  skeletons: (n: number) => DocumentFragment;
  tmdbImage: (path?: string) => string;
}

interface HomeShelvesWindow extends Window {
  HomeShelves?: HomeShelvesApi;
}

export const HomeShelves: HomeShelvesApi = (function (): HomeShelvesApi {
  'use strict';

  const CONTINUE_LIMIT = 6;
  let trendingPromise: Promise<TrendPoster[]> | null = null;

  function el(tag: string, className: string | null, text?: string | number | null): HTMLElement {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function isPrivateMode(): boolean {
    return isHiddenContentMode();
  }

  function isSafeImageUrl(url: unknown): url is string {
    return typeof url === 'string' && /^https?:\/\//.test(url);
  }

  function cssUrl(url: string): string {
    return 'url("' + url.replace(/["\\\n\r]/g, '') + '")';
  }

  function tmdbImage(path?: string): string {
    const base = (typeof TMDB_CONFIG === 'object' && TMDB_CONFIG && TMDB_CONFIG.imageBase) || TMDB_IMAGE_BASE;
    return path ? base + '/w342' + path : '';
  }

  function formatClock(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = String(s % 60).padStart(2, '0');
    return h ? h + ':' + String(m).padStart(2, '0') + ':' + sec : m + ':' + sec;
  }

  function loadTrending(): Promise<TrendPoster[]> {
    if (trendingPromise) return trendingPromise;
    const request: Promise<{ results?: TrendSourceItem[] }> = typeof tmdbFetch === 'function'
      ? tmdbFetch('trending/all/week', {})
      : fetch('/api/tmdb?endpoint=trending%2Fall%2Fweek').then(res => {
          if (!res.ok) throw new Error('TMDB ' + res.status);
          return res.json();
        });
    trendingPromise = request
      .then(data => (data && Array.isArray(data.results) ? data.results : [])
        .filter(item => item && item.poster_path && (item.title || item.name) && (item.media_type === 'movie' || item.media_type === 'tv'))
        .map(item => ({
          title: String(item.title || item.name).trim(),
          year: String(item.release_date || item.first_air_date || '').slice(0, 4),
          type: item.media_type === 'tv' ? '剧集' : '电影',
          rating: (item.vote_count ?? 0) >= 100 && item.vote_average ? item.vote_average.toFixed(1) : '',
          img: tmdbImage(item.poster_path)
        })))
      .catch((err): TrendPoster[] => {
        console.warn('[home] 本周热门加载失败', err);
        return [];
      });
    return trendingPromise;
  }

  /**
   * 海报卡片：按钮 + 2:3 海报 + 片名 + 辅助信息
   * opts.badge   海报左上角的小标签
   * opts.rating  海报底部评分条的分数（如「7.0」），opts.votes 为评价人数文字；给了 rating 才画评分条
   * opts.progress 0～1 的观看进度条
   */
  /**
   * 海报懒加载 + 尺寸降级
   *
   * 首页一次渲染 20+ 张封面（「最近更新」四行 + 本周热门 + 继续观看），全部直连
   * image.tmdb.org。跨境线路上一张 w342 封面 30~60KB，20 张就是 1MB 量级，会和
   * 首屏 CSS/JS 抢带宽，把「启动慢」放大成「海报一行行往外蹦」。这里做两件事：
   *   1. 卡片进入视口（提前 300px）才写 --poster，没滚到的行不发请求
   *   2. 支持 image-set 的浏览器 1x 取 w185、2x 取 w342，1 倍屏省掉一半流量
   */
  const lazyLoaders = new Map<HTMLElement, () => void>();
  let posterObserver: IntersectionObserver | null = null;
  let imageSetSupport: boolean | null = null;

  function supportsImageSet(): boolean {
    if (imageSetSupport === null) {
      try {
        imageSetSupport = typeof CSS !== 'undefined'
          && typeof CSS.supports === 'function'
          && CSS.supports('background-image', 'image-set(url("x") 1x)');
      } catch (e) {
        imageSetSupport = false;
      }
    }
    return imageSetSupport;
  }

  /** --poster 的取值，以及用于探测 404 的那张图（必须和 CSS 实际取的一致，别多下一张） */
  function posterCandidates(url: string): { bg: string; probe: string } {
    const small = url.replace('/w342/', '/w185/');
    if (small === url || !supportsImageSet()) return { bg: cssUrl(url), probe: url };
    const dpr = window.devicePixelRatio || 1;
    return {
      bg: 'image-set(' + cssUrl(small) + ' 1x, ' + cssUrl(url) + ' 2x)',
      probe: dpr < 1.5 ? small : url
    };
  }

  function observePoster(card: HTMLElement, load: () => void): void {
    if (typeof IntersectionObserver !== 'function') { load(); return; }
    if (!posterObserver) {
      posterObserver = new IntersectionObserver(function (entries) {
        const observer = posterObserver;
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const target = entry.target as HTMLElement;
          if (observer) observer.unobserve(target);
          const run = lazyLoaders.get(target);
          lazyLoaders.delete(target);
          if (run) run();
        });
      }, { rootMargin: '300px 0px' });
    }
    lazyLoaders.set(card, load);
    posterObserver.observe(card);
  }

  function posterCard(opts: PosterCardOptions): HTMLElement {
    const card = el('button', 'v2-pcard') as HTMLButtonElement;
    card.type = 'button';
    card.dataset.action = opts.action;
    const data = opts.data || {};
    Object.keys(data).forEach(key => { card.dataset[key] = String(data[key]); });
    card.setAttribute('aria-label', opts.label || opts.title);

    const poster = el('div', 'v2-poster');
    const initial = el('span', 'v2-initial', opts.title.slice(0, 1));
    if (isSafeImageUrl(opts.img)) {
      const url = opts.img;
      observePoster(card, function () {
        const pick = posterCandidates(url);
        card.style.setProperty('--poster', pick.bg);
        // 封面 404 / 被拦时换成片名首字占位，不中断渲染
        const probe = new Image();
        probe.onerror = () => {
          card.style.removeProperty('--poster');
          card.classList.add('is-noimg');
          poster.insertBefore(initial, poster.firstChild);
        };
        probe.src = pick.probe;
      });
    } else {
      card.classList.add('is-noimg');
      poster.appendChild(initial);
    }
    if (opts.badge) poster.appendChild(el('span', 'v2-badge', opts.badge));
    if (opts.rating !== undefined) {
      const rate = el('span', 'v2-rate');
      if (opts.rating) {
        rate.appendChild(el('b', null, '★ ' + opts.rating));
        rate.appendChild(el('i', null, opts.votes || ''));
      } else {
        rate.classList.add('is-none');
        rate.textContent = '暂无评分';
      }
      poster.appendChild(rate);
    }
    if (typeof opts.progress === 'number') {
      poster.appendChild(el('span', 'v2-scrim'));
      const bar = el('span', 'v2-progress');
      const fill = el('i', null);
      fill.style.width = Math.round(Math.min(1, Math.max(0.02, opts.progress)) * 100) + '%';
      bar.appendChild(fill);
      poster.appendChild(bar);
    }
    card.appendChild(poster);
    card.appendChild(el('h3', null, opts.title));
    card.appendChild(el('p', null, opts.sub || ''));
    return card;
  }

  function skeletons(n: number): DocumentFragment {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const card = el('div', 'v2-pcard v2-skel');
      card.setAttribute('aria-hidden', 'true');
      card.appendChild(el('div', 'v2-poster'));
      card.appendChild(el('h3', null, '　'));
      card.appendChild(el('p', null, '　'));
      frag.appendChild(card);
    }
    return frag;
  }

  /** 首屏副标题里的片源数：只数正常域里已启用的资源站（私密源不计入、不暴露） */
  function renderSourceCount(): void {
    const target = document.getElementById('heroSourceCount');
    if (!target) return;
    let count = 0;
    if (!isPrivateMode()) {
      try {
        const stored = localStorage.getItem(scopedKey('selectedAPIs'));
        const keys: unknown[] = stored ? JSON.parse(stored) : selectedAPIs;
        const customs = JSON.parse(localStorage.getItem(scopedKey('customAPIs')) || '[]');
        count = keys.filter(key => {
          if (typeof key !== 'string') return false;
          if (key.startsWith('custom_')) {
            const api = customs[parseInt(key.slice(7), 10)];
            return !!api && !api.isHidden;
          }
          const site = typeof API_SITES === 'object' && API_SITES ? API_SITES[key] : null;
          return !!site && !site.hidden;
        }).length;
      } catch (e) {
        console.warn('[home] 读取已启用片源失败', e);
      }
    }
    target.textContent = count > 0 ? ' ' + count + ' 个资源站' : '多个资源站';
  }

  function renderContinue(): void {
    const section = document.getElementById('homeContinue');
    const grid = document.getElementById('homeContinueList');
    if (!section || !grid) return;
    const history = typeof getViewingHistory === 'function' ? getViewingHistory() : [];
    const items = history
      .filter(item => item && item.title && item.url)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, CONTINUE_LIMIT);
    if (!items.length) { section.hidden = true; grid.replaceChildren(); return; }
    const frag = document.createDocumentFragment();
    items.forEach(item => {
      const index = parseInt(String(item.episodeIndex), 10) || 0;
      const position = Math.floor(item.playbackPosition || 0);
      const duration = item.duration ?? 0;
      const isSeries = Array.isArray(item.episodes) && item.episodes.length > 1;
      frag.appendChild(posterCard({
        action: 'play-from-history',
        data: { url: item.url, title: item.title, index, position },
        title: item.title,
        label: '继续播放 ' + item.title,
        sub: (isSeries ? '第 ' + (index + 1) + ' 集 · ' : '') + '看到 ' + formatClock(position),
        img: item.cover,
        progress: duration > 0 ? position / duration : undefined
      }));
    });
    grid.replaceChildren(frag);
    section.hidden = false;
  }

  // 设置 › 首页与导航：关掉的板块首帧就由 css 隐藏（html 上的 data-home-* 属性），这里顺带不去建节点、不发请求
  function hubEnabled(): boolean { return document.documentElement.getAttribute('data-home-hub') !== 'off'; }
  function shelvesEnabled(): boolean { return document.documentElement.getAttribute('data-home-shelves') !== 'off'; }

  let hub: HubFlowApi | null = null;

  /** 聚合动效按需初始化：关着时不建那一百多个节点，打开时再建并喂海报（只建一次） */
  function ensureHub(): void {
    if (hub || !hubEnabled()) return;
    hub = HubFlow.init(document.getElementById('hubFlow') as HubStage | null) || null;
    const hubApi = hub;
    if (!hubApi) return;
    if (isPrivateMode()) { hubApi.usePlaceholders(); return; }   // 私密模式不展示 TMDB 内容，动效改用占位海报
    loadTrending().then(list => {
      if (list.length) hubApi.setPosters(list);
      else hubApi.usePlaceholders();
    });
  }

  var started = false;
  var ready: Promise<void> | null = null;

  function init(): Promise<void> | null {
    if (started) return ready;
    started = true;
    if (shelvesEnabled()) renderContinue();
    // 打包脚本是 defer 执行的，这时 DOMContentLoaded 还没派发；首访的默认片源由 app.js 在那之后写入
    if (document.readyState === 'complete') renderSourceCount();
    else document.addEventListener('DOMContentLoaded', () => setTimeout(renderSourceCount, 0), { once: true });
    ensureHub();
    // 首页内容主体是「最近更新」；聚合动效的 trending 海报只做装饰，
    // ensure() 不等它，避免慢请求把进入首页的时间一起拖住。
    ready = Promise.resolve();
    return ready;
  }

  // 从播放页返回、或切回首页时刷新「继续观看」；设置里刚打开的板块这时补建
  window.addEventListener('pageshow', event => { if (event.persisted && shelvesEnabled()) renderContinue(); });
  document.addEventListener('click', event => {
    const target = (event.target as HTMLElement).closest && (event.target as HTMLElement).closest('[data-action="switch-page"][data-page="home"]');
    if (target) setTimeout(() => { if (shelvesEnabled()) renderContinue(); renderSourceCount(); ensureHub(); }, 0);
  });
  window.addEventListener('leletv:layoutchange', () => { ensureHub(); if (shelvesEnabled()) renderContinue(); });

  // 启动流程缺席（脚本被拦截 / 异常）时的兜底：8 秒后自己开始。
  // 正常路径下 boot-sequence.js 在鉴权通过后调用 ensure()，这里的重复调用是幂等的。
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 8000); }, { once: true });
  } else {
    setTimeout(init, 8000);
  }

  return {
    ensure: init,
    refresh: renderContinue,
    loadTrending: loadTrending,
    posterCard: posterCard,
    skeletons: skeletons,
    tmdbImage: tmdbImage
  };
})();

// recent 同页直接 import；boot 与 HTML 内联脚本仍按全局名访问
(window as HomeShelvesWindow).HomeShelves = HomeShelves;
