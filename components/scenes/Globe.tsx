'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { fibonacciSphere, latLonToVec3, loadWorld, rasterize, sampleMask, type LandMask } from '@/lib/world'
import { bureaus, pings } from '@/lib/content'

const R = 1

/* ── soft round dot sprite ────────────────────────────────────── */
function useDotTexture() {
  return useMemo(() => {
    const s = 64
    const c = document.createElement('canvas')
    c.width = c.height = s
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.5, 'rgba(255,255,255,1)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, s, s)
    const tex = new THREE.CanvasTexture(c)
    tex.needsUpdate = true
    return tex
  }, [])
}

/* ── dotted continents ────────────────────────────────────────── */
function DotSphere({ mask, count = 26000 }: { mask: LandMask | null; count?: number }) {
  const tex = useDotTexture()

  const { land, ocean } = useMemo(() => {
    const pts = fibonacciSphere(count)
    const landPos: number[] = []
    const oceanPos: number[] = []
    for (let i = 0; i < pts.length; i++) {
      const { lat, lon } = pts[i]
      const v = latLonToVec3(lat, lon, R)
      if (mask && sampleMask(mask, lon, lat)) landPos.push(v[0], v[1], v[2])
      else if (i % 5 === 0) oceanPos.push(v[0], v[1], v[2])
    }
    const mk = (arr: number[]) => {
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3))
      return g
    }
    return { land: mk(landPos), ocean: mk(oceanPos) }
  }, [mask, count])

  return (
    <group>
      <points geometry={land}>
        <pointsMaterial
          map={tex}
          size={0.014}
          sizeAttenuation
          transparent
          depthWrite={false}
          opacity={0.95}
          color="#ffffff"
        />
      </points>
      <points geometry={ocean}>
        <pointsMaterial
          map={tex}
          size={0.007}
          sizeAttenuation
          transparent
          depthWrite={false}
          opacity={0.2}
          color="#b9a4ff"
        />
      </points>
    </group>
  )
}

/* ── violet rim light ─────────────────────────────────────────── */
function RimLight() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
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
      }),
    []
  )
  return (
    <mesh scale={1.012}>
      <sphereGeometry args={[R, 64, 64]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

/** Occluder so back-side dots read dimmer, like UC's globe. */
function Core() {
  return (
    <mesh scale={0.988}>
      <sphereGeometry args={[R, 48, 48]} />
      <meshBasicMaterial color="#030208" />
    </mesh>
  )
}

/* ── breaking pings + arcs back to HQ ─────────────────────────── */

const cityOf = (name: string) =>
  bureaus.find((b) => b.city === name || b.label.includes(name)) ??
  bureaus.find((b) => b.hq)!

const HQ = bureaus.find((b) => b.hq)!

function arcPoints(from: THREE.Vector3, to: THREE.Vector3, lift = 0.38) {
  const mid = from.clone().add(to).multiplyScalar(0.5)
  const d = from.distanceTo(to)
  mid.normalize().multiplyScalar(R + lift * d)
  const curve = new THREE.QuadraticBezierCurve3(from, mid, to)
  return curve
}

const ARC_SEGMENTS = 64

function Pings({ tagEls }: { tagEls: React.MutableRefObject<(HTMLElement | null)[]> }) {
  const { camera, size } = useThree()
  const groupRef = useRef<THREE.Group>(null)

  const hq = useMemo(() => new THREE.Vector3(...latLonToVec3(HQ.lat, HQ.lon, R)), [])

  const items = useMemo(
    () =>
      pings.map((p, i) => {
        const c = cityOf(p.city)
        const pos = new THREE.Vector3(...latLonToVec3(c.lat, c.lon, R))
        const curve = arcPoints(pos, hq)
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(curve.getPoints(ARC_SEGMENTS)),
          new THREE.LineBasicMaterial({ color: '#E10600', transparent: true, opacity: 0 })
        )
        const quat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          pos.clone().normalize()
        )
        return { ...p, pos, curve, line, quat, phase: i / pings.length }
      }),
    [hq]
  )

  const ringRefs = useRef<(THREE.Mesh | null)[]>([])
  const travelRefs = useRef<(THREE.Mesh | null)[]>([])
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const camDir = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const world = groupRef.current
    if (!world) return

    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      const cycle = (t * 0.26 + it.phase) % 1

      // flare ring
      const ring = ringRefs.current[i]
      if (ring) {
        const k = Math.min(1, cycle / 0.34)
        ring.scale.setScalar(0.02 + k * 0.15)
        ;(ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - k) * 0.9
      }

      // arc draws on, then fades
      const drawn = Math.min(1, Math.max(0, (cycle - 0.14) / 0.42))
      it.line.geometry.setDrawRange(0, Math.max(2, Math.floor(drawn * (ARC_SEGMENTS + 1))))
      ;(it.line.material as THREE.LineBasicMaterial).opacity =
        drawn >= 1 ? Math.max(0, 1 - (cycle - 0.56) / 0.3) * 0.45 : drawn > 0 ? 0.75 : 0

      // travelling dot
      const trav = travelRefs.current[i]
      if (trav) {
        trav.position.copy(it.curve.getPoint(Math.min(0.999, drawn)))
        ;(trav.material as THREE.MeshBasicMaterial).opacity = drawn > 0.02 && drawn < 0.99 ? 1 : 0
      }

      // project the headline tag into screen space
      const el = tagEls.current[i]
      if (el) {
        tmp.copy(it.pos).applyMatrix4(world.matrixWorld)
        camDir.copy(camera.position).sub(tmp).normalize()
        const facing = tmp.clone().normalize().dot(camDir) > 0.1
        tmp.project(camera)
        const x = (tmp.x * 0.5 + 0.5) * size.width
        const y = (-tmp.y * 0.5 + 0.5) * size.height
        const show = facing && cycle > 0.12 && cycle < 0.74
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`
        el.style.opacity = show ? '1' : '0'
      }
    }
  })

  return (
    <group ref={groupRef}>
      {items.map((it, i) => (
        <group key={it.city} position={it.pos} quaternion={it.quat}>
          <mesh
            ref={(m) => {
              ringRefs.current[i] = m
            }}
          >
            <ringGeometry args={[0.72, 1, 40]} />
            <meshBasicMaterial color="#E10600" transparent side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.012, 12, 12]} />
            <meshBasicMaterial color="#E10600" />
          </mesh>
        </group>
      ))}

      {items.map((it) => (
        <primitive key={`arc-${it.city}`} object={it.line} />
      ))}

      {items.map((it, i) => (
        <mesh
          key={`trav-${it.city}`}
          ref={(m) => {
            travelRefs.current[i] = m
          }}
        >
          <sphereGeometry args={[0.014, 10, 10]} />
          <meshBasicMaterial color="#ffffff" transparent />
        </mesh>
      ))}

      {/* HQ marker — Noida */}
      <mesh position={hq}>
        <sphereGeometry args={[0.018, 14, 14]} />
        <meshBasicMaterial color="#B9A4FF" />
      </mesh>
    </group>
  )
}

/* ── rotating rig ─────────────────────────────────────────────── */
function Rig({
  mask,
  tagEls,
  count,
}: {
  mask: LandMask | null
  tagEls: React.MutableRefObject<(HTMLElement | null)[]>
  count: number
}) {
  const g = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.055
  })
  return (
    <group ref={g} rotation={[0.28, -1.5, 0.12]}>
      <Core />
      <DotSphere mask={mask} count={count} />
      <RimLight />
      <Pings tagEls={tagEls} />
    </group>
  )
}

/* ── exported canvas ──────────────────────────────────────────── */
export default function Globe({
  tagEls,
  dense = true,
  active = true,
}: {
  tagEls: React.MutableRefObject<(HTMLElement | null)[]>
  dense?: boolean
  active?: boolean
}) {
  const [mask, setMask] = useState<LandMask | null>(null)

  useEffect(() => {
    let alive = true
    loadWorld().then((w) => {
      if (alive) setMask(rasterize(w.land, 720, 360, 0))
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <Canvas
      dpr={[1, 1.8]}
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 0, 4.55], fov: 34 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
    >
      <Rig mask={mask} tagEls={tagEls} count={dense ? 26000 : 11000} />
    </Canvas>
  )
}
