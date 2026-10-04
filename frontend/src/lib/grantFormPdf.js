// Fills the real ROPS application form (PDF) with an AI draft, in the browser.
// The Inkubator form has no space for answers, so its pages are copied in strips and each answer is inserted
// right under its question; the plan goes into the form's tables. Sections the applicant fills stay empty.
import { callSections } from "@/lib/grants";
import INKUBATOR from "@/lib/forms/inkubator-layout.json";

const INK = [0.05, 0.2, 0.55];
const FRAME = [0.55, 0.65, 0.85];
const WARN = [0.75, 0.1, 0.1];
const SIZE = 9.5;
const LEAD = SIZE * 1.3;
const PAD = 5;
const ANSWER_X = [107, 524];
const PLAN_LINE = /^\s*(PRZYGOTOWANIE|FAZA\s+II|FAZA\s+I)\s*\|([^|]*)\|([^|]*)\|([^|]*)$/i;

// which calls use a form we have as PDF
export function formTemplateFor(call) {
  return call?.sourceKey?.includes("inkubator") ? INKUBATOR : null;
}

function wrap(text, font, size, width) {
  const lines = [];
  for (const paragraph of text.replace(/\r/g, "").split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= width || !line) line = next;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

// "PRZYGOTOWANIE | działanie | termin | koszt" lines go into the tables, anything else stays as text
function splitPlan(text, layout) {
  const rows = { PRZYGOTOWANIE: [], "FAZA I": [], "FAZA II": [] };
  const rest = [];
  for (const line of text.split("\n")) {
    const m = line.match(PLAN_LINE);
    const stage = m && m[1].toUpperCase().replace(/\s+/g, " ");
    if (m && rows[stage].length < layout.plan.rows[stage].length) rows[stage].push([m[2], m[3], m[4]].map((v) => v.trim()));
    else if (line.trim()) rest.push(line.trim());
  }
  return { rows, rest: rest.join("\n") };
}

// sum of the "koszt" column of the plan lines ("6 000 zł" → 6000); 0 when the plan has no such lines
export function planTotal(draftSections) {
  const plan = draftSections.find((s) => (s.title ?? "").startsWith("Plan działania"));
  return (plan?.content ?? "").split("\n").reduce((sum, line) => {
    const m = line.match(PLAN_LINE);
    const amount = m ? Number(m[4].replace(/,\d{1,2}\s*zł?/i, "").replace(/[^\d]/g, "")) : 0;
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
}

const plnFormat = new Intl.NumberFormat("pl-PL");

function sectionIndex(formTitles, section, i) {
  const title = (section.title ?? "").trim().toLowerCase();
  const byTitle = formTitles.findIndex((t) => t.toLowerCase() === title);
  return byTitle >= 0 ? byTitle : i;
}

// applicant: the logged-in account ({ name, email, role, nip, profile }) – fills "Dane pomysłodawcy" as far as it goes
export async function buildFilledForm(call, draftSections, applicant = null) {
  const layout = formTemplateFor(call);
  if (!layout) throw new Error("Brak wzoru PDF dla tego naboru");
  const [{ PDFDocument, rgb, pushGraphicsState, popGraphicsState, rectangle, clip, endPath }, fontkit, formBytes, fontBytes] = await Promise.all([
    import("pdf-lib"),
    import("@pdf-lib/fontkit").then((m) => m.default),
    fetch(layout.file).then((r) => r.arrayBuffer()),
    fetch("/fonts/NotoSans-Regular.ttf").then((r) => r.arrayBuffer()),
  ]);

  // answers by form section; only what the AI drafts goes in
  const formTitles = callSections(call).map((s) => s.title ?? "");
  const answers = {};
  draftSections.forEach((section, i) => {
    if (section.fillBy && section.fillBy !== "AI_DRAFT") return;
    const text = (section.content ?? "").trim().slice(0, 6000);
    if (text) answers[sectionIndex(formTitles, section, i)] = text;
  });
  const plan = splitPlan(answers[layout.plan.section] ?? "", layout);
  answers[layout.plan.section] = plan.rest;
  const total = planTotal(draftSections);
  if (total > 0) answers[layout.amountSection] = `${plnFormat.format(total)} zł (suma kosztów z planu działania – do weryfikacji)`;

  const src = await PDFDocument.load(formBytes);
  const out = await PDFDocument.create();
  out.registerFontkit(fontkit);
  const font = await out.embedFont(fontBytes, { subset: true });
  const srcPages = src.getPages();
  const { width: W, height: H, top: TOP, bottom: BOT } = layout;
  // every source page is embedded once and shown through a clipping frame, so logos are not copied per strip
  const full = await out.embedPages(srcPages);

  // show part a..b (from the top) of source page p with its top at outTop
  const drawPart = (target, p, a, b, outTop) => {
    target.pushOperators(pushGraphicsState(), rectangle(0, H - outTop - (b - a), W, b - a), clip(), endPath());
    target.drawPage(full[p], { x: 0, y: a - outTop });
    target.pushOperators(popGraphicsState());
  };

  let page;
  let y = TOP;
  const placed = [];

  const newPage = () => {
    page = out.addPage([W, H]);
    drawPart(page, 0, 0, TOP, 0);
    drawPart(page, 0, BOT, H, BOT);
    y = TOP;
  };

  // copy part a..b of a source page, breaking onto new pages only at safe cut points
  const placeStrip = (p, a, b) => {
    const { cuts } = layout.pages[p];
    while (b - a > 0.5) {
      const room = BOT - y;
      let c = b;
      if (b - a > room) {
        const fitting = cuts.filter((cut) => cut > a + 5 && cut <= a + room);
        if (!fitting.length) {
          newPage();
          continue;
        }
        c = Math.max(...fitting);
      }
      drawPart(page, p, a, c, y);
      placed.push({ p, a, c, page, y });
      y += c - a;
      a = c;
      if (b - a > 0.5) newPage();
    }
  };

  const placeAnswer = (text) => {
    const [x0, x1] = ANSWER_X;
    const lines = wrap(text, font, SIZE, x1 - x0 - 2 * PAD);
    let i = 0;
    while (i < lines.length) {
      const room = Math.floor((BOT - y - 2 * PAD - 4) / LEAD);
      if (room < 1) {
        newPage();
        continue;
      }
      const part = lines.slice(i, i + room);
      const top = y + 2;
      const height = part.length * LEAD + 2 * PAD;
      page.drawRectangle({ x: x0, y: H - top - height, width: x1 - x0, height, borderColor: rgb(...FRAME), borderWidth: 0.6 });
      part.forEach((line, n) => {
        page.drawText(line, { x: x0 + PAD, y: H - (top + PAD + SIZE + n * LEAD) + 2, size: SIZE, font, color: rgb(...INK) });
      });
      y = top + height + 6;
      i += part.length;
      if (i < lines.length) newPage();
    }
  };

  const mapped = (p, yy) => placed.find((s) => s.p === p && s.a <= yy && yy < s.c);

  newPage();
  for (let p = 0; p < srcPages.length; p++) {
    let pos = TOP;
    const anchors = Object.entries(layout.answers)
      .filter(([, [ap]]) => ap === p)
      .sort(([, [, ya]], [, [, yb]]) => ya - yb);
    for (const [index, [, ay]] of anchors) {
      if (!answers[index]) continue;
      placeStrip(p, pos, ay);
      placeAnswer(answers[index]);
      pos = ay;
    }
    placeStrip(p, pos, layout.pages[p].end);
  }

  // "Dane pomysłodawcy" from the account and its optional profile (grant tab)
  const writeField = ([p, ly, x], value) => {
    const strip = value && mapped(p, ly + 2);
    if (!strip) return;
    // shrink to the room left on the line (down to 6.5 pt) so nothing runs off the page
    let size = 10;
    while (size > 6.5 && font.widthOfTextAtSize(value, size) > W - 30 - x) size -= 0.5;
    strip.page.drawText(value, { x, y: H - (strip.y + (ly - strip.a) + 9), size, font, color: rgb(...INK) });
  };
  if (applicant) {
    const fields = layout.applicant;
    const na = "nie dotyczy";
    const profile = applicant.profile ?? {};
    const own = applicant.role === "NGO" ? fields.entity : fields.person;
    for (const key of ["street", "postalCode", "city", "phone"]) writeField(own[key], profile[key]);
    if (applicant.role === "NGO") {
      writeField(fields.entity.krs, profile.krs);
      writeField(fields.entity.regon, profile.regon);
      for (const who of ["representative", "contact"]) {
        for (const key of ["function", "name", "phone", "email"]) writeField(fields.entity[who][key], profile[who]?.[key]);
      }
      writeField(fields.entity.name, applicant.name);
      writeField(fields.entity.nip, applicant.nip);
      writeField(fields.entity.email, applicant.email);
      writeField(fields.notApplicable.person, na);
    } else {
      // last word is the surname, everything before it the first name(s)
      const words = (applicant.name ?? "").trim().split(/\s+/);
      writeField(fields.person.firstName, words.length > 1 ? words.slice(0, -1).join(" ") : words[0]);
      writeField(fields.person.lastName, words.length > 1 ? words.at(-1) : "");
      writeField(fields.person.email, applicant.email);
      writeField(fields.notApplicable.entity, na);
    }
    writeField(fields.notApplicable.group, na);

    // 12. statements: confirmed in HubMI by the person who represents the applicant
    if (applicant.statementsConfirmedAt) {
      const ngo = applicant.role === "NGO";
      const who = (ngo ? profile.representative?.name : null) || applicant.name || "";
      const date = new Intl.DateTimeFormat("pl-PL", { dateStyle: "long" }).format(applicant.statementsConfirmedAt);
      writeField(layout.statements[ngo ? "entity" : "person"], `Potwierdzono w HubMI: ${who}, ${date}`);
      if (ngo) writeField(layout.statements.person, na);
    }
  }

  // plan rows into the table cells
  for (const [stage, rows] of Object.entries(plan.rows)) {
    rows.forEach((values, n) => {
      const [p, y0, y1] = layout.plan.rows[stage][n];
      const strip = mapped(p, y0 + 1);
      if (!strip) return;
      const top = strip.y + (y0 - strip.a);
      layout.plan.columns.forEach(([cx0, cx1], col) => {
        wrap(values[col] ?? "", font, 7.5, cx1 - cx0 - 6).slice(0, Math.max(1, Math.floor((y1 - y0 - 3) / 8.5))).forEach((line, k) => {
          strip.page.drawText(line, { x: cx0 + 3, y: H - (top + 3 + 7.5 + k * 8.5) + 1.5, size: 7.5, font, color: rgb(...INK) });
        });
      });
    });
  }

  for (const p of out.getPages()) {
    p.drawText("Szkic przygotowany w HubMI – sprawdź i uzupełnij przed złożeniem w formularzu elektronicznym ROPS.", {
      x: 40, y: 12, size: 7.5, font, color: rgb(...WARN),
    });
  }
  return out.save();
}

export function downloadPdf(bytes, filename) {
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
