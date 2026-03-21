#!/usr/bin/env node
/**
 * PGM — AI Image Generator
 * ========================
 * Generates brand images for postureguymike.com using AI services.
 *
 * Supported providers:
 *   --provider dalle    → OpenAI DALL-E 3   (needs OPENAI_API_KEY)
 *   --provider flux     → Replicate Flux Pro (needs REPLICATE_API_TOKEN)
 *
 * Usage:
 *   node scripts/generate-images.js --provider dalle --section hero
 *   node scripts/generate-images.js --provider flux --section all
 *   node scripts/generate-images.js --provider dalle --custom "your prompt here"
 *
 * Setup:
 *   export OPENAI_API_KEY=sk-...
 *   export REPLICATE_API_TOKEN=r8_...
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const OUTPUT_DIR = path.join(__dirname, '..', 'generated-images');

// ─── PROMPTS ─────────────────────────────────────────────────────────────────
// Context-aware: subject placement is OPPOSITE to text overlay zone.
// Mike only — no Emily.

const PROMPTS = {

  hero: {
    label: 'Hero Background',
    description: 'Full-bleed 16:9. Text on LEFT — Mike on RIGHT.',
    aspect: '16:9',
    dalle_size: '1792x1024',
    prompt: `Professional lifestyle photography, confident athletic male health coach mid-30s with
excellent upright posture on the RIGHT side of the frame, looking slightly toward camera, wearing
dark navy athletic wear, bright modern white studio with subtle blue-accent rim lighting, the left
two-thirds of the frame is clean open negative space or softly blurred background suitable for
white text overlay, high resolution 16:9 landscape, professional health brand photography,
cinematic quality, photorealistic, no text or graphics in image, warm-to-cool studio lighting.`,
  },

  hero_action: {
    label: 'Hero — Action Shot',
    description: 'Full-bleed 16:9. Mike doing a posture assessment on RIGHT.',
    aspect: '16:9',
    dalle_size: '1792x1024',
    prompt: `Wide angle professional photography of a fit athletic male posture specialist in his
mid-30s positioned on the far right third of frame, holding a clipboard and performing a posture
assessment with confident natural stance and perfect upright posture, dark navy athletic wear,
clean modern studio with white wall and subtle blue lighting, shallow depth of field background,
16:9 landscape, left two-thirds completely clear for text overlay, warm professional health brand
lighting, photorealistic, ultra high resolution, no text.`,
  },

  about_portrait: {
    label: 'About Section — Mike Portrait',
    description: '4:5 portrait. Mike faces RIGHT toward the text column.',
    aspect: '4:5',
    dalle_size: '1024x1792',
    prompt: `Professional lifestyle portrait of a confident certified health coach, athletic male
mid-30s, standing facing slightly right and making warm eye contact with camera, natural genuine
smile, excellent upright posture, wearing dark navy athletic wear, bright modern studio with clean
white background and very subtle blue lighting, professional health brand photography, 4:5 portrait
ratio, warm natural lighting, authentic and approachable expression, cinematic depth of field,
no props, no text, photorealistic.`,
  },

  about_with_board: {
    label: 'About Section — Mike with Posture Board',
    description: '4:5 portrait. Mike beside the posture board, faces right.',
    aspect: '4:5',
    dalle_size: '1024x1792',
    prompt: `Professional brand photography of an athletic male certified posture specialist mid-30s
standing next to a wooden adjustable slant board, one hand resting on it naturally, facing slightly
right toward camera with a confident and friendly smile, excellent posture, dark navy athletic wear,
bright clean white studio background, 4:5 portrait ratio, shallow depth of field, professional and
approachable health expert energy, warm lighting, no text, photorealistic.`,
  },

  instagram_1: {
    label: 'Instagram Post 1 — Standing Exercise Demo',
    description: '1:1 square. Full body exercise demonstration.',
    aspect: '1:1',
    dalle_size: '1024x1024',
    prompt: `Authentic lifestyle photo of an athletic male health coach mid-30s demonstrating a
standing posture alignment exercise, hands relaxed at sides, feet shoulder width apart, excellent
upright posture, direct camera eye contact, bright clean white studio, blue yoga mat on the floor,
full body shot, 1:1 square crop, professional fitness lifestyle photography, natural confident
expression, dark navy athletic wear, no text, photorealistic.`,
  },

  instagram_2: {
    label: 'Instagram Post 2 — Floor Exercise',
    description: '1:1 square. Floor posture stretch, overhead angle.',
    aspect: '1:1',
    dalle_size: '1024x1024',
    prompt: `Athletic male fitness coach mid-30s performing a therapeutic floor posture stretch,
lying on back with knees bent and arms extended, focused expression, bright studio floor with blue
mat, 45-degree overhead angle shot, 1:1 square crop, authentic workout lifestyle photography,
dark navy athletic wear, clean bright studio floor, professional fitness brand photography,
no text, photorealistic.`,
  },

  instagram_3: {
    label: 'Instagram Post 3 — On the Posture Board',
    description: '1:1 square. Mike standing on slant board.',
    aspect: '1:1',
    dalle_size: '1024x1024',
    prompt: `Athletic male health coach mid-30s standing on a wooden adjustable slant board with
arms relaxed at sides, looking toward camera with a confident natural posture, bright studio
setting, slight low angle perspective, 1:1 square crop, professional health and fitness brand
lifestyle photography, dark navy athletic wear, no text, photorealistic quality.`,
  },

  instagram_4: {
    label: 'Instagram Post 4 — High Energy Coach',
    description: '1:1 square. Mike gesturing or pointing, motivational.',
    aspect: '1:1',
    dalle_size: '1024x1024',
    prompt: `Athletic male health coach mid-30s in a motivational coaching pose, gesturing
forward with one hand and a big genuine encouraging smile, waist-up crop, dark navy athletic wear,
clean studio background with vibrant blue-accent lighting from the side, 1:1 square crop,
high energy and empowering feel, professional brand photography, no text, photorealistic.`,
  },

  product_board: {
    label: 'Product — Posture Board In Use',
    description: '1:1 square. Feet on board, lifestyle context.',
    aspect: '1:1',
    dalle_size: '1024x1024',
    prompt: `Ecommerce lifestyle photography of a wooden adjustable slant board with athletic
shoes on it, person's lower legs and feet visible standing on the board in correct alignment
position, pure white background, professional product photography with lifestyle context, 1:1
square, subtle drop shadow for depth, no faces, no text, photorealistic product image.`,
  },

  product_blocks: {
    label: 'Product — Foam Posture Blocks',
    description: '1:1 square. Clean product shot on white.',
    aspect: '1:1',
    dalle_size: '1024x1024',
    prompt: `Clean minimal ecommerce product photography of foam posture therapy blocks, black and
deep blue colorway, arranged in a stacked or pyramid formation on a pure white background,
professional soft studio lighting with subtle shadow, 1:1 square, product photography quality,
no text, no people, photorealistic, commercial photography style.`,
  },

  blog_header: {
    label: 'Blog Header — Morning Routine',
    description: '16:9 wide. Text on left, lifestyle shot right.',
    aspect: '16:9',
    dalle_size: '1792x1024',
    prompt: `Wide editorial lifestyle photography showing a morning wellness routine, athletic
figure from behind or from the waist down (no face needed) performing a standing stretch near a
bright window, clean modern minimalist home interior, warm natural morning light, muted tones with
blue accent, 16:9 landscape, right side subject, left side open for text overlay, aspirational
health editorial photography style, no text, photorealistic.`,
  },

};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close();
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

function apiPost(hostname, path, data, headers) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const options = {
      hostname,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers,
      },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch (e) { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function apiGet(hostname, path, headers) {
  return new Promise((resolve, reject) => {
    const options = { hostname, path, method: 'GET', headers };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch (e) { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── PROVIDERS ───────────────────────────────────────────────────────────────

async function generateWithDalle(key, promptObj) {
  console.log(`  → Calling DALL-E 3 for: ${promptObj.label}`);
  const res = await apiPost('api.openai.com', '/v1/images/generations', {
    model: 'dall-e-3',
    prompt: promptObj.prompt.replace(/\n/g, ' ').trim(),
    n: 1,
    size: promptObj.dalle_size || '1792x1024',
    quality: 'hd',
    style: 'natural',
  }, {
    Authorization: `Bearer ${key}`,
  });

  if (res.status !== 200) {
    throw new Error(`DALL-E error ${res.status}: ${JSON.stringify(res.body)}`);
  }
  return res.body.data[0].url;
}

async function generateWithFlux(token, promptObj) {
  console.log(`  → Calling Flux Pro on Replicate for: ${promptObj.label}`);

  // Map aspect ratio to Flux format
  const aspectMap = { '16:9': '16:9', '4:5': '4:5', '1:1': '1:1', '9:16': '9:16' };
  const aspect_ratio = aspectMap[promptObj.aspect] || '1:1';

  // Start prediction
  const start = await apiPost('api.replicate.com', '/v1/models/black-forest-labs/flux-pro/predictions', {
    input: {
      prompt: promptObj.prompt.replace(/\n/g, ' ').trim(),
      aspect_ratio,
      output_format: 'jpg',
      output_quality: 95,
      safety_tolerance: 2,
    },
  }, {
    Authorization: `Token ${token}`,
    'Prefer': 'wait',
  });

  if (start.status !== 201 && start.status !== 200) {
    throw new Error(`Replicate start error ${start.status}: ${JSON.stringify(start.body)}`);
  }

  let prediction = start.body;
  const pollUrl = prediction.urls?.get;

  // Poll until complete
  let attempts = 0;
  while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
    if (attempts > 30) throw new Error('Flux timed out after 30 polls');
    await sleep(2000);
    attempts++;
    process.stdout.write('.');

    const pollPath = pollUrl.replace('https://api.replicate.com', '');
    const poll = await apiGet('api.replicate.com', pollPath, {
      Authorization: `Token ${token}`,
    });
    prediction = poll.body;
  }
  process.stdout.write('\n');

  if (prediction.status === 'failed') {
    throw new Error(`Flux failed: ${prediction.error}`);
  }

  const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  return output;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : null;
  };

  const provider = getArg('--provider') || 'dalle';
  const section  = getArg('--section')  || 'all';
  const custom   = getArg('--custom');

  // API key check
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;

  if (provider === 'dalle' && !OPENAI_KEY) {
    console.error('\n  Error: OPENAI_API_KEY environment variable not set.');
    console.error('  Run: export OPENAI_API_KEY=sk-...\n');
    process.exit(1);
  }
  if (provider === 'flux' && !REPLICATE_TOKEN) {
    console.error('\n  Error: REPLICATE_API_TOKEN environment variable not set.');
    console.error('  Run: export REPLICATE_API_TOKEN=r8_...\n');
    process.exit(1);
  }

  ensureOutputDir();

  // Determine which prompts to run
  let toGenerate = [];
  if (custom) {
    toGenerate = [{ key: 'custom', promptObj: {
      label: 'Custom Prompt',
      aspect: '16:9',
      dalle_size: '1792x1024',
      prompt: custom,
    }}];
  } else if (section === 'all') {
    toGenerate = Object.entries(PROMPTS).map(([key, promptObj]) => ({ key, promptObj }));
  } else if (PROMPTS[section]) {
    toGenerate = [{ key: section, promptObj: PROMPTS[section] }];
  } else {
    console.error(`\n  Unknown section: "${section}"`);
    console.error(`  Available sections: ${Object.keys(PROMPTS).join(', ')}, all\n`);
    process.exit(1);
  }

  // List available prompts if --list flag
  if (args.includes('--list')) {
    console.log('\n  Available image sections:\n');
    Object.entries(PROMPTS).forEach(([key, p]) => {
      console.log(`  ${key.padEnd(20)} ${p.label}`);
      console.log(`  ${''.padEnd(20)} ${p.description}`);
      console.log();
    });
    return;
  }

  console.log(`\n  PGM Image Generator`);
  console.log(`  Provider: ${provider.toUpperCase()}`);
  console.log(`  Generating ${toGenerate.length} image(s)...\n`);

  const results = [];

  for (const { key, promptObj } of toGenerate) {
    console.log(`\n  [${key}] ${promptObj.label}`);
    console.log(`  ${promptObj.description}`);
    try {
      let imageUrl;
      if (provider === 'dalle') {
        imageUrl = await generateWithDalle(OPENAI_KEY, promptObj);
      } else {
        imageUrl = await generateWithFlux(REPLICATE_TOKEN, promptObj);
      }

      const filename = `pgm-${key}-${provider}-${Date.now()}.jpg`;
      const dest = path.join(OUTPUT_DIR, filename);
      console.log(`  ↓ Downloading...`);
      await downloadFile(imageUrl, dest);
      console.log(`  ✓ Saved: generated-images/${filename}`);
      results.push({ key, label: promptObj.label, file: filename });
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
    }
  }

  // Summary
  if (results.length > 0) {
    console.log(`\n  ──────────────────────────────────────`);
    console.log(`  Generated ${results.length} image(s) in: generated-images/`);
    console.log(`\n  Next steps:`);
    console.log(`  1. Review images in the generated-images/ folder`);
    console.log(`  2. Upload to Shopify: Admin → Content → Files → Upload files`);
    console.log(`  3. Or upload directly: shopify files push generated-images/`);
    console.log(`  4. Copy the CDN URL from Shopify admin and paste into your section settings`);
    console.log(`  ──────────────────────────────────────\n`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
