# Hymnary Importer

An Obsidian plugin that lets you search [Hymnary.org](https://hymnary.org) and import hymns directly into your vault as Markdown notes.

## Features

- **Full-text search** — searches hymn titles, first lines, and text content via Hymnary.org.
- **One-click import** — click any result to fetch the full lyrics and create a note instantly.
- **Rich frontmatter** — each imported note includes `title`, `author`, `first_line`, `meter`, `source`, and a `hymn` tag.
- **Configurable destination** — choose which vault folder hymns are saved to.

## Usage

1. Click the music icon in the left ribbon (or run the command *Search Hymnary.org* from the command palette).
2. Type a hymn title, first line, or keyword and press *Enter* or click *Search*.
3. Browse the results and click the hymn you are wanting to import.
4. The hymn is saved to your configured folder and opened. (if your settings specify)

### Example note

```
---
title: "Amazing Grace"
author: "John Newton"
first_line: "Amazing grace, how sweet the sound"
meter: "CM (8.6.8.6)"
source: "https://hymnary.org/text/amazing_grace_how_sweet_the_sound"
tags:
  - hymn
---
Amazing grace, how sweet the sound
That saved a wretch like me
...
```

## Settings

| Setting | Default | Description |
|---|---|---|
| Import folder | `Hymns` | Vault folder where hymns are saved |
| Open after import | On | Automatically open the note after importing |
| Include Hymnary.org URL | On | Adds a `source` property with the Hymnary.org link |
| Max search results | 20 | How many results to show per search (5–50) |

## Installation

### From the community plugin list

1. Open *Settings > Community plugins* and click *Browse*.
2. Search for *Hymnary Importer* and select *Install*, then *Enable*.

### Manual install

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases/latest).
2. Copy the three files to `<Vault>/.obsidian/plugins/hymnary-importer/`.
3. Reload Obsidian and enable *Hymnary Importer* in *Settings > Community plugins*.

## Notes & limitations

- Some hymns on Hymnary.org do not have full text available; the note will include a link to the Hymnary.org page in that case.
- This plugin is desktop-only since I did not test mobile support.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.
