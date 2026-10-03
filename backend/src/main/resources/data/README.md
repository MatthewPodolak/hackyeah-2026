# HubMI – seed data

Source: ROPS Kraków materials from the HackYeah poster (scraped 2026-10-03).

| File | What it is |
|---|---|
| `innovations.json` | **115 social innovations** from the *Biblioteka Innowacji Społecznych* – the matchmaking database |
| `challenge-areas.json` | **8 areas** of the *Mapa Wyzwań Społecznych* (definition, key challenges, persona) |
| `target-groups.json` | Enum: 9 library categories (who an innovation is for) |
| `problem-tags.json` | Enum: 23 problem tags (what problem an innovation solves) |
| `scrape_library.py` | Re-scrapes the library → raw `innovations.json` |
| `tag_innovations.py` | Adds `challengeAreas` + `problemTags` (hand-assigned) to the raw file |

## `innovations.json` – one record

| Field | Type | Source |
|---|---|---|
| `id` | string (slug) | URL of the innovation page |
| `name` | string | title |
| `shortDescription` | string | one-liner from the category list |
| `description` | string | *1. Na czym polega rozwiązanie?* |
| `problem` | string | *2. Jakich problemów dotyczy innowacja?* |
| `targetGroups` | enum[] → `target-groups.json` | library category |
| `challengeAreas` | enum[] → `challenge-areas.json` | hand-assigned |
| `problemTags` | enum[] → `problem-tags.json` | hand-assigned, primary tag first |
| `targetGroupDescription` | string | *3. Grupa docelowa* |
| `whoCanImplement` | string | *4. Kto może skorzystać z innowacji?* (institutions – useful for JST / Middleman) |
| `effectiveness` | string \| null | *5. Czy to działa?* (null for 4 innovations – missing on the source page) |
| `disseminationProgram` | string \| null | set for 27 innovations selected for wider rollout |
| `links` | object | `details` (always), `video` (26), `leaflet` (27), `materials` (111), `usageRules` (111) |

## Notes
- **Authors are deliberately not included** – the brief says not to use real personal data from ROPS materials.
- The Social Challenges Map uses **national** data (stated on its cover), not Małopolska-specific data.
- The ROPS site is being rebuilt; some links may break. Contact: iws@rops.krakow.pl.

## Regenerate
```bash
python scrape_library.py              # writes raw innovations.json in the current dir
python tag_innovations.py innovations.json .
```
