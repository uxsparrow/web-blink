/**
 * 01 · the hero globe — plain Three.js.
 * White dots sit on real Natural Earth land, red pings flare on bureau cities
 * and arc back to Noida, and the headline tags are projected into screen space
 * so they stay live HTML.
 */

import * as THREE from '../../vendor/three.module.min.js'
import { bureaus, pings, START_LON } from '../lib/content.js'
import { fibonacciSphere, latLonToVec3, loadWorld, rasterize, sampleMask } from '../lib/world.js'

const R = 1
const ARC_SEGMENTS = 64

const HQ = bureaus.find((b) => b.hq)

const BREAKING = 0xe10600
const WIRE = 0xb9a4ff

/**
 * Yaw that parks a given longitude in front of the camera.
 *
 * latLonToVec3 places a point at angle `-lon` in the xz plane, and a Y
 * rotation of θ moves that angle to `-lon - θ`. Facing the camera is +90°,
 * so θ = -(lon + 90).
 */
const yawFor = (lon) => (-(lon + 90) * Math.PI) / 180

/* ── soft round dot sprite ────────────────────────────────────── */
function dotTexture() {
  const s = 64
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.5, 'rgba(255,255,255,1)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, s, s)
  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}

/* ── dotted continents ────────────────────────────────────────── */
function buildDots(mask, count, tex) {
  const pts = fibonacciSphere(count)
  const landPos = []
  const oceanPos = []
  for (let i = 0; i < pts.length; i++) {
    const { lat, lon } = pts[i]
    const v = latLonToVec3(lat, lon, R)
    if (mask && sampleMask(mask, lon, lat)) landPos.push(v[0], v[1], v[2])
    else if (i % 5 === 0) oceanPos.push(v[0], v[1], v[2])
  }
  const geom = (arr) => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3))
    return g
  }
  const group = new THREE.Group()
  group.add(
    new THREE.Points(
      geom(landPos),
      new THREE.PointsMaterial({
        map: tex,
        size: 0.014,
        sizeAttenuation: true,
        transparent: true,
        depthWrite: false,
        opacity: 0.95,
        color: 0xffffff,
      })
    )
  )
  group.add(
    new THREE.Points(
      geom(oceanPos),
      new THREE.PointsMaterial({
        map: tex,
        size: 0.007,
        sizeAttenuation: true,
        transparent: true,
        depthWrite: false,
        opacity: 0.2,
        color: 0xb9a4ff,
      })
    )
  )
  return group
}

/* ── violet rim light ─────────────────────────────────────────── */
function rimLight() {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { uColor: { value: new THREE.Color('#6118EA') } },
    vertexShader: `
      varying vec3 vN; varying vec3 vP;
      void main(){
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        vP = mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor; varying vec3 vN; varying vec3 vP;
      void main(){
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(-vP))), 7.0);
        gl_FragColor = vec4(uColor, f * 0.85);
      }
    `,
  })
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 64), mat)
  mesh.scale.setScalar(1.012)
  return mesh
}

/** Occluder so back-side dots read dimmer. */
function core() {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(R, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0x030208 })
  )
  mesh.scale.setScalar(0.988)
  return mesh
}

/* ── breaking pings + arcs back to HQ ─────────────────────────── */
function buildPings(tagEls, labelHost) {
  const hq = new THREE.Vector3(...latLonToVec3(HQ.lat, HQ.lon, R))
  const group = new THREE.Group()

  let tagCursor = 0

  const items = pings.map((p, i) => {
    const hot = !!p.bureau // a bureau the brief names — red; everything else is wire
    const colour = hot ? BREAKING : WIRE
    const pos = new THREE.Vector3(...latLonToVec3(p.lat, p.lon, R))

    const span = pos.distanceTo(hq)
    const mid = pos.clone().add(hq).multiplyScalar(0.5)
    mid.normalize().multiplyScalar(R + 0.38 * span)
    const curve = new THREE.QuadraticBezierCurve3(pos, mid, hq)

    // Delhi sits on top of the Noida desk, so it has no arc to draw
    const line =
      span > 0.08
        ? new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(curve.getPoints(ARC_SEGMENTS)),
          new THREE.LineBasicMaterial({ color: colour, transparent: true, opacity: 0 })
        )
        : null
    if (line) group.add(line)

    // the four named bureaus carry the full headline tag from the markup;
    // every other ping gets a plain city label, built here
    let el = null
    if (p.tag) {
      el = tagEls[tagCursor++] || null
    } else if (labelHost) {
      el = document.createElement('span')
      el.className = `mono-xs ping-label${hot ? ' is-bureau' : ''}`
      el.textContent = p.city
      labelHost.appendChild(el)
    }

    const spot = new THREE.Group()
    spot.position.copy(pos)
    spot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize())

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.72, 1, 40),
      new THREE.MeshBasicMaterial({
        color: colour,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    )
    spot.add(ring)
    spot.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(hot ? 0.012 : 0.008, 12, 12),
        new THREE.MeshBasicMaterial({ color: colour })
      )
    )
    group.add(spot)

    const trav = new THREE.Mesh(
      new THREE.SphereGeometry(hot ? 0.014 : 0.009, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })
    )
    group.add(trav)

    return {
      ...p,
      hot,
      pos,
      curve,
      line,
      ring,
      trav,
      el,
      // spread the firing order so they don't all flare together
      phase: ((i * 7) % pings.length) / pings.length,
      flare: hot ? 0.15 : 0.1,
    }
  })

  // HQ marker — Noida
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 14, 14),
    new THREE.MeshBasicMaterial({ color: 0xb9a4ff })
  )
  marker.position.copy(hq)
  group.add(marker)

  return { group, items }
}

/* ── mount ────────────────────────────────────────────────────── */

export function mountGlobe(canvas, { tagEls = [], dense = true } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setClearAlpha(0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
  camera.position.set(0, 0, 4.55)

  const rig = new THREE.Group()
  // open on the Indian subcontinent from the left, rotating across
  rig.rotation.set(0.28, yawFor(START_LON), 0.12)
  scene.add(rig)

  rig.add(core())
  const tex = dotTexture()
  let dots = null

  const rim = rimLight()
  rig.add(rim)

  const labelHost = canvas.parentElement?.querySelector('[data-ping-labels]') || null
  const { group: pingGroup, items } = buildPings(tagEls, labelHost)
  rig.add(pingGroup)

  loadWorld().then((world) => {
    const mask = rasterize(world.land, 720, 360, 0)
    dots = buildDots(mask, dense ? 26000 : 11000, tex)
    rig.add(dots)
  })

  const resize = () => {
    const r = canvas.getBoundingClientRect()
    if (!r.width || !r.height) return
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8))
    renderer.setSize(r.width, r.height, false)
    camera.aspect = r.width / r.height
    camera.updateProjectionMatrix()
  }

  const tmp = new THREE.Vector3()
  const camDir = new THREE.Vector3()
  const clock = new THREE.Clock()
  const viewport = new THREE.Vector2()

  let raf = 0
  let running = false

  const frame = () => {
    const dt = clock.getDelta()
    const t = clock.elapsedTime
    rig.rotation.y += dt * 0.035

    const size = renderer.getSize(viewport)

    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      const cycle = (t * 0.26 + it.phase) % 1

      // flare ring
      const k = Math.min(1, cycle / 0.34)
      it.ring.scale.setScalar(0.02 + k * it.flare)
      it.ring.material.opacity = Math.max(0, 1 - k) * (it.hot ? 0.9 : 0.55)

      // arc draws on, then fades
      const drawn = Math.min(1, Math.max(0, (cycle - 0.14) / 0.42))
      const peak = it.hot ? 0.75 : 0.4
      if (it.line) {
        it.line.geometry.setDrawRange(0, Math.max(2, Math.floor(drawn * (ARC_SEGMENTS + 1))))
        it.line.material.opacity =
          drawn >= 1 ? Math.max(0, 1 - (cycle - 0.56) / 0.3) * peak * 0.6 : drawn > 0 ? peak : 0
      }

      // travelling dot
      it.trav.position.copy(it.curve.getPoint(Math.min(0.999, drawn)))
      it.trav.material.opacity = it.line && drawn > 0.02 && drawn < 0.99 ? 1 : 0

      // project the label into screen space
      const el = it.el
      if (el) {
        tmp.copy(it.pos).applyMatrix4(pingGroup.matrixWorld)
        camDir.copy(camera.position).sub(tmp).normalize()
        const facing = tmp.clone().normalize().dot(camDir) > 0.1
        tmp.project(camera)
        const x = (tmp.x * 0.5 + 0.5) * size.x
        const y = (-tmp.y * 0.5 + 0.5) * size.y
        const show = facing && cycle > 0.12 && cycle < 0.74
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`
        el.style.opacity = show ? '1' : '0'
      }
    }

    renderer.render(scene, camera)
    raf = requestAnimationFrame(frame)
  }

  resize()
  window.addEventListener('resize', resize)

  return {
    setActive(on) {
      if (on && !running) {
        running = true
        clock.getDelta() // drop the idle gap
        raf = requestAnimationFrame(frame)
      } else if (!on && running) {
        running = false
        cancelAnimationFrame(raf)
      }
    },
    destroy() {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      renderer.dispose()
    },
  }
}
