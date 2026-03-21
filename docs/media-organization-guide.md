# Posture Guy Mike — Media Organization System

**Version:** 1.0
**Created:** 2026-03-21
**Applies to:** postureguymike.com, UScreen membership, social media, email marketing (Klaviyo), Shopify store

---

## 1. Storage System Overview

| System | Purpose | Best For |
|---|---|---|
| **Google Drive** (Shared Drive) | Source-of-truth asset library for the team | Everything — master files, originals, exported derivatives |
| **Shopify CDN** | Auto-serves assets added to Shopify admin | Website product images, theme assets, section images |
| **GitHub Repo (`shoptheme`)** | Version-controlled theme code | Theme Liquid/CSS/JS files, SVG logos baked into theme |
| **UScreen** | Course/membership video hosting | All program and course videos |
| **Klaviyo** | Email image hosting | Email template images (uploaded directly in Klaviyo) |

**Rule of thumb:** Google Drive is the master library. Other systems (Shopify, Klaviyo, UScreen) receive copies of exported/optimized files — the original always lives in Drive.

---

## 2. Recommended Storage Solution

**Use Google Shared Drive (not My Drive)**

- Files belong to the organization, not a personal account
- Works with Google Workspace permissions per folder
- Supports team members and AI agents via service account credentials
- Integrates with Zapier, Make, and most automation tools

**Setup:** Create one Shared Drive called `PostureGuyMike — Media Library`

---

## 3. Folder Structure

```
PostureGuyMike — Media Library/
│
├── _BRAND/
│   ├── logos/
│   │   ├── primary/
│   │   │   ├── pgm-logo-primary-black.svg
│   │   │   ├── pgm-logo-primary-blue.svg
│   │   │   └── pgm-logo-primary-white.svg
│   │   ├── secondary/
│   │   └── exported/          ← PNG/JPG exports for each platform
│   ├── brand-guide/
│   └── fonts/
│
├── PHOTOS/
│   ├── professional/
│   │   ├── originals/         ← Full-res RAW/TIFF from photographer
│   │   └── exported/          ← Web-ready JPGs, named by convention
│   ├── candid/
│   │   ├── originals/
│   │   └── exported/
│   ├── celebrity-collabs/
│   │   ├── originals/
│   │   └── exported/
│   └── stock/
│       ├── posture-spine-anatomy/
│       ├── exercise-lifestyle/
│       └── office-ergonomics/
│
├── VIDEOS/
│   ├── social/
│   │   ├── instagram/
│   │   │   ├── reels/
│   │   │   └── feed/
│   │   ├── tiktok/
│   │   ├── youtube/
│   │   │   ├── long-form/
│   │   │   └── shorts/
│   │   └── facebook/
│   ├── exercise-demos/
│   │   ├── raw/               ← Unedited camera files (archive only)
│   │   └── edited/
│   │       ├── by-exercise/
│   │       │   ├── hip-flexor-stretch/
│   │       │   ├── shoulder-rolls/
│   │       │   └── spinal-decompression/
│   │       └── by-body-area/
│   │           ├── neck-shoulders/
│   │           ├── lower-back/
│   │           └── hips-legs/
│   ├── programs/
│   │   ├── [program-name]/
│   │   │   ├── raw/
│   │   │   ├── edited/
│   │   │   └── uploaded-to-uscreeen/  ← Confirmation log only, not video
│   │   └── membership-app/
│   └── website/
│       ├── hero-videos/
│       └── ads/
│
├── GRAPHICS/
│   ├── thumbnails/
│   │   ├── youtube/
│   │   ├── uscreeen/
│   │   └── templates/         ← .psd / .fig master templates
│   ├── social-graphics/
│   │   ├── instagram/
│   │   │   ├── feed-posts/
│   │   │   └── stories/
│   │   ├── tiktok/
│   │   ├── facebook/
│   │   └── templates/
│   └── infographics/
│
├── EMAIL/
│   ├── templates/
│   ├── images/
│   │   ├── 2025-03_welcome-series/
│   │   └── 2025-03_posture-quiz-followup/
│   └── klaviyo-upload-log.csv ← Tracks Klaviyo-hosted URLs
│
├── WEBSITE/
│   ├── homepage/
│   │   ├── hero/
│   │   ├── social-proof/
│   │   ├── about-section/
│   │   └── cta-banners/
│   ├── product-pages/
│   │   ├── posture-board/
│   │   └── [other products]/
│   ├── membership-landing/
│   └── collab-page/
│
├── COLLABS/
│   ├── [brand-partner-name]/
│   │   ├── briefs/
│   │   ├── deliverables/
│   │   └── approved-content/
│   └── [celebrity-name]/
│
└── _ARCHIVE/
    ├── pre-2024/
    └── deprecated-brand-assets/
```

---

## 4. File Naming Convention

### Master Pattern
```
[date]_[subject-slug]_[platform-or-use]_[dimensions].[ext]
```

- Lowercase only
- Hyphens within a segment: `hip-flexor-stretch`
- Underscores between segments: `2025-03-15_hip-flexor_ig-reel_1080x1920.mp4`
- No spaces, no special characters

### Date Formats

| Use | Format | Example |
|---|---|---|
| Social content | `YYYY-MM-DD` | `2025-03-15` |
| Brand/website assets | `YYYY-MM` | `2025-03` |
| Evergreen assets | omit | `pgm-logo-primary-black` |

### Platform Codes

| Code | Platform/Use |
|---|---|
| `ig-feed` | Instagram feed post |
| `ig-reel` | Instagram Reel |
| `ig-story` | Instagram Story |
| `tiktok` | TikTok |
| `yt` | YouTube long-form |
| `yt-short` | YouTube Short |
| `yt-thumb` | YouTube thumbnail |
| `fb` | Facebook |
| `email` | Email (any) |
| `web-hero` | Website hero section |
| `web-product` | Shopify product image |
| `uscreeen` | UScreen platform |

### Standard Dimensions

| Use | Dimensions |
|---|---|
| Instagram feed | `1080x1080` |
| Reels / TikTok / YT Shorts | `1080x1920` |
| YouTube thumbnail | `1280x720` |
| Website hero desktop | `1920x900` |
| Website hero mobile | `800x1000` |
| Shopify product image | `1200x1200` |
| Email hero | `600w` |

### Examples
```
2025-03-15_hip-flexor-stretch_ig-reel_1080x1920.mp4
2025-02-28_full-posture-routine_yt-thumb_1280x720.jpg
2025-03_welcome-series-email1-hero_email_600w.jpg
pgm-postureboard-main_web-product_1200x1200.jpg
2025-01_mike-[celebrity]-collab_ig-feed_1080x1080.jpg
pgm-logo-primary-black.svg
```

---

## 5. Asset Master Log (Google Sheets)

Maintain a spreadsheet called `Asset Master Log` at the root of the Shared Drive.

| Column | Description |
|---|---|
| `asset_id` | Auto-incremented (e.g., `PGM-0421`) |
| `filename` | Exact filename |
| `drive_path` | Full folder path |
| `date_created` | YYYY-MM-DD |
| `type` | photo / video / graphic / logo / template |
| `platform` | Comma-separated |
| `subject_tags` | Comma-separated (mike, emily, hip-flexor, etc.) |
| `body_area` | neck-shoulders / lower-back / hips-legs / full-body |
| `status` | draft / approved / published / archived |
| `shopify_url` | Shopify CDN URL if uploaded |
| `klaviyo_url` | Klaviyo-hosted URL if uploaded |
| `uscreeen_id` | UScreen video ID if applicable |
| `notes` | Collab partner, photographer, etc. |

**AI agents can query this sheet via Google Sheets API** to find the right asset for any task.

---

## 6. Which Files Live Where

### Quick Reference

| Scenario | Drive Folder | Also Goes To |
|---|---|---|
| Photographer delivers shoot files | `PHOTOS/professional/originals/` | — |
| Export hero image for homepage | `WEBSITE/homepage/hero/` | Shopify Files → log URL |
| New product photo | `WEBSITE/product-pages/[product]/` | Shopify product → log URL |
| Instagram Reel | `VIDEOS/social/instagram/reels/` | Post to Instagram |
| Same video for TikTok | `VIDEOS/social/tiktok/` | Post to TikTok |
| YouTube thumbnail | `GRAPHICS/thumbnails/youtube/` | YouTube Studio |
| Email hero image | `EMAIL/images/[campaign-name]/` | Klaviyo → log URL |
| Celebrity collab photo | `PHOTOS/celebrity-collabs/exported/` | Also `COLLABS/[name]/approved-content/` |
| Exercise demo (raw) | `VIDEOS/exercise-demos/raw/` | — |
| Exercise demo (edited) | `VIDEOS/exercise-demos/edited/by-exercise/[name]/` | Source for social cuts |
| Program course video | `VIDEOS/programs/[name]/edited/` | UScreen → log ID |
| New brand logo | `_BRAND/logos/primary/` | Export PNG to `exported/`, SVG to GitHub `assets/` |
| Stock photo | `PHOTOS/stock/[subject]/` | — |
| Sponsor deliverable | `COLLABS/[brand]/deliverables/` | Social after approval |

### GitHub Repo — Code Only
Never commit full-resolution images to GitHub.

| What | Repo Location |
|---|---|
| Theme Liquid/CSS/JS | `sections/`, `assets/` |
| SVG icons baked into theme | `assets/pgm-*.svg` |

---

## 7. Team Permissions

| Role | Drive Access | GitHub |
|---|---|---|
| Mike (owner) | Manager | Owner |
| Emily (on-camera) | Contributor — PHOTOS, VIDEOS | None |
| Social media manager | Contributor — PHOTOS, VIDEOS/social, GRAPHICS | None |
| Web developer | Viewer (assets) + Manager (WEBSITE) | Write |
| AI agent (service account) | Viewer + Asset Log Editor | Read |
| Brand partner | Shared link to `COLLABS/[name]/` only | None |

---

## 8. New Asset Workflow

1. **Name the file** using the naming convention before saving
2. **Upload to Google Drive** in the correct folder
3. **Add a row** to the Asset Master Log
4. **Export/optimize** for target platform (resize, compress)
5. **Upload** to destination (Shopify, Klaviyo, UScreen)
6. **Log the URL/ID** back in the Asset Master Log
7. **Set status** to `published`

---

## 9. Archiving Policy

- Content unused for 18+ months → `_ARCHIVE/`
- Raw camera files for published content → `_ARCHIVE/` after 90 days
- Deprecated brand assets → `_ARCHIVE/deprecated-brand-assets/` immediately
- **Never delete** — storage is cheap, recovery from accidental deletion is not

---

## Appendix: Google Drive Color Coding

| Color | Folder |
|---|---|
| Red | `_BRAND/` |
| Blue | `PHOTOS/` |
| Dark blue | `VIDEOS/` |
| Green | `WEBSITE/` |
| Yellow | `EMAIL/` |
| Purple | `GRAPHICS/` |
| Orange | `COLLABS/` |
| Gray | `_ARCHIVE/` |
