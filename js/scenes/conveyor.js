import { clamp, easeOut, seg } from '../lib/motion.js'
import { mountScene } from '../lib/canvas-scene.js'

/**
 * 04 · the press conveyor, side view.
 * Papers ride the belt left → right with scroll; at the end the camera tilts
 * to top-down and the belt becomes the black strip that carries into LIVE.
 */
const INK = '#111111';
const VIOLET = '#6118EA';
const RED = '#E10600';
const NEWSPRINT = '#F3F0E8';
function drawFoldedPaper(ctx, x, y, w, h, accent, lean) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean);
    ctx.fillStyle = 'rgba(17,17,17,.12)';
    ctx.fillRect(-w / 2 + 3, -h + 5, w, h);
    ctx.fillStyle = NEWSPRINT;
    ctx.fillRect(-w / 2, -h, w, h);
    ctx.strokeStyle = 'rgba(17,17,17,.28)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-w / 2 + 0.5, -h + 0.5, w - 1, h - 1);
    // masthead band + rules
    ctx.fillStyle = accent;
    ctx.fillRect(-w / 2 + w * 0.12, -h + h * 0.12, w * 0.76, h * 0.1);
    ctx.fillStyle = 'rgba(17,17,17,.3)';
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(-w / 2 + w * 0.12, -h + h * 0.3 + i * (h * 0.12), w * (i % 2 ? 0.44 : 0.72), 2);
    }
    // fold crease
    ctx.strokeStyle = 'rgba(17,17,17,.2)';
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2);
    ctx.lineTo(w / 2, -h / 2);
    ctx.stroke();
    ctx.restore();
}
function drawConveyor(ctx, w, h, p, time) {
    const tilt = seg(p, 0.82, 1); // camera tilts to top-down at the end
    const beltY = h * (0.78 - tilt * 0.06);
    const beltH = 46 + tilt * (Math.min(w * 0.12, 180) - 46);
    const travel = p * w * 2.6;
    /* belt shadow on the floor */
    ctx.fillStyle = 'rgba(17,17,17,.05)';
    ctx.fillRect(0, beltY + beltH, w, 26 * (1 - tilt));
    /* rollers under the belt */
    const rollerCount = Math.ceil(w / 150) + 2;
    ctx.globalAlpha = 1 - tilt;
    for (let i = 0; i < rollerCount; i++) {
        const rx = i * 150 + 60;
        ctx.strokeStyle = 'rgba(17,17,17,.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(rx, beltY + beltH + 20, 18, 0, Math.PI * 2);
        ctx.stroke();
        // spokes turning with the belt
        ctx.save();
        ctx.translate(rx, beltY + beltH + 20);
        ctx.rotate(travel * 0.012 + i);
        ctx.strokeStyle = 'rgba(17,17,17,.18)';
        ctx.lineWidth = 1.5;
        for (let s = 0; s < 3; s++) {
            ctx.rotate(Math.PI / 3);
            ctx.beginPath();
            ctx.moveTo(-14, 0);
            ctx.lineTo(14, 0);
            ctx.stroke();
        }
        ctx.restore();
    }
    ctx.globalAlpha = 1;
    /* the belt itself — becomes the black strip as the camera tilts */
    ctx.fillStyle = INK;
    ctx.fillRect(0, beltY, w, beltH);
    /* tread / lane marks running along it */
    const gap = 46;
    const offset = travel % gap;
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    for (let x = -gap; x < w + gap; x += gap) {
        const tx = x - offset;
        if (tilt < 0.5)
            ctx.fillRect(tx, beltY + beltH / 2 - 1, 18, 2);
        else
            ctx.fillRect(tx, beltY + beltH * 0.5 - 1.5, 26, 3);
    }
    /* registration marks at the junction, once we are top-down */
    if (tilt > 0.2) {
        const a = (tilt - 0.2) / 0.8;
        ctx.globalAlpha = a;
        const cmyk = ['#00AEEF', '#EC008C', '#FFF200', '#FFFFFF'];
        cmyk.forEach((c, i) => {
            const cx = w * 0.5 + (i - 1.5) * 34;
            const cy = beltY + beltH + 34;
            ctx.strokeStyle = c;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx - 11, cy);
            ctx.lineTo(cx + 11, cy);
            ctx.moveTo(cx, cy - 11);
            ctx.lineTo(cx, cy + 11);
            ctx.stroke();
        });
        ctx.globalAlpha = 1;
    }
    /* freshly printed papers riding the belt */
    const accents = [INK, VIOLET, RED];
    const spacing = 320;
    const paperW = 132;
    const paperH = 168;
    const count = Math.ceil(w / spacing) + 3;
    const fade = 1 - tilt;
    for (let i = -2; i < count; i++) {
        const x = ((i * spacing + travel) % (w + spacing * 3)) - spacing;
        if (x < -spacing || x > w + spacing)
            continue;
        const bob = Math.sin(travel * 0.02 + i) * 2;
        const rise = easeOut(clamp((p - 0.06) * 3)) * 6;
        ctx.globalAlpha = fade;
        drawFoldedPaper(ctx, x, beltY + bob - rise, paperW, paperH, accents[((i % 3) + 3) % 3], Math.sin(travel * 0.01 + i) * 0.02);
        ctx.globalAlpha = 1;
    }
    /* ink mist under the rollers */
    ctx.globalAlpha = 0.05 * (1 - tilt);
    ctx.fillStyle = VIOLET;
    for (let i = 0; i < 5; i++) {
        const mx = ((time * 26 + i * 260) % (w + 300)) - 150;
        ctx.beginPath();
        ctx.ellipse(mx, beltY + beltH + 40, 120, 18, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

/** 04 · the press conveyor, side view. */
export function mountConveyor(canvas) {
  return mountScene(canvas, drawConveyor)
}
