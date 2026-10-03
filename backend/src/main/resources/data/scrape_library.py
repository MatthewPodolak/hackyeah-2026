"""Scrape the ROPS Kraków Social Innovation Library into a JSON dataset."""
import html
import json
import re
import subprocess
import time
from urllib.parse import urljoin

BASE = "https://rops.krakow.pl"
LIST = BASE + "/innowacje-spoleczne/biblioteka-innowacji-spolecznych/"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"

CATEGORIES = {
    "SENIORS": "dla-seniorow",
    "CHILDREN_YOUTH_FAMILY": "dla-dzieci-mlodziezy-i-rodziny",
    "LABOR_MARKET": "dla-rynku-pracy",
    "LIMITED_MOBILITY": "dla-osob-o-ograniczonej-mobilnosci",
    "SENSORY_DISABILITY": "dla-osob-z-niepelnosprawnoscia-sensoryczna",
    "FOREIGNERS": "dla-cudzoziemcow",
    "INTELLECTUAL_DISABILITY": "dla-osob-z-niepelnosprawnoscia-intelektualna",
    "HOMELESSNESS": "dla-osob-w-kryzysie-bezdomnosci",
    "HEALTH_MEDICINE": "dla-zdrowia-i-medycyny",
}

# Detail page sections: "N. <heading>" -> field name
SECTIONS = [
    (r"Na czym polega", "description"),
    (r"Jakich problem", "problem"),
    (r"Grupa docelowa", "targetGroupDescription"),
    (r"Kto mo[żz]e skorzysta", "whoCanImplement"),
    (r"Czy to dzia", "effectiveness"),
    (r"Autor", None),  # authors = personal data, deliberately dropped
]


def get(url):
    out = subprocess.run(["curl", "-s", "-L", "-A", UA, url], capture_output=True, check=True)
    time.sleep(0.3)  # be polite to the server
    return out.stdout.decode("utf-8", errors="replace")


def text(fragment):
    fragment = re.sub(r"(?is)<(script|style).*?</\1>", " ", fragment)
    fragment = re.sub(r"(?i)<br\s*/?>|</p>|</li>|</div>|</h\d>", "\n", fragment)
    fragment = re.sub(r"(?i)<li[^>]*>", "\n- ", fragment)
    # inline formatting tags can sit mid-word ("<span>T</span>estowany"), so drop them without a space
    fragment = re.sub(r"(?i)</?(span|strong|em|b|i|u|a|font|sup|sub)\b[^>]*>", "", fragment)
    fragment = re.sub(r"<[^>]+>", " ", fragment)
    fragment = html.unescape(fragment).replace("\xa0", " ")
    lines = [re.sub(r"[ \t]+", " ", l).strip() for l in fragment.split("\n")]
    return "\n".join(l for l in lines if l)


def classify_link(href, icon):
    h, i = href.lower(), (icon or "").lower()
    if "youtube" in h or "youtu.be" in h or "vimeo" in h or "play" in i:
        return "video"
    if "lupa" in i:
        return "leaflet"
    if h.endswith(".zip") or "read" in i:
        return "materials"
    if "creativecommons" in h or "zasady" in h or "cc_" in i:
        return "usageRules"
    return "other"


def parse_list(cat, slug):
    page = get(LIST + slug)
    items = page.split('<div class="news-list__item">')[1:]
    result = []
    for raw in items:
        m = re.search(r'<a href="([^"]+)" class="news-list__title">(.*?)</a>', raw, re.S)
        if not m:
            continue
        details = urljoin(BASE, m.group(1))
        desc_html = raw.split('class="news-list__desc">', 1)[-1].split("<table", 1)[0]
        desc_lines = text(desc_html).split("\n")
        badge = next((l for l in desc_lines if "UPOWSZECHNIANIA" in l.upper()), None)
        short = next((l for l in desc_lines if l != badge), "")
        links = {}
        for href, icon in re.findall(r'<a href="([^"]+)"[^>]*>\s*<img[^>]*src="([^"]+)"', raw):
            kind = classify_link(href, icon)
            if kind != "other":  # "other" links only point back to the category page
                links.setdefault(kind, urljoin(BASE, href))
        result.append({
            "slug": details.rsplit(",", 1)[-1],
            "name": text(m.group(2)),
            "shortDescription": short,
            "category": cat,
            "disseminationProgram": re.sub(r'.*PROJEKTU\s*', "", badge).strip('" ') if badge else None,
            "detailsUrl": details,
            "links": links,
        })
    return result


def parse_details(url):
    page = get(url)
    main = page.split('class="content__main', 1)[-1]
    main = main.split("Powrót", 1)[0]
    body = text(main)
    fields = {}
    # find each "N. Heading" line and slice text between headings
    marks = []
    for pattern, field in SECTIONS:
        m = re.search(r"(?m)^\s*\d\.\s*" + pattern + r".*$", body)
        if m:
            marks.append((m.start(), m.end(), field))
    marks.sort()
    for idx, (start, end, field) in enumerate(marks):
        nxt = marks[idx + 1][0] if idx + 1 < len(marks) else len(body)
        if field:
            fields[field] = body[end:nxt].strip() or None
    return fields


def main():
    by_slug = {}
    for cat, slug in CATEGORIES.items():
        for item in parse_list(cat, slug):
            key = item["slug"]
            if key in by_slug:
                if cat not in by_slug[key]["targetGroups"]:
                    by_slug[key]["targetGroups"].append(cat)
                for k, v in item["links"].items():
                    by_slug[key]["links"].setdefault(k, v)
                continue
            item["targetGroups"] = [item.pop("category")]
            by_slug[key] = item
        print(f"{cat}: done, unique so far {len(by_slug)}", flush=True)

    for n, item in enumerate(by_slug.values(), 1):
        item.update(parse_details(item["detailsUrl"]))
        if n % 10 == 0:
            print(f"details {n}/{len(by_slug)}", flush=True)

    ordered = []
    for item in by_slug.values():
        ordered.append({
            "id": item["slug"],
            "name": item["name"],
            "shortDescription": item["shortDescription"],
            "description": item.get("description") or item["shortDescription"],
            "problem": item.get("problem"),
            "targetGroups": item["targetGroups"],
            "targetGroupDescription": item.get("targetGroupDescription"),
            "whoCanImplement": item.get("whoCanImplement"),
            "effectiveness": item.get("effectiveness"),
            "disseminationProgram": item["disseminationProgram"],
            "links": {"details": item["detailsUrl"], **item["links"]},
        })
    with open("innovations.json", "w", encoding="utf-8") as f:
        json.dump(ordered, f, ensure_ascii=False, indent=2)
    print(f"saved {len(ordered)} innovations")


if __name__ == "__main__":
    main()
