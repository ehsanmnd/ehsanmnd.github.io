# Plan: Farsi-First Pivot for ehsanmnd.github.io

- **Branch:** `feature/farsi-relunch`
- **Goal:** Make Farsi the primary language at root (`/`), with English as a future secondary language under `/en/`. Eliminate file duplication by making all templates data-driven from `_data/fa.yml` (and future `_data/en.yml`). Full cleanup of all hardcoded strings across every include.
- **Approach:** Jekyll `defaults` + data-driven templates (no i18n plugin).

---

## Background & Current State

The site is a Jekyll 4.3.4 static site (theme: Zolan) deployed via GitHub Pages. It currently follows an **English-first** model: `/` is English, `/fa/` is Farsi. Language switching is implemented by **duplicating files** (`header.html` / `header-fa.html`, `hero.html` / `hero-fa.html`).

Key problems in the current state:

1. `_data/fa.yml` exists but is **dead code** — no include reads from `site.data.fa.*`; all Farsi strings are hardcoded in the `-fa` variants.
2. Many includes are **English-only** with no Farsi variant: `footer.html`, `search.html`, `article-content.html`, `pagination.html`, `reading_time.html`, `javascripts.html`, `disqus-comments.html`.
3. **Missing data keys** in `settings.yml`: `title`, `description`, `author.say-hello`, `author.bio` are referenced but undefined.
4. **SCSS issues**: `IRANSans` is forced globally on `h1-h6, input, textarea` (affects English content too); mobile nav, post navigation, and box borders use hardcoded LTR directions.
5. `404.html` is a standalone Bootstrap-based page with hardcoded English text.
6. `_config.yml` contains dead i18n plugin keys (`exclude_from_localizations`).

---

## Phase 1 — Core Infrastructure Flip

### 1.1. `_config.yml`: Flip defaults to Farsi-first

```yaml
languages: ["fa", "en"]
default_lang: "fa"

defaults:
  - scope:
      path: ""
    values:
      lang: "fa"
      direction: "rtl"
  - scope:
      path: "assets/images"
      type: "posts"
    values:
      layout: "post"
      author: "Ehsan Maminejad"
      comments: true
  - scope:
      path: "life/_posts/fa"
      type: "posts"
    values:
      lang: "fa"
      direction: "rtl"
  - scope:
      path: "life/_posts/en"
      type: "posts"
    values:
      lang: "en"
      direction: "ltr"
```

- Root scope now defaults **all** pages to `lang: fa` + `direction: rtl`.
- Remove the `exclude_from_localizations` key (dead config — no plugin uses it).
- Clean up the duplicate "Exclude from processing" comment.

### 1.2. `_layouts/default.html`: RTL as default, single header

```html
<html lang="{{ page.lang | default: 'fa' }}" dir="{{ page.direction | default: 'rtl' }}">
...
{% if page.lang == "en" %}
{% include header.html %}
{% else %}
{% include header-fa.html %}
{% endif %}
```

- Invert the conditional — Farsi header is the default, English header only for `page.lang == "en"`.
- Add `/en/` to the home-class detection alongside `/`.

### 1.3. `_layouts/post.html`: Add RTL class to post content

Currently the post layout has **zero** RTL logic. Wrap both article containers in:

```
{% if page.lang == 'fa' or site.default_lang == 'fa' %}rtl-content{% endif %}
```

Same pattern already used in `page.html`.

### 1.4. `_layouts/page.html`: Already correct

This layout already checks `page.lang == 'fa' or site.default_lang == 'fa'`. Since `default_lang` will now be `"fa"`, it will correctly apply RTL even to pages without explicit `lang` in front matter. **No changes needed.**

---

## Phase 2 — Data-Driven Templates (eliminate file duplication)

### 2.1. Create `_data/en.yml` (English translations, future-ready)

Mirror the structure of `fa.yml` with English strings:

```yaml
nav:
  home: "Home"
  about: "About"
  life: "Life"
  notebook: "Notebook"
  research: "Research"
hero:
  greeting: "Hello,"
  intro: "..."
  ...
shared:
  read_more: "Keep Reading"
  ...
```

This file is created now so templates can reference it, even though English pages don't exist yet.

### 2.2. Consolidate `header-fa.html` → single `header.html` (data-driven)

Replace both `header.html` and `header-fa.html` with **one** file that selects the locale data:

```liquid
{% if page.lang == "en" %}
  {% assign t = site.data.en %}
  {% assign home_url = site.baseurl | append: '/en/' %}
  {% assign about_url = site.baseurl | append: '/en/about/' %}
  ...
{% else %}
  {% assign t = site.data.fa %}
  {% assign home_url = site.baseurl | append: '/' %}
  {% assign about_url = site.baseurl | append: '/about/' %}
  ...
{% endif %}

<li class="nav__item"><a href="{{ home_url }}" class="nav__link">{{ t.nav.home }}</a></li>
<li class="nav__item"><a href="{{ about_url }}" class="nav__link">{{ t.nav.about }}</a></li>
...
```

Navigation URLs:

- Farsi: `/` (home), `/about/` (about), `/life/` (life), `/notebook/` (notebook), `/research/` (research)
- English (future): `/en/` (home), `/en/about/` (about), `/en/life/` (life), etc.

Then **delete** the old `header-fa.html` and update `default.html` to always `{% include header.html %}` (no conditional needed).

### 2.3. Consolidate `hero-fa.html` → single `hero.html` (data-driven)

Same pattern — one file reading from `site.data.fa` or `site.data.en`:

```liquid
{% if page.lang == "en" %}
  {% assign t = site.data.en %}
{% else %}
  {% assign t = site.data.fa %}
{% endif %}

<h1 class="hero__title">{{ t.hero.greeting }}</h1>
<p class="hero__subtitle">{{ t.hero.intro }}
  {% if page.lang == "en" %}
    <a href="/fa">{{ t.hero.cta_text_farsi }}</a>
  {% else %}
    <a href="{{ site.baseurl }}/about/">{{ t.hero.cta_text }}</a>
  {% endif %}
</p>
```

Content from `fa.yml` (the newer "digital products / product manager" bio). Then **delete** the old `hero-fa.html`.

### 2.4. `language-switcher.html`: Update URL scheme for Farsi-first

Current logic assumes English at root, Farsi at `/fa/`. Invert:

```liquid
{% if page.lang == "en" %}
  <a href="{{ site.baseurl }}{{ page.url | remove: '/en' }}" class="lang-switch">فا</a>
{% else %}
  <a href="{{ site.baseurl }}/en{{ page.url }}" class="lang-switch">EN</a>
{% endif %}
```

- When on Farsi page `/about/` → switcher links to `/en/about/`.
- When on English page `/en/about/` → switcher links to `/about/`.

---

## Phase 3 — Move Farsi Content to Root

### 3.1. Root `index.html` → becomes Farsi home

Replace the current English `index.html` with the Farsi content (from `fa/index.html`):

- Remove `lang: fa` and `direction: rtl` from front matter (they're now the root defaults from `_config.yml`).
- Use the new data-driven `{% include hero.html %}` (no `-fa` suffix).
- Remove the `<div class="rtl-content">` wrapper (the `<html dir="rtl">` handles it).
- Remove the `lang` scope filter from `paginator.posts` (all posts default to fa anyway).
- Update "آخرین نوشته‌ها" to use `{{ site.data.fa.blog.title }}`.

### 3.2. `about/index-fa.md` → becomes `about/index.md`

Rename `about/index-fa.md` to `about/index.md` (permalink: `/about/`):

- Remove `lang: fa` from front matter (inherited from defaults).
- Update `about/index-en.md` → move to `en/about/index.md` for future English version.

### 3.3. Category pages: Remove English-only `lang` filter

In `life/index.html`, `notebook/index.html`, `research/index.html`:

- Remove `| where: "lang", "en"` from the `filtered_posts` assignment (Farsi is now default).
- Update section titles to read from `site.data.fa.*` instead of hardcoded English.
- Update "No posts found" empty message to use `site.data.fa.*.empty`.

### 3.4. Delete the `fa/` directory entirely

After moving content to root, `fa/` is redundant. Delete `fa/index.html` and `fa/about/` (already empty).

---

## Phase 4 — SEO & Head

### 4.1. `head.html`: Locale-aware title/description + hreflang

```html
{% if page.lang == "en" %}
  {% assign locale_data = site.data.en %}
{% else %}
  {% assign locale_data = site.data.fa %}
{% endif %}

<title>{% if page.title %}{{ page.title }}{% else %}{{ locale_data.site_title }}{% endif %}</title>
<meta name="description" content="{% if page.description %}{{ page.description | strip_html | truncate: 160 }}{% else %}{{ locale_data.site_description }}{% endif %}">

<link rel="alternate" hreflang="fa" href="{{ page.url | absolute_url }}" />
{% comment %}When English pages exist later:{% endcomment %}
{% comment %}<link rel="alternate" hreflang="en" href="{{ site.url }}/en{{ page.url }}" />{% endcomment %}
```

Add `site_title` and `site_description` keys to `fa.yml` and `en.yml`.

### 4.2. Add `jekyll-sitemap` plugin

- Add to `_config.yml` plugins list: `- jekyll-sitemap`.
- Add `gem "jekyll-sitemap"` to the Gemfile.
- This auto-generates a `sitemap.xml` for search engines.

---

## Phase 5 — Full String Cleanup (all includes → data-driven)

Every include adopts the same pattern at the top:

```liquid
{% if page.lang == "en" %}
  {% assign t = site.data.en %}
{% else %}
  {% assign t = site.data.fa %}
{% endif %}
```

### 5.1. `footer.html`

Replace hardcoded English:

- "All right Reserved" → `{{ t.copyright_text }}` (add to `fa.yml`/`en.yml`).
- "Powered by Jekyll" → same pattern.
- Fix missing `site.data.settings.title` → use `locale_data.site_title`.

### 5.2. `search.html`

Replace "Search for Blog" and "Type to search" with locale data keys. Add `search.placeholder` and `search.label` to `fa.yml`/`en.yml`.

### 5.3. `pagination.html`

Replace "Prev Posts" / "Next Posts" with locale data. Add `pagination.prev` and `pagination.next` to `fa.yml`/`en.yml`.

### 5.4. `reading_time.html`

Replace "word" / "words" / "min read" with locale data. Use existing `shared.minutes_read` from `fa.yml`.

### 5.5. `article-content.html`

Replace "Keep Reading" → `{{ t.shared.read_more }}`. Fix date format for Farsi (use `site.data.fa.date_format` or a locale-aware format).

### 5.6. `javascripts.html`

Replace "No results found" with a locale-aware string. Add `search.no_results` to `fa.yml`/`en.yml`.

### 5.7. `google-analytics.html`

Replace hardcoded GA ID with `{{ site.data.settings.google-analytics }}`.

---

## Phase 6 — SCSS RTL Fixes

### 6.1. Fix global IRANSans heading override in `_rtl.scss`

The current rule applies IRANSans to **all** headings site-wide, including English content:

```scss
/* BEFORE */
h1, h2, h3, h4, h5, h6, input, textarea {
    font-family: IRANSans !important;
}

/* AFTER — scoped to RTL contexts only */
.rtl-content h1, .rtl-content h2, .rtl-content h3,
.rtl-content h4, .rtl-content h5, .rtl-content h6,
.rtl-content input, .rtl-content textarea {
    font-family: IRANSans !important;
}
```

### 6.2. Fix header mobile nav direction in `_header.scss`

The mobile nav uses `right: -300px` (slides from right). In RTL, this is wrong — the nav should slide from the left. Use CSS `:dir(rtl)` to flip:

```scss
.main-nav__box {
  right: -300px; /* LTR default */
  &:dir(rtl) { right: auto; left: -300px; }
}
```

### 6.3. Fix post navigation in `_post.scss`

`.prev` uses `padding-right` and `.next` uses `padding-left`. These should flip for RTL using `:dir(rtl)`.

### 6.4. Fix box border directions in `_rtl.scss`

`.mainbox`, `.mainboxnegativ`, `.mainbox3` use hardcoded `border-right`. In RTL these should be `border-left`. Scope or use `:dir()`.

---

## Phase 7 — 404 Page

### 7.1. Rebuild `404.html` using theme layout

Replace the standalone Bootstrap-based 404 page with a proper Jekyll page:

```markdown
---
layout: default
title: "۴۰۴"
permalink: /404.html
lang: fa
---
<div class="container rtl-content" dir="rtl">
  <div class="row">
    <div class="col col-12 text-center">
      <h1>۴۰۴</h1>
      <p>صفحه‌ای که دنبالشی پیدا نشد!</p>
      <a href="/" class="link_404">بازگشت به خانه</a>
    </div>
  </div>
</div>
```

Remove the Bootstrap CDN and Arvo font references from the old 404.

---

## Phase 8 — Verify

1. `bundle exec jekyll build --no-watch` — zero errors, zero warnings.
2. Verify all key routes return HTTP 200: `/`, `/about/`, `/life/`, `/notebook/`, `/research/`, `/404.html`.
3. Verify `<html lang="fa" dir="rtl">` on all root-level pages.
4. Verify no hardcoded English strings remain in Farsi pages.
5. Verify no old `/fa/` links exist.
6. Verify `_data/fa.yml` is actually being read by all templates (not dead code).

---

## Files Changed Summary

| Action | Files |
|--------|-------|
| **Modify** | `_config.yml`, `_layouts/default.html`, `_layouts/post.html`, `_includes/header.html` (rewrite), `_includes/hero.html` (rewrite), `_includes/head.html`, `_includes/language-switcher.html`, `_includes/footer.html`, `_includes/search.html`, `_includes/pagination.html`, `_includes/reading_time.html`, `_includes/article-content.html`, `_includes/javascripts.html`, `_includes/google-analytics.html`, `index.html`, `life/index.html`, `notebook/index.html`, `research/index.html` |
| **Create** | `_data/en.yml`, `404.html` (rewrite), `docs/farsi-first-pivot-plan.md` |
| **Rename** | `about/index-fa.md` → `about/index.md` |
| **Delete** | `fa/index.html`, `fa/about/`, `_includes/header-fa.html`, `_includes/hero-fa.html` |
| **SCSS** | `_sass/3-modules/_rtl.scss`, `_sass/3-modules/_header.scss`, `_sass/4-layouts/_post.scss` |

---

## Git Flow

All work on `feature/farsi-relunch` → merge to `develop` via `git flow feature finish`.

```
feature/farsi-relaunch  →  develop  →  (later) release/X.Y.Z  →  main
```
