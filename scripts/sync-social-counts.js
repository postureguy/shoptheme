#!/usr/bin/env node
/**
 * PGM — Social Follower Count Sync
 * ==================================
 * Fetches real follower counts from YouTube, Instagram, Facebook, and TikTok,
 * then updates the Shopify theme with the live numbers.
 *
 * Run manually:  node scripts/sync-social-counts.js
 * Run on a schedule: add to cron or use `npm run sync-counts`
 *
 * ── SETUP ──────────────────────────────────────────────────────────────────
 *
 * 1. YOUTUBE (free Google API key — no billing required)
 *    → Go to: https://console.cloud.google.com
 *    → Create project → Enable "YouTube Data API v3" → Create API Key
 *    → export GOOGLE_API_KEY=AIza...
 *
 * 2. INSTAGRAM + FACEBOOK (same Facebook Page access token)
 *    → Go to: https://developers.facebook.com/tools/explorer
 *    → Select your app (or create one) → select your Page
 *    → Add permissions: pages_read_engagement, instagram_basic
 *    → Click "Generate Access Token" → exchange for long-lived token:
 *      curl "https://graph.facebook.com/oauth/access_token?
 *        grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET
 *        &fb_exchange_token=SHORT_TOKEN"
 *    → Get your Page token (never expires):
 *      curl "https://graph.facebook.com/me/accounts?access_token=LONG_TOKEN"
 *    → export FACEBOOK_ACCESS_TOKEN=EAAx...   (the page token)
 *    → export FACEBOOK_PAGE_ID=postureguymike  (your page name or numeric ID)
 *    → export INSTAGRAM_USER_ID=17841...       (from Graph API: /me?fields=instagram_business_account)
 *
 * 3. TIKTOK (unofficial — no API key needed, best-effort)
 *    TikTok does not expose follower counts via their official API for standard accounts.
 *    This script uses TikTok's internal web API (same one their site uses).
 *    It works today but may break if TikTok changes their endpoints.
 *    → No setup needed — just works.
 *
 * 4. SHOPIFY (to auto-update the theme with new counts)
 *    → export SHOPIFY_STORE=postureguymike.myshopify.com
 *    → export SHOPIFY_ACCESS_TOKEN=shpat_...
 *    → SHOPIFY_THEME_ID is auto-detected (your most recent dev theme)
 *       or set: export SHOPIFY_THEME_ID=160349159649
 * ──────────────────────────────────────────────────────────────────────────
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// Auto-load .env file from project root
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
    const [key, ...rest] = line.replace(/^export\s+/, '').split('=');
    if (key && !key.startsWith('#') && rest.length) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  });
}

const COUNTS_FILE = path.join(__dirname, '..', 'generated-images', '.social-counts.json');

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const CONFIG = {
  youtube: {
    apiKey:    process.env.GOOGLE_API_KEY,
    handle:    'postureguymike',   // your YouTube handle (without @)
  },
  facebook: {
    token:     process.env.FACEBOOK_ACCESS_TOKEN,
    pageId:    process.env.FACEBOOK_PAGE_ID || 'posturestrong',
  },
  instagram: {
    token:     process.env.FACEBOOK_ACCESS_TOKEN,  // same token
    userId:    process.env.INSTAGRAM_USER_ID,       // IG business account ID
  },
  tiktok: {
    username:  'postureguy',   // TikTok handle (without @)
  },
  shopify: {
    store:     process.env.SHOPIFY_STORE,
    token:     process.env.SHOPIFY_ACCESS_TOKEN,
    themeId:   process.env.SHOPIFY_THEME_ID,
  },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: { 'User-Agent': 'Mozilla/5.0', ...headers },
    };
    https.get(options, (res) => {
      let data = '';
      if (res.statusCode === 301 || res.statusCode === 302) {
        return get(res.headers.location, headers).then(resolve).catch(reject);
      }
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    }).on('error', reject);
  });
}

function apiCall(method, hostname, urlPath, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const options = {
      hostname, path: urlPath, method,
      headers: {
        'Content-Type': 'application/json',
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        ...headers,
      },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function formatCount(n) {
  if (!n || isNaN(n)) return null;
  n = parseInt(n);
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

// ─── FETCHERS ────────────────────────────────────────────────────────────────

async function fetchYouTube() {
  if (!CONFIG.youtube.apiKey) {
    return { count: null, formatted: null, error: 'No GOOGLE_API_KEY set' };
  }
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&forHandle=${CONFIG.youtube.handle}&key=${CONFIG.youtube.apiKey}`;
    const res = await get(url);
    const subs = res.body?.items?.[0]?.statistics?.subscriberCount;
    if (!subs) throw new Error(`Unexpected response: ${JSON.stringify(res.body)}`);
    return { count: parseInt(subs), formatted: formatCount(subs) };
  } catch (e) {
    return { count: null, formatted: null, error: e.message };
  }
}

async function fetchFacebook() {
  if (!CONFIG.facebook.token) {
    return { count: null, formatted: null, error: 'No FACEBOOK_ACCESS_TOKEN set' };
  }
  try {
    const url = `https://graph.facebook.com/v19.0/${CONFIG.facebook.pageId}?fields=fan_count,followers_count&access_token=${CONFIG.facebook.token}`;
    const res = await get(url);
    const count = res.body?.followers_count || res.body?.fan_count;
    if (!count) throw new Error(res.body?.error?.message || JSON.stringify(res.body));
    return { count, formatted: formatCount(count) };
  } catch (e) {
    return { count: null, formatted: null, error: e.message };
  }
}

async function fetchInstagram() {
  if (!CONFIG.instagram.token || !CONFIG.instagram.userId) {
    return { count: null, formatted: null, error: 'No FACEBOOK_ACCESS_TOKEN or INSTAGRAM_USER_ID set' };
  }
  try {
    const url = `https://graph.facebook.com/v19.0/${CONFIG.instagram.userId}?fields=followers_count,username&access_token=${CONFIG.instagram.token}`;
    const res = await get(url);
    const count = res.body?.followers_count;
    if (!count) throw new Error(res.body?.error?.message || JSON.stringify(res.body));
    return { count, formatted: formatCount(count) };
  } catch (e) {
    return { count: null, formatted: null, error: e.message };
  }
}

async function fetchTikTok() {
  // TikTok has no official public API for follower counts.
  // This uses TikTok's internal web endpoint — works today, no guarantees.
  try {
    const url = `https://www.tiktok.com/api/user/detail/?uniqueId=${CONFIG.tiktok.username}&msToken=&X-Bogus=`;
    const res = await get(url, {
      'Referer': 'https://www.tiktok.com/',
      'Accept': 'application/json, text/plain, */*',
    });

    const count = res.body?.userInfo?.stats?.followerCount;
    if (count !== undefined) {
      return { count, formatted: formatCount(count) };
    }

    // Fallback: try scraping the profile page for follower count in meta tags
    const pageRes = await get(`https://www.tiktok.com/@${CONFIG.tiktok.username}`, {
      'Accept': 'text/html',
    });
    const match = String(pageRes.body).match(/"followerCount":(\d+)/);
    if (match) {
      return { count: parseInt(match[1]), formatted: formatCount(match[1]) };
    }

    return { count: null, formatted: null, error: 'TikTok API returned unexpected format (may need updating)' };
  } catch (e) {
    return { count: null, formatted: null, error: e.message };
  }
}

// ─── SHOPIFY UPDATER ─────────────────────────────────────────────────────────

async function getThemeId() {
  if (CONFIG.shopify.themeId) return CONFIG.shopify.themeId;

  const res = await apiCall('GET', CONFIG.shopify.store, '/admin/api/2024-01/themes.json', null, {
    'X-Shopify-Access-Token': CONFIG.shopify.token,
  });

  // Find the dev/unpublished theme (role: 'unpublished' or most recently updated)
  const themes = res.body?.themes || [];
  const unpublished = themes
    .filter(t => t.role === 'unpublished' || t.role === 'development')
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  if (!unpublished.length) {
    // Fall back to most recently updated theme
    return themes.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0]?.id;
  }
  return unpublished[0].id;
}

async function updateShopifyTheme(counts) {
  if (!CONFIG.shopify.store || !CONFIG.shopify.token) {
    console.log('  Shopify env not set — skipping theme update.');
    return false;
  }

  try {
    const themeId = await getThemeId();
    if (!themeId) throw new Error('Could not find theme ID');

    // Fetch current templates/index.json
    const assetRes = await apiCall(
      'GET',
      CONFIG.shopify.store,
      `/admin/api/2024-01/themes/${themeId}/assets.json?asset[key]=templates/index.json`,
      null,
      { 'X-Shopify-Access-Token': CONFIG.shopify.token }
    );

    const currentValue = assetRes.body?.asset?.value;
    if (!currentValue) throw new Error('Could not fetch templates/index.json from Shopify');

    let template = JSON.parse(currentValue);

    // Update social bar counts
    if (template.sections?.pgm_social_bar?.settings) {
      const s = template.sections.pgm_social_bar.settings;
      if (counts.instagram?.formatted) s.ig_count = counts.instagram.formatted;
      if (counts.tiktok?.formatted)    s.tt_count = counts.tiktok.formatted;
      if (counts.youtube?.formatted)   s.yt_count = counts.youtube.formatted;
      if (counts.facebook?.formatted)  s.fb_count = counts.facebook.formatted;
    }

    // Update instagram section counts
    if (template.sections?.pgm_instagram?.settings) {
      const s = template.sections.pgm_instagram.settings;
      if (counts.instagram?.formatted) s.ig_count = counts.instagram.formatted;
      if (counts.tiktok?.formatted)    s.tt_count = counts.tiktok.formatted;
      if (counts.youtube?.formatted)   s.yt_count = counts.youtube.formatted;
      if (counts.facebook?.formatted)  s.fb_count = counts.facebook.formatted;
    }

    // Push updated template back to Shopify
    const pushRes = await apiCall(
      'PUT',
      CONFIG.shopify.store,
      `/admin/api/2024-01/themes/${themeId}/assets.json`,
      { asset: { key: 'templates/index.json', value: JSON.stringify(template, null, 2) } },
      { 'X-Shopify-Access-Token': CONFIG.shopify.token }
    );

    if (pushRes.status === 200) {
      return true;
    } else {
      throw new Error(`Shopify returned ${pushRes.status}: ${JSON.stringify(pushRes.body)}`);
    }
  } catch (e) {
    console.error(`  Shopify update failed: ${e.message}`);
    return false;
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n  PGM — Social Count Sync');
  console.log('  ─────────────────────────\n');

  // Fetch all platforms in parallel
  const [youtube, instagram, facebook, tiktok] = await Promise.all([
    fetchYouTube().then(r  => { logResult('YouTube',   r); return r; }),
    fetchInstagram().then(r => { logResult('Instagram', r); return r; }),
    fetchFacebook().then(r  => { logResult('Facebook',  r); return r; }),
    fetchTikTok().then(r    => { logResult('TikTok',    r); return r; }),
  ]);

  const counts = { youtube, instagram, facebook, tiktok, fetchedAt: new Date().toISOString() };

  // Save to local file for reference
  fs.mkdirSync(path.dirname(COUNTS_FILE), { recursive: true });
  fs.writeFileSync(COUNTS_FILE, JSON.stringify(counts, null, 2));

  // Push to Shopify
  console.log('\n  Updating Shopify theme...');
  const updated = await updateShopifyTheme(counts);

  if (updated) {
    console.log('  ✓ Shopify theme updated with live counts\n');
  } else {
    // Print manual update instructions
    console.log('\n  Manual update — copy these into Theme Editor → Social Bar / Instagram sections:\n');
    if (instagram.formatted) console.log(`  Instagram:  ${instagram.formatted}`);
    if (tiktok.formatted)    console.log(`  TikTok:     ${tiktok.formatted}`);
    if (youtube.formatted)   console.log(`  YouTube:    ${youtube.formatted}`);
    if (facebook.formatted)  console.log(`  Facebook:   ${facebook.formatted}`);
    console.log();
  }
}

function logResult(platform, result) {
  if (result.formatted) {
    console.log(`  ${platform.padEnd(12)} ${result.formatted.padStart(6)}  (${result.count?.toLocaleString()})`);
  } else {
    console.log(`  ${platform.padEnd(12)} ⚠️  ${result.error}`);
  }
}

main().catch(e => { console.error('\n  Fatal:', e.message); process.exit(1); });
