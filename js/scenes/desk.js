import { clamp, easeInOut, easeOut, easeOutBack, lerp, seg } from '../lib/motion.js'
import { displayFamily, monoFamily } from '../lib/fonts.js'
import { mountScene } from '../lib/canvas-scene.js'

/* virtual stage — everything is authored here, then scaled to fit */
const SW = 1600;
const SH = 900;
const DESK_Y = 752;
const INK = '#111111';
const VIOLET = '#6118EA';
const RED = '#E10600';
const PAPER = '#FFFFFF';
const NEWSPRINT = '#F3F0E8';
const HEADLINE = ['EVERY STAGE', 'OF THE', 'STORY'];
const TOTAL_CHARS = HEADLINE.join('').length;
/* ── small drawing helpers ────────────────────────────────────── */
function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
}
function quad(ctx, p, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++)
        ctx.lineTo(p[i][0], p[i][1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }
}
/* ── the bundles of tied newspapers ───────────────────────────── */
function drawBundle(ctx, cx, baseY, w, h, masthead, reveal) {
    if (reveal <= 0)
        return;
    const x = cx - w / 2;
    const y = baseY - h;
    ctx.save();
    ctx.globalAlpha = reveal;
    // the stack of sheets
    ctx.fillStyle = NEWSPRINT;
    ctx.strokeStyle = 'rgba(17,17,17,.22)';
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, w, h, 3);
    ctx.fill();
    ctx.stroke();
    // sheet edges
    const sheets = 7;
    ctx.strokeStyle = 'rgba(17,17,17,.14)';
    for (let i = 1; i < sheets; i++) {
        const sy = y + (h / sheets) * i;
        ctx.beginPath();
        ctx.moveTo(x + 3, sy);
        ctx.lineTo(x + w - 3, sy);
        ctx.stroke();
    }
    // masthead band on the top sheet
    ctx.fillStyle = masthead;
    ctx.fillRect(x + w * 0.1, y + h * 0.055, w * 0.8, h * 0.075);
    ctx.fillStyle = 'rgba(17,17,17,.34)';
    ctx.fillRect(x + w * 0.1, y + h * 0.17, w * 0.52, 2);
    ctx.fillRect(x + w * 0.1, y + h * 0.215, w * 0.66, 2);
    // string ties
    ctx.strokeStyle = 'rgba(17,17,17,.55)';
    ctx.lineWidth = 2;
    for (const t of [0.3, 0.7]) {
        ctx.beginPath();
        ctx.moveTo(x + w * t, y - 1);
        ctx.lineTo(x + w * t, y + h + 1);
        ctx.stroke();
    }
    ctx.restore();
}
/* ── the typed page ───────────────────────────────────────────── */
function drawTypedPage(ctx, x, y, w, h, charsShown, caret) {
    ctx.save();
    ctx.shadowColor = 'rgba(17,17,17,.16)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = PAPER;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    ctx.strokeStyle = 'rgba(17,17,17,.14)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    // dateline
    ctx.fillStyle = 'rgba(17,17,17,.42)';
    ctx.font = `500 11px ${monoFamily()}`;
    ctx.fillText('NOIDA — 14:32 IST', x + 22, y + 34);
    // typed headline
    ctx.fillStyle = INK;
    const fs = Math.round(w * 0.105);
    ctx.font = `700 ${fs}px ${displayFamily()}`;
    let seen = 0;
    let lastX = x + 22;
    let lastY = y + 76;
    for (let li = 0; li < HEADLINE.length; li++) {
        const line = HEADLINE[li];
        const take = clamp(charsShown - seen, 0, line.length);
        const shown = line.slice(0, Math.floor(take));
        const ly = y + 76 + li * (fs * 1.02);
        if (shown)
            ctx.fillText(shown, x + 22, ly);
        if (take > 0) {
            lastX = x + 22 + ctx.measureText(shown).width;
            lastY = ly;
        }
        seen += line.length;
    }
    // caret
    if (caret) {
        ctx.fillStyle = RED;
        ctx.fillRect(lastX + 3, lastY - fs * 0.78, 3, fs * 0.86);
    }
    // body rules under the headline
    ctx.fillStyle = 'rgba(17,17,17,.16)';
    const bodyTop = y + 76 + HEADLINE.length * (fs * 1.02) + 14;
    for (let i = 0; i < 7; i++) {
        const rowY = bodyTop + i * 13;
        if (rowY > y + h - 18)
            break;
        ctx.fillRect(x + 22, rowY, (w - 44) * (i % 3 === 2 ? 0.62 : 0.92), 2);
    }
}
/* ── the fold: sheet → newspaper ──────────────────────────────── */
function drawFoldingPage(ctx, cx, cy, w, h, fold, rot) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    const stageA = clamp(fold / 0.52); // fold right half over
    const stageB = clamp((fold - 0.48) / 0.52); // fold bottom half up
    const halfW = w / 2;
    const curW = halfW * (1 + Math.cos(Math.PI * stageA)) / 2 + halfW;
    const curH = h * (1 - 0.5 * easeInOut(stageB));
    const x = -curW / 2;
    const y = -curH / 2;
    // shadow
    ctx.save();
    ctx.shadowColor = 'rgba(17,17,17,.2)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = PAPER;
    ctx.fillRect(x, y, curW, curH);
    ctx.restore();
    // the leaf that is rotating over, shaded
    if (stageA > 0.02 && stageA < 0.98) {
        const leafW = halfW * Math.abs(Math.cos(Math.PI * stageA));
        const g = ctx.createLinearGradient(x + curW - leafW, 0, x + curW, 0);
        g.addColorStop(0, 'rgba(17,17,17,.03)');
        g.addColorStop(1, 'rgba(17,17,17,.16)');
        ctx.fillStyle = g;
        ctx.fillRect(x + curW - leafW, y, leafW, curH);
    }
    // crease
    ctx.strokeStyle = 'rgba(17,17,17,.18)';
    ctx.lineWidth = 1;
    if (stageB > 0.04) {
        ctx.beginPath();
        ctx.moveTo(x, y + curH / 2);
        ctx.lineTo(x + curW, y + curH / 2);
        ctx.stroke();
    }
    // printed matter, fading to a folded front page
    const ink = 0.25 + 0.75 * fold;
    ctx.globalAlpha = ink;
    ctx.fillStyle = INK;
    ctx.fillRect(x + curW * 0.1, y + curH * 0.1, curW * 0.8, Math.max(2, curH * 0.07));
    ctx.globalAlpha = ink * 0.34;
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(x + curW * 0.1, y + curH * 0.24 + i * Math.max(3, curH * 0.055), curW * (i % 2 ? 0.52 : 0.78), 2);
    }
    // column rules
    ctx.globalAlpha = ink * 0.22;
    for (const t of [0.37, 0.63]) {
        ctx.fillRect(x + curW * t, y + curH * 0.2, 1, curH * 0.7);
    }
    // thickness once it is a newspaper
    if (fold > 0.7) {
        const a = (fold - 0.7) / 0.3;
        ctx.globalAlpha = a * 0.5;
        ctx.strokeStyle = 'rgba(17,17,17,.4)';
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x, y + curH + i * 1.6);
            ctx.lineTo(x + curW, y + curH + i * 1.6);
            ctx.stroke();
        }
    }
    ctx.restore();
}
/* ── the machine: typewriter ⇄ laptop ─────────────────────────── */
function drawMachine(ctx, cx, baseY, m, strike) {
    const t = easeInOut(m);
    // ── body silhouette, lerped between the two shapes ──
    const twW = 430;
    const twH = 190;
    const lpW = 470;
    const lpH = 300;
    const w = lerp(twW, lpW, t);
    const h = lerp(twH, lpH, t);
    const topInset = lerp(0.17, 0.0, t); // typewriter tapers, laptop screen doesn't
    const radius = lerp(10, 8, t);
    const liftY = lerp(0, 22, t); // laptop screen sits above its base
    const bottom = baseY - liftY;
    const top = bottom - h;
    const bl = [cx - w / 2, bottom];
    const br = [cx + w / 2, bottom];
    const tr = [cx + w / 2 - w * topInset, top];
    const tl = [cx - w / 2 + w * topInset, top];
    // drop shadow on the desk
    ctx.save();
    ctx.fillStyle = 'rgba(17,17,17,.13)';
    ctx.beginPath();
    ctx.ellipse(cx, baseY + 5, w * 0.52, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // body
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(bl[0] + radius, bl[1]);
    ctx.lineTo(br[0] - radius, br[1]);
    ctx.quadraticCurveTo(br[0], br[1], br[0] - w * topInset * 0.3, br[1] - radius);
    ctx.lineTo(tr[0], tr[1] + radius);
    ctx.quadraticCurveTo(tr[0], tr[1], tr[0] - radius, tr[1]);
    ctx.lineTo(tl[0] + radius, tl[1]);
    ctx.quadraticCurveTo(tl[0], tl[1], tl[0], tl[1] + radius);
    ctx.lineTo(bl[0] + w * topInset * 0.3, bl[1] - radius);
    ctx.quadraticCurveTo(bl[0], bl[1], bl[0] + radius, bl[1]);
    ctx.closePath();
    const bodyGrad = ctx.createLinearGradient(0, top, 0, bottom);
    bodyGrad.addColorStop(0, t > 0.5 ? '#16121f' : '#2a2a2f');
    bodyGrad.addColorStop(1, t > 0.5 ? '#0c0a12' : '#16161a');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    /* ── typewriter details ── */
    const tw = 1 - clamp(m / 0.62);
    if (tw > 0.01) {
        ctx.save();
        ctx.globalAlpha *= tw;
        // carriage bar + knobs
        ctx.fillStyle = '#3a3a40';
        roundRect(ctx, cx - twW * 0.46, top + 6, twW * 0.92, 18, 6);
        ctx.fill();
        ctx.fillStyle = '#4a4a52';
        for (const s of [-1, 1]) {
            ctx.beginPath();
            ctx.arc(cx + s * twW * 0.5, top + 15, 14, 0, Math.PI * 2);
            ctx.fill();
        }
        // type bars flicking up on each strike
        const flick = Math.abs(Math.sin(strike * Math.PI));
        ctx.strokeStyle = 'rgba(200,200,210,.5)';
        ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) {
            const k = Math.abs(i) === Math.round(flick * 2) ? flick : 0;
            ctx.beginPath();
            ctx.moveTo(cx + i * 26, bottom - twH * 0.34);
            ctx.lineTo(cx + i * 22, bottom - twH * 0.34 - 24 - k * 26);
            ctx.stroke();
        }
        // three arced rows of keys
        for (let row = 0; row < 3; row++) {
            const keys = 11 - row;
            const ry = bottom - 26 - row * 26;
            for (let k = 0; k < keys; k++) {
                const kx = cx + (k - (keys - 1) / 2) * 30;
                const arc = Math.pow((k - (keys - 1) / 2) / ((keys - 1) / 2 || 1), 2) * 7;
                const pressed = Math.floor(strike * TOTAL_CHARS) % 11 === k && row === Math.floor(strike * 7) % 3;
                const dip = pressed ? 3 : 0;
                ctx.fillStyle = pressed ? RED : '#d8d5cd';
                ctx.beginPath();
                ctx.arc(kx, ry + arc + dip, 10.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(17,17,17,.35)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
        ctx.restore();
    }
    /* ── laptop details ── */
    const lp = clamp((m - 0.34) / 0.66);
    if (lp > 0.01) {
        ctx.save();
        ctx.globalAlpha *= lp;
        // base
        ctx.fillStyle = '#1b1723';
        quad(ctx, [
            [cx - lpW * 0.58, baseY],
            [cx + lpW * 0.58, baseY],
            [cx + lpW * 0.5, baseY - 14],
            [cx - lpW * 0.5, baseY - 14],
        ], '#1b1723');
        ctx.fillStyle = 'rgba(255,255,255,.07)';
        ctx.fillRect(cx - lpW * 0.16, baseY - 6, lpW * 0.32, 3);
        // screen
        const sx = cx - lpW / 2 + 14;
        const sy = top + 14;
        const sw = lpW - 28;
        const sh = lpH - 34;
        ctx.fillStyle = '#0a0812';
        ctx.fillRect(sx, sy, sw, sh);
        // violet AI sidebar, glowing
        const sbW = sw * 0.22;
        const glow = ctx.createLinearGradient(sx, 0, sx + sbW * 1.7, 0);
        glow.addColorStop(0, 'rgba(97,24,234,.85)');
        glow.addColorStop(0.7, 'rgba(97,24,234,.16)');
        glow.addColorStop(1, 'rgba(97,24,234,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(sx, sy, sbW * 1.7, sh);
        ctx.fillStyle = 'rgba(185,164,255,.9)';
        for (let i = 0; i < 6; i++) {
            ctx.fillRect(sx + 12, sy + 22 + i * 18, sbW - 26, 3);
        }
        ctx.fillStyle = 'rgba(185,164,255,.5)';
        ctx.fillRect(sx + 12, sy + sh - 34, sbW - 26, 3);
        // editor toolbar + document
        ctx.fillStyle = 'rgba(255,255,255,.1)';
        ctx.fillRect(sx + sbW + 12, sy + 14, sw - sbW - 26, 8);
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.arc(sx + sbW + 18, sy + 18, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx + sbW + 4, sy);
        ctx.lineTo(sx + sbW + 4, sy + sh);
        ctx.stroke();
        ctx.restore();
    }
}
/* ── the whole scene ──────────────────────────────────────────── */
function drawDesk(ctx, w, h, p, time, mobile) {
    // fit the virtual stage
    const scale = Math.min(w / SW, h / SH) * (mobile ? 1.06 : 1.16);
    ctx.save();
    ctx.translate((w - SW * scale) / 2, h * 0.87 - (DESK_Y + 14) * scale);
    ctx.scale(scale, scale);
    const enter = easeOut(seg(p, 0, 0.07));
    const typing = seg(p, 0.08, 0.44);
    const morph = seg(p, 0.44, 0.62);
    const lift = seg(p, 0.62, 0.76);
    const fold = seg(p, 0.68, 0.88);
    const land = seg(p, 0.86, 1);
    const machineX = 470;
    const bundleX = 1185;
    /* desk line */
    ctx.strokeStyle = 'rgba(17,17,17,.9)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-40, DESK_Y + 14);
    ctx.lineTo(SW + 40, DESK_Y + 14);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(17,17,17,.12)';
    ctx.beginPath();
    ctx.moveTo(-40, DESK_Y + 20);
    ctx.lineTo(SW + 40, DESK_Y + 20);
    ctx.stroke();
    /* three tied bundles, tallest at the back */
    const bundleSets = [
        [bundleX + 150, 118, INK],
        [bundleX + 8, 150, VIOLET],
        [bundleX - 132, 96, RED],
    ];
    bundleSets.forEach(([bx, bh, col], i) => {
        const rev = easeOut(seg(p, 0.01 + i * 0.02, 0.1 + i * 0.03));
        const slide = (1 - rev) * 120;
        drawBundle(ctx, bx + slide, DESK_Y + 14, 230, bh, col, rev);
    });
    /* the machine, typing then morphing */
    ctx.save();
    ctx.globalAlpha = enter;
    ctx.translate(0, (1 - enter) * 40);
    drawMachine(ctx, machineX, DESK_Y + 14, morph, typing);
    ctx.restore();
    /* the page */
    const pageW = 330;
    const pageH = 420;
    const charsShown = Math.floor(typing * TOTAL_CHARS + 0.001);
    if (lift < 0.02) {
        // feeding up out of the carriage / standing in the editor
        const feed = easeOut(typing);
        const py = DESK_Y - 150 - feed * 300 + (1 - enter) * 60;
        ctx.save();
        ctx.globalAlpha = enter;
        drawTypedPage(ctx, machineX - pageW / 2, py, pageW, pageH, charsShown, typing > 0.02 && typing < 1 && Math.sin(time * 6) > 0);
        ctx.restore();
    }
    else {
        // lifts off, arcs across, folds, lands on the stack
        const l = easeInOut(lift);
        const startX = machineX;
        const startY = DESK_Y - 450;
        const endX = bundleX + 8;
        const endY = DESK_Y - 150 - 172;
        const bounce = land > 0 ? easeOutBack(land) : 0;
        const cx = lerp(startX, endX, l);
        const arc = Math.sin(Math.PI * l) * -170;
        const cy = lerp(startY, endY, l) + arc + (1 - bounce) * (land > 0 ? -60 : 0);
        const rot = lerp(0, 0.06, l) * (1 - land) + land * -0.03;
        if (fold < 0.04) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rot);
            drawTypedPage(ctx, -pageW / 2, -pageH / 2, pageW, pageH, TOTAL_CHARS, false);
            ctx.restore();
        }
        else {
            drawFoldingPage(ctx, cx, cy, pageW, pageH, easeInOut(fold), rot);
        }
    }
    ctx.restore();
}
/* ── component ────────────────────────────────────────────────── */

/** 03 · THE DESK — typewriter types, morphs to a laptop, the page folds. */
export function mountDesk(canvas, { mobile = false } = {}) {
  return mountScene(canvas, (ctx, w, h, p, t) => drawDesk(ctx, w, h, p, t, mobile))
}
