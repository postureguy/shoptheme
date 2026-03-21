#!/usr/bin/env node
/**
 * PGM — Full Image Pipeline
 * =========================
 * One command that does everything:
 *   1. (Optional) Trains a Flux LoRA on Mike's reference photos
 *   2. Generates all site images using Mike's likeness
 *   3. Uploads images to your Shopify store CDN
 *   4. Updates section liquid files with the real CDN image URLs
 *
 * Setup (one time):
 *   export REPLICATE_API_TOKEN=r8_...
 *   export SHOPIFY_STORE=postureguymike.myshopify.com
 *   export SHOPIFY_ACCESS_TOKEN=shpat_...
 *
 * Usage:
 *   node scripts/pgm-pipeline.js --step all          # full pipeline
 *   node scripts/pgm-pipeline.js --step train        # just train the LoRA
 *   node scripts/pgm-pipeline.js --step generate     # just generate images
 *   node scripts/pgm-pipeline.js --step upload       # just upload to Shopify
 *   node scripts/pgm-pipeline.js --step update       # just update site files
 *   node scripts/pgm-pipeline.js --lora r8_abc123    # skip training, use existing LoRA
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');

// Auto-load .env from project root
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
    const [key, ...rest] = line.replace(/^export\s+/, '').split('=');
    if (key && !key.startsWith('#') && rest.length) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  });
}

// ─── PATHS ────────────────────────────────────────────────────────────────────

const ROOT          = path.join(__dirname, '..');
const REF_DIR       = path.join(ROOT, 'photos-of-mike');
const OUT_DIR       = path.join(ROOT, 'generated-images');
const STATE_FILE    = path.join(ROOT, 'generated-images', '.pipeline-state.json');
const SECTIONS_DIR  = path.join(ROOT, 'sections');

// ─── IMAGE PROMPTS ────────────────────────────────────────────────────────────
// Each entry defines: where it's used, which section file to update, and the prompt.
// LORA_TRIGGER is replaced with your trained model's trigger word.

const LORA_TRIGGER = 'PGMIKE'; // this is set during training

const IMAGES = [
  {
    key:     'hero',
    label:   'Hero — Side Profile Perfect Alignment',
    aspect:  '16:9',
    section: 'pgm-hero.liquid',
    placeholder: 'HERO_BG_URL',
    // Strict side-profile is THE signature posture shot — shows full spinal alignment
    // Positioned right so left 2/3 is open for headline text
    prompt:  `${LORA_TRIGGER} photographed in strict LEFT side profile, standing in perfect
postural alignment against a clean white studio backdrop — ears stacked over shoulders, shoulders
stacked over hips, hips over ankles, spine long and neutral, arms relaxed at sides, chin level,
not looking at camera, wearing a fitted charcoal grey athletic t-shirt and dark athletic pants,
barefoot, soft diffused studio lighting from slightly above and in front, no harsh shadows,
subject fills the RIGHT third of a wide 16:9 frame leaving the LEFT two-thirds as open negative
space for text overlay, clinical lifestyle photography, photorealistic`,
  },
  {
    key:     'about',
    label:   'About — Coaching Wall Posture Check',
    aspect:  '4:5',
    section: 'pgm-about.liquid',
    placeholder: 'ABOUT_IMG_URL',
    // Wall alignment check is Mike's foundational move — instantly signals what he does
    prompt:  `${LORA_TRIGGER} standing to the side of a client who has their back flat against a
white wall doing a posture alignment check — heels, calves, glutes, upper back, and head all
touching the wall, ${LORA_TRIGGER} has one hand on the client's shoulder and is leaning in
slightly coaching them, face in 3/4 profile angled toward the client, warm focused expression,
wearing a dark navy zip-up athletic jacket and black pants, client wearing a light grey t-shirt,
bright clean room with natural window light, 4:5 portrait, editorial coaching photography,
photorealistic`,
  },
  {
    key:     'ig_1',
    label:   'Instagram 1 — Posture Board Exercise',
    aspect:  '1:1',
    section: 'pgm-instagram.liquid',
    placeholder: 'IG_1_URL',
    // The Posture Board is Mike's signature product — must show this
    prompt:  `${LORA_TRIGGER} standing on a wooden incline slant board (posture board) with feet
fist-width apart slightly pigeon-toed, back flat against a white wall behind them, heels lower
than toes on the incline, spine pressed against the wall, arms relaxed at sides, head in neutral
position against the wall, eyes looking forward, shot from a slight 3/4 angle showing both the
person and the slant board clearly, wearing a white t-shirt and dark grey shorts, barefoot,
clean white studio, bright even lighting, 1:1 square, health education photography, photorealistic`,
  },
  {
    key:     'ig_2',
    label:   'Instagram 2 — Desk Worker Correction',
    aspect:  '1:1',
    section: 'pgm-instagram.liquid',
    placeholder: 'IG_2_URL',
    // Desk posture is Mike's #1 most relatable scenario — millions sit wrong all day
    prompt:  `cropped waist-to-shoulder shot of ${LORA_TRIGGER} standing behind a person sitting
at a home office desk, both of ${LORA_TRIGGER}'s hands resting on the seated person's shoulders
gently pulling them back into upright alignment — seated person visibly correcting from slumped
to upright, monitor visible at eye level in background, ${LORA_TRIGGER} wearing a dark olive
quarter-zip pullover, natural light from a window to the left, warm and clinical feel,
face of coach only partially visible from behind/above, 1:1 square, photorealistic`,
  },
  {
    key:     'ig_3',
    label:   'Instagram 3 — Outdoor Walking Alignment',
    aspect:  '1:1',
    section: 'pgm-instagram.liquid',
    placeholder: 'IG_3_URL',
    // Walking tall outdoors — shows posture in real life, not just in a clinic
    prompt:  `${LORA_TRIGGER} photographed from the LEFT side profile mid-stride walking on a
scenic outdoor path — head perfectly level, ears over shoulders, spine tall and neutral, arms
swinging naturally, strong and aligned gait, wearing a light grey hoodie and dark jogger pants
and white sneakers, tall green trees lining the path, warm afternoon natural light, shallow
depth of field with blurred background, frame crops from mid-thigh to just above the head
cutting off some of the sky — not a full body shot, candid stride feel, 1:1 square,
lifestyle photography, photorealistic`,
  },
  {
    key:     'ig_4',
    label:   'Instagram 4 — Thoracic Release Floor Exercise',
    aspect:  '1:1',
    section: 'pgm-instagram.liquid',
    placeholder: 'IG_4_URL',
    // Floor corrective exercise — shows the actual therapeutic work Mike teaches
    prompt:  `${LORA_TRIGGER} lying on their back on a blue yoga mat demonstrating a thoracic
spine release posture exercise — a foam roller placed horizontally under the mid-back at the
thoracic spine, knees bent feet flat on the floor, arms crossed over chest or out to the sides,
spine opening into extension over the roller, face relaxed looking up, wearing a white t-shirt
and black athletic shorts, clean bright studio with white floor, shot from a 45-degree elevated
angle showing the full setup of the exercise clearly, face visible but the exercise and body
position is the clear subject, 1:1 square, educational health photography, photorealistic`,
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function log(msg)  { console.log(`  ${msg}`); }
function ok(msg)   { console.log(`  ✓ ${msg}`); }
function err(msg)  { console.error(`  ✗ ${msg}`); }
function head(msg) { console.log(`\n  ── ${msg} ──`); }

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return {};
}

function saveState(state) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = (u) => https.get(u, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.destroy();
        return get(res.headers.location);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(dest); });
    }).on('error', (e) => { fs.unlink(dest, () => {}); reject(e); });
    get(url);
  });
}

function apiCall(method, hostname, urlPath, data, headers) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const options = {
      hostname,
      path: urlPath,
      method,
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

// ─── STEP 1: TRAIN LORA ───────────────────────────────────────────────────────

async function trainLora(token) {
  head('STEP 1: Training Flux LoRA on Mike\'s reference photos');

  // Check reference photos exist
  const photos = fs.readdirSync(REF_DIR)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .map(f => path.join(REF_DIR, f));

  if (photos.length < 5) {
    err(`Only ${photos.length} photos found in photos-of-mike/. Need at least 5 (15-30 recommended).`);
    process.exit(1);
  }

  log(`Found ${photos.length} reference photos of Mike.`);
  log('Uploading to Replicate for training...');

  // Build a zip of the reference photos using inline base64
  // Replicate's flux-dev-lora-trainer accepts a zip URL or individual image URLs
  // We'll use the data zip approach via a hosted transfer

  // For simplicity: provide instructions to use Replicate's web UI for training,
  // and accept the trained model version ID as input
  log('');
  log('  To train the LoRA model:');
  log('  1. Go to: https://replicate.com/ostris/flux-dev-lora-trainer/train');
  log('  2. Upload all photos from your photos-of-mike/ folder');
  log('  3. Set trigger word to: PGMIKE');
  log('  4. Set steps to: 1000');
  log('  5. Click "Start Training" (takes ~20 min, costs ~$3)');
  log('  6. When done, copy the "version" ID from the training page');
  log('  7. Run: node scripts/pgm-pipeline.js --step generate --lora YOUR_VERSION_ID');
  log('');

  // Alternatively, attempt programmatic training if Replicate supports it for this model
  log('  Attempting programmatic training...');

  // Read photos as base64 data URIs (Replicate accepts these for small datasets)
  const photoData = [];
  for (const p of photos.slice(0, 20)) { // max 20 for API
    const data = fs.readFileSync(p);
    const ext = path.extname(p).slice(1).toLowerCase().replace('jpg', 'jpeg');
    photoData.push(`data:image/${ext};base64,${data.toString('base64')}`);
    process.stdout.write('.');
  }
  process.stdout.write('\n');

  const res = await apiCall('POST', 'api.replicate.com', '/v1/trainings', {
    destination: 'postureguy/pgm-mike-lora',
    input: {
      input_images: photoData,
      trigger_word: LORA_TRIGGER,
      steps: 1000,
      lora_rank: 16,
      optimizer: 'adamw8bit',
      batch_size: 1,
      resolution: '512,768,1024',
      autocaption: true,
      autocaption_prefix: `a photo of ${LORA_TRIGGER}`,
    },
    model: 'ostris/flux-dev-lora-trainer',
  }, {
    Authorization: `Token ${token}`,
  });

  if (res.status !== 201) {
    log('  Programmatic training requires a Replicate org. Falling back to manual instructions above.');
    return null;
  }

  const trainingId = res.body.id;
  log(`Training started: ${trainingId}`);
  log('Polling for completion (this takes ~20 minutes)...');

  let training = res.body;
  let dots = 0;
  while (!['succeeded', 'failed', 'canceled'].includes(training.status)) {
    await sleep(15000);
    const poll = await apiCall('GET', 'api.replicate.com', `/v1/trainings/${trainingId}`, null, {
      Authorization: `Token ${token}`,
    });
    training = poll.body;
    process.stdout.write(dots++ % 4 === 0 ? '.' : '');
  }
  process.stdout.write('\n');

  if (training.status !== 'succeeded') {
    err(`Training failed: ${training.error}`);
    return null;
  }

  const loraVersion = training.output?.version || training.version;
  ok(`LoRA trained! Version: ${loraVersion}`);
  return loraVersion;
}

// ─── STEP 2: GENERATE IMAGES ──────────────────────────────────────────────────

async function generateImages(token, loraVersion) {
  head('STEP 2: Generating images with Mike\'s likeness');

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const state = loadState();

  for (const img of IMAGES) {
    if (state[img.key]?.localFile && fs.existsSync(path.join(OUT_DIR, state[img.key].localFile))) {
      log(`Skipping ${img.label} — already generated.`);
      continue;
    }

    log(`Generating: ${img.label} (${img.aspect})`);
    await sleep(11000); // Replicate burst limit: 1 request/10s on accounts with <$5 credit

    // Build input — use LoRA if available, else standard Flux Pro
    let predInput;
    let modelPath;

    if (loraVersion) {
      modelPath = '/v1/predictions';
      predInput = {
        version: loraVersion,
        input: {
          prompt: img.prompt.replace(/\n\s+/g, ' ').trim(),
          aspect_ratio: img.aspect,
          output_format: 'jpg',
          output_quality: 95,
          num_inference_steps: 28,
        },
      };
    } else {
      modelPath = '/v1/models/black-forest-labs/flux-pro/predictions';
      predInput = {
        input: {
          prompt: img.prompt.replace(/\n\s+/g, ' ').replace(/PGMIKE/g, 'athletic male health coach mid-30s').trim(),
          aspect_ratio: img.aspect,
          output_format: 'jpg',
          output_quality: 95,
        },
      };
    }

    const start = await apiCall('POST', 'api.replicate.com', modelPath, predInput, {
      Authorization: `Token ${token}`,
      'Prefer': 'wait=5',
    });

    if (start.status >= 400) {
      // Rate limit: back off and retry once
      if (start.status === 429) {
        const retryAfter = (start.body?.retry_after || 12) * 1000;
        log(`Rate limited — waiting ${retryAfter/1000}s then retrying...`);
        await sleep(retryAfter);
        const retry = await apiCall('POST', 'api.replicate.com', modelPath, predInput, {
          Authorization: `Token ${token}`,
        });
        if (retry.status >= 400) {
          err(`Failed to start generation for ${img.key}: ${JSON.stringify(retry.body)}`);
          continue;
        }
        Object.assign(start, retry);
      } else {
        err(`Failed to start generation for ${img.key}: ${JSON.stringify(start.body)}`);
        continue;
      }
    }

    let prediction = start.body;
    // Poll until done
    let polls = 0;
    while (!['succeeded', 'failed'].includes(prediction.status)) {
      await sleep(2000);
      polls++;
      if (polls > 60) { err('Timed out'); break; }
      const pollPath = `/v1/predictions/${prediction.id}`;
      const poll = await apiCall('GET', 'api.replicate.com', pollPath, null, {
        Authorization: `Token ${token}`,
      });
      prediction = poll.body;
      process.stdout.write('.');
    }
    process.stdout.write('\n');

    if (prediction.status !== 'succeeded') {
      err(`Generation failed for ${img.key}`);
      continue;
    }

    const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    const filename = `pgm-${img.key}.jpg`;
    const dest = path.join(OUT_DIR, filename);
    await downloadFile(imageUrl, dest);
    ok(`Saved: generated-images/${filename}`);

    state[img.key] = { localFile: filename, replicateUrl: imageUrl };
    saveState(state);
  }

  return state;
}

// ─── STEP 3: UPLOAD TO SHOPIFY ────────────────────────────────────────────────

async function uploadToShopify(store, accessToken, state) {
  head('STEP 3: Uploading images to Shopify CDN');

  for (const img of IMAGES) {
    if (!state[img.key]?.localFile) {
      log(`Skipping ${img.label} — not generated yet.`);
      continue;
    }
    if (state[img.key]?.shopifyCdnUrl) {
      log(`Skipping ${img.label} — already uploaded.`);
      continue;
    }

    const filepath = path.join(OUT_DIR, state[img.key].localFile);
    if (!fs.existsSync(filepath)) {
      err(`File not found: ${filepath}`);
      continue;
    }

    log(`Uploading: ${img.label}...`);

    // Step 3a: Get staged upload URL from Shopify
    const stagedQuery = {
      query: `mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters { name value }
          }
          userErrors { field message }
        }
      }`,
      variables: {
        input: [{
          filename:    state[img.key].localFile,
          mimeType:    'image/jpeg',
          resource:    'FILE',
          httpMethod:  'POST',
          fileSize:    String(fs.statSync(filepath).size),
        }],
      },
    };

    const staged = await apiCall(
      'POST',
      store,
      '/admin/api/2024-01/graphql.json',
      stagedQuery,
      { 'X-Shopify-Access-Token': accessToken }
    );

    const target = staged.body?.data?.stagedUploadsCreate?.stagedTargets?.[0];
    if (!target) {
      err(`Staged upload failed for ${img.key}: ${JSON.stringify(staged.body)}`);
      continue;
    }

    // Step 3b: POST file to staged URL
    await uploadFileToStaged(target, filepath, state[img.key].localFile);

    // Step 3c: Create the file in Shopify Files
    const createMutation = {
      query: `mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files { ... on MediaImage { image { url } } }
          userErrors { field message }
        }
      }`,
      variables: {
        files: [{ originalSource: target.resourceUrl, contentType: 'IMAGE' }],
      },
    };

    const created = await apiCall(
      'POST',
      store,
      '/admin/api/2024-01/graphql.json',
      createMutation,
      { 'X-Shopify-Access-Token': accessToken }
    );

    const cdnUrl = created.body?.data?.fileCreate?.files?.[0]?.image?.url;
    if (cdnUrl) {
      ok(`Uploaded: ${cdnUrl}`);
      state[img.key].shopifyCdnUrl = cdnUrl;
      saveState(state);
    } else {
      // Fallback: use resource URL directly
      state[img.key].shopifyCdnUrl = target.resourceUrl;
      saveState(state);
      ok(`Uploaded (resource URL): ${target.resourceUrl}`);
    }
  }

  return state;
}

async function uploadFileToStaged(target, filepath, filename) {
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(filepath);
    const boundary = `----FormBoundary${Date.now()}`;

    let formBody = '';
    for (const param of target.parameters) {
      formBody += `--${boundary}\r\n`;
      formBody += `Content-Disposition: form-data; name="${param.name}"\r\n\r\n`;
      formBody += `${param.value}\r\n`;
    }
    formBody += `--${boundary}\r\n`;
    formBody += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
    formBody += `Content-Type: image/jpeg\r\n\r\n`;

    const formHeader = Buffer.from(formBody);
    const formEnd = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([formHeader, fileData, formEnd]);

    const url = new URL(target.url);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── STEP 4: UPDATE SITE FILES ────────────────────────────────────────────────

async function updateSiteFiles(state) {
  head('STEP 4: Updating section files with real image URLs');

  // Build a map of section → images
  const sectionMap = {};
  for (const img of IMAGES) {
    const url = state[img.key]?.shopifyCdnUrl || state[img.key]?.replicateUrl;
    if (!url) continue;
    if (!sectionMap[img.section]) sectionMap[img.section] = [];
    sectionMap[img.section].push({ ...img, url });
  }

  // Hero background fallback
  if (sectionMap['pgm-hero.liquid']) {
    const img = sectionMap['pgm-hero.liquid'][0];
    const heroPath = path.join(SECTIONS_DIR, 'pgm-hero.liquid');
    let content = fs.readFileSync(heroPath, 'utf8');
    // Update or insert the else branch fallback
    const oldElse = /{%- else -%}\s*{%- endif -%}/s;
    const newElse = `{%- else -%}\n      <img\n        src="${img.url}"\n        alt="Mike Boshnack — Posture Guy Mike"\n        loading="eager"\n        fetchpriority="high"\n        width="1600"\n        height="900"\n      >\n    {%- endif -%}`;
    if (oldElse.test(content)) {
      content = content.replace(oldElse, newElse);
    } else {
      // Replace any existing fallback img block
      content = content.replace(
        /{%- else -%}\s*<img[^>]+>\s*{%- endif -%}/s,
        newElse
      );
    }
    fs.writeFileSync(heroPath, content);
    ok(`Updated pgm-hero.liquid with hero background`);
  }

  // About portrait fallback
  if (sectionMap['pgm-about.liquid']) {
    const img = sectionMap['pgm-about.liquid'][0];
    const aboutPath = path.join(SECTIONS_DIR, 'pgm-about.liquid');
    let content = fs.readFileSync(aboutPath, 'utf8');
    content = content.replace(
      /{%- else -%}\s*<img[^>]*mike-boshnack[^>]*>\s*{%- endif -%}/s,
      `{%- else -%}\n          <img\n            src="${img.url}"\n            alt="Mike Boshnack — Posture Guy Mike, Certified Postural Alignment Specialist"\n            loading="lazy"\n            width="900"\n            height="1125"\n          >\n        {%- endif -%}`
    );
    fs.writeFileSync(aboutPath, content);
    ok(`Updated pgm-about.liquid with Mike's portrait`);
  }

  // Instagram grid — update the case/when fallback URLs
  const igImages = IMAGES.filter(i => i.section === 'pgm-instagram.liquid');
  if (igImages.some(i => state[i.key]?.shopifyCdnUrl || state[i.key]?.replicateUrl)) {
    const igPath = path.join(SECTIONS_DIR, 'pgm-instagram.liquid');
    let content = fs.readFileSync(igPath, 'utf8');

    igImages.forEach((img, idx) => {
      const url = state[img.key]?.shopifyCdnUrl || state[img.key]?.replicateUrl;
      if (!url) return;
      const whenNum = idx + 1;
      // Replace the old cdn.shopify.com fallback URL for this slot
      const oldPattern = new RegExp(`({%- when ${whenNum} -%}{%- assign _ig_src = ')([^']+)(')`);
      content = content.replace(oldPattern, `$1${url}$3`);
    });

    fs.writeFileSync(igPath, content);
    ok(`Updated pgm-instagram.liquid with ${igImages.length} real post images`);
  }

  log('\n  All section files updated. Push to Shopify with:');
  log('  shopify theme push --only sections/pgm-hero.liquid sections/pgm-about.liquid sections/pgm-instagram.liquid');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const args        = process.argv.slice(2);
  const getArg      = (f) => { const i = args.indexOf(f); return i !== -1 ? args[i+1] : null; };
  const step        = getArg('--step') || 'all';
  const existingLora = getArg('--lora');

  const REPLICATE   = process.env.REPLICATE_API_TOKEN;
  const STORE       = process.env.SHOPIFY_STORE;       // e.g. postureguymike.myshopify.com
  const SHOPIFY_TOK = process.env.SHOPIFY_ACCESS_TOKEN;

  console.log('\n  ╔══════════════════════════════════════╗');
  console.log('  ║   PGM — Full Image Pipeline          ║');
  console.log('  ╚══════════════════════════════════════╝');

  // Validate env
  const missing = [];
  if (!REPLICATE && ['all', 'train', 'generate'].includes(step)) missing.push('REPLICATE_API_TOKEN');
  if (!STORE       && ['all', 'upload', 'update'].includes(step)) missing.push('SHOPIFY_STORE');
  if (!SHOPIFY_TOK && ['all', 'upload', 'update'].includes(step)) missing.push('SHOPIFY_ACCESS_TOKEN');

  if (missing.length) {
    console.log('\n  Missing environment variables:');
    missing.forEach(v => console.log(`    export ${v}=...`));
    console.log('\n  Set them and re-run.\n');
    process.exit(1);
  }

  const state = loadState();

  let loraVersion = existingLora || state.loraVersion || null;

  // Step 1: Train
  if (['all', 'train'].includes(step) && !loraVersion) {
    loraVersion = await trainLora(REPLICATE);
    if (loraVersion) {
      state.loraVersion = loraVersion;
      saveState(state);
    }
  }

  // Step 2: Generate
  if (['all', 'generate'].includes(step)) {
    await generateImages(REPLICATE, loraVersion);
  }

  // Step 3: Upload
  if (['all', 'upload'].includes(step)) {
    await uploadToShopify(STORE, SHOPIFY_TOK, loadState());
  }

  // Step 4: Update site files
  if (['all', 'update'].includes(step)) {
    await updateSiteFiles(loadState());
  }

  console.log('\n  ✓ Pipeline complete!\n');
}

main().catch(e => { console.error('\n  Fatal:', e.message); process.exit(1); });
