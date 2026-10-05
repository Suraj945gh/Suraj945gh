// Generates assets/terminal.svg: an animated terminal window that types commands.
// Edit SCRIPT below, then run:  node scripts/make-terminal.mjs
import { writeFileSync } from "node:fs";

const SCRIPT = [
  { cmd: "whoami", out: [{ text: "Surajsingh Rajpurohit  //  AI Software Engineer", cls: "hi" }] },
  { cmd: "cat focus.txt", out: [{ text: "voice AI pipelines  |  LLM apps  |  multi-agent automations", cls: "out" }] },
  { cmd: "cat now.txt", out: [{ text: "Member of Technical Staff @ Vokido  -  Mumbai, India", cls: "out" }] },
  { cmd: "ls ~/stack", out: [{ text: "typescript  python  postgres  deno  gpt-4o  gemini  whisper  n8n", cls: "ls" }] },
];

const W = 860, PAD_X = 28, TOP = 78, LINE_H = 27, FONT = 15, CHAR_W = 9;
const PROMPT = "suraj@dev:~$ ";
const FIRST_IDLE = 1.4, IDLE = 0.7, CHAR_T = 0.09, AFTER_TYPE = 0.35, AFTER_OUT = 0.45, HOLD = 4;

const r = (n) => Math.round(n * 1000) / 1000;
let t = 0, row = 0;
const lines = [];       // { y, prompt?, cmd?, text?, cls, show, typeStart?, typeEnd? }
const cursor = [];      // { t, x, y }
const typing = [];      // [start, end] intervals where the cursor stays solid

SCRIPT.forEach((step, i) => {
  const y = TOP + row * LINE_H;
  const idle = i === 0 ? FIRST_IDLE : IDLE;
  const cmdX = PAD_X + PROMPT.length * CHAR_W;
  const ts = t + idle;
  const te = ts + step.cmd.length * CHAR_T;
  lines.push({ y, cmd: step.cmd, show: t, typeStart: ts, typeEnd: te });
  cursor.push({ t, x: cmdX, y });
  for (let c = 1; c <= step.cmd.length; c++) cursor.push({ t: ts + c * CHAR_T, x: cmdX + c * CHAR_W, y });
  typing.push([ts, te + AFTER_TYPE]);
  row++;
  const outAt = te + AFTER_TYPE;
  step.out.forEach((o) => { lines.push({ y: TOP + row * LINE_H, text: o.text, cls: o.cls, show: outAt }); row++; });
  t = outAt + AFTER_OUT;
});
// final idle prompt
const finalY = TOP + row * LINE_H;
lines.push({ y: finalY, cmd: "", show: t });
cursor.push({ t, x: PAD_X + PROMPT.length * CHAR_W, y: finalY });
row++;
const T = t + HOLD;
const H = TOP + row * LINE_H + 10;
const kt = (s) => r(s / T);
const END = 0.999;

// discrete animate helper: pairs [[time, value], ...] starting at time 0
function animate(attr, pairs) {
  const keyTimes = [], values = [];
  pairs.forEach(([time, v]) => {
    const k = time === 0 ? 0 : kt(time);
    if (keyTimes.length && k <= keyTimes[keyTimes.length - 1]) { values[values.length - 1] = v; return; }
    keyTimes.push(k); values.push(v);
  });
  return `<animate attributeName="${attr}" dur="${r(T)}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${keyTimes.join(";")}" values="${values.join(";")}"/>`;
}
const visibility = (show) => animate("opacity", show === 0 ? [[0, 1], [END * T, 0]] : [[0, 0], [show, 1], [END * T, 0]]);

let body = "";
lines.forEach((l, i) => {
  if (l.cmd !== undefined) {
    body += `<g opacity="0">${visibility(l.show)}<text x="${PAD_X}" y="${l.y}" class="prompt" textLength="${PROMPT.trimEnd().length * CHAR_W}">${PROMPT.trimEnd()}</text>`;
    if (l.cmd.length) {
      const w = l.cmd.length * CHAR_W, x = PAD_X + PROMPT.length * CHAR_W;
      const steps = [[0, 0]];
      for (let c = 1; c <= l.cmd.length; c++) steps.push([l.typeStart + c * CHAR_T, c * CHAR_W]);
      steps.push([END * T, 0]);
      body += `<clipPath id="c${i}"><rect x="${x}" y="${l.y - FONT}" height="${FONT + 6}" width="0">${animate("width", steps)}</rect></clipPath>`;
      body += `<text x="${x}" y="${l.y}" class="cmd" textLength="${w}" clip-path="url(#c${i})">${l.cmd}</text>`;
    }
    body += `</g>`;
  } else {
    body += `<g opacity="0">${visibility(l.show)}<text x="${PAD_X}" y="${l.y}" class="${l.cls}">${l.text}</text></g>`;
  }
});

// cursor: position track + solid while typing, blinking when idle
const xs = [[0, cursor[0].x]], ys = [[0, cursor[0].y]];
cursor.forEach((c) => { xs.push([c.t, c.x]); ys.push([c.t, c.y]); });
const blink = [[0, 1]];
let s = 0;
for (const [a, b] of [...typing, [T, T]]) {
  for (let k = s, on = false; k < a; k += 0.5, on = !on) blink.push([k, on ? 1 : 0]);
  blink.push([a, 1]);
  s = b;
}
const cursorSvg = `<rect width="${CHAR_W}" height="${FONT + 3}" class="cursor" x="${cursor[0].x}" y="${cursor[0].y - FONT + 1}">
${animate("x", xs)}${animate("y", ys.map(([tt, y]) => [tt, y - FONT + 1]))}${animate("opacity", blink)}</rect>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Terminal: Surajsingh Rajpurohit, AI Software Engineer">
<defs>
  <linearGradient id="neon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00FF41"/><stop offset="1" stop-color="#00F5FF"/></linearGradient>
  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<style>
  text { font-family: 'JetBrains Mono','Fira Code',Consolas,'Courier New',monospace; font-size: ${FONT}px; white-space: pre; }
  .prompt { fill: #00FF41; font-weight: 700; }
  .cmd { fill: #E6EDF3; }
  .hi { fill: #00FF41; font-weight: 700; filter: url(#glow); }
  .out { fill: #8B949E; }
  .ls { fill: #00F5FF; }
  .cursor { fill: #00FF41; }
  .title { fill: #8B949E; font-size: 13px; }
</style>
<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="12" fill="#0D1117" stroke="url(#neon)" stroke-width="2" filter="url(#glow)"/>
<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="12" fill="#0D1117"/>
<path d="M2 14 a12 12 0 0 1 12 -12 h${W - 28} a12 12 0 0 1 12 12 v24 h-${W - 4} z" fill="#161B22"/>
<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="12" fill="none" stroke="url(#neon)" stroke-width="1.5"/>
<circle cx="24" cy="21" r="6" fill="#FF5F56"/><circle cx="44" cy="21" r="6" fill="#FFBD2E"/><circle cx="64" cy="21" r="6" fill="#27C93F"/>
<text x="${W / 2}" y="26" text-anchor="middle" class="title">suraj@github: ~</text>
${body}
${cursorSvg}
</svg>
`;
writeFileSync(new URL("../assets/terminal.svg", import.meta.url), svg);
console.log(`terminal.svg written: ${W}x${H}, loop ${r(T)}s`);
