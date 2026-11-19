import { useEffect, useRef, useState } from 'react';
import { geoAlbersUsa, geoPath } from 'd3-geo';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { colors, spacing, typography } from '@/designTokens';
import type { MapShape } from '@/hooks/useExploreData';
import { reliefColor } from '@/libs/flagship/explore/reliefScale';

export interface ReliefPin {
  /** A state's two-letter code. */
  code: string;
  name: string;
  /** The formatted value, or none where the measure has no state values. */
  value?: string;
}

interface ReliefModelProps {
  shapes: MapShape[];
  /** Each state's place on the scale, 0 to 1; a state without a value is left out. */
  positions: Record<string, number>;
  /** True where the measure has no state values: every block lies flat. */
  flat: boolean;
  /** The chosen state's code, or null for the whole country. */
  selected: string | null;
  /** The state under the pointer, here or in the skyline. */
  hot: string | null;
  /** The states that carry a label. */
  pins: ReliefPin[];
  /** Pixels on the right that the page's column covers; the country keeps clear of them. */
  clearRight: number;
  /** A phone: the model does not turn or zoom, so the page can scroll. */
  compact: boolean;
  onHover: (code: string | null) => void;
  onSelect: (code: string | null) => void;
}

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 620;
const HEIGHT_MIN = 5;
const HEIGHT_MAX = 78;
const HEIGHT_FLAT = 2.5;
/** How far the other states sink and fade once one is chosen. */
const OTHERS_HEIGHT = 0.45;
const OTHERS_FADE = 0.45;
const GLIDE_MS = 1100;
const HOME_TARGET = new THREE.Vector3(0, 70, 0);
const HOME_OFFSET = new THREE.Vector3(0, -1230, 1170);
const VIEW_DIRECTION = HOME_OFFSET.clone().normalize();
const REST_COLOR = new THREE.Color(colors.gray[200]);
const GROUND = colors.gray[100];

interface Slab {
  mesh: THREE.Mesh<THREE.ExtrudeGeometry, THREE.MeshStandardMaterial>;
  code: string;
  height: number;
  toHeight: number;
  toColor: THREE.Color;
  /** The middle of the state on the ground, and its larger side. */
  center: THREE.Vector3;
  size: number;
}

interface Stage {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  slabs: Map<string, Slab>;
  /** Frames left to draw; the loop stops at zero. */
  awake: number;
  wake: () => void;
  /** Moves the camera to look at a point from an offset: a glide, or at once. */
  flyTo: (target: THREE.Vector3, offset: THREE.Vector3, atOnce?: boolean) => void;
  fit: (clearRight: number, compact: boolean) => void;
  dispose: () => void;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/** One block per state, cut from its outline on an Albers projection. */
function buildSlabs(shapes: MapShape[], scene: THREE.Scene): Map<string, Slab> {
  const projection = geoAlbersUsa().fitSize([MAP_WIDTH, MAP_HEIGHT], {
    type: 'FeatureCollection',
    features: shapes,
  });
  const path = geoPath(projection);
  const slabs = new Map<string, Slab>();
  for (const shape of shapes) {
    const { geometry } = shape;
    const polygons =
      geometry.type === 'Polygon'
        ? [geometry.coordinates]
        : geometry.type === 'MultiPolygon'
          ? geometry.coordinates
          : [];
    const outlines: THREE.Shape[] = [];
    for (const rings of polygons) {
      const points = (ring: number[][]) =>
        ring
          .map((point) => projection(point as [number, number]))
          .filter((point): point is [number, number] => !!point)
          .map(([x, y]) => new THREE.Vector2(x - MAP_WIDTH / 2, MAP_HEIGHT / 2 - y));
      const outer = points(rings[0]);
      if (outer.length < 3) {
        continue;
      }
      const outline = new THREE.Shape(outer);
      for (const hole of rings.slice(1)) {
        const inner = points(hole);
        if (inner.length >= 3) {
          outline.holes.push(new THREE.Path(inner));
        }
      }
      outlines.push(outline);
    }
    if (!outlines.length) {
      continue;
    }
    const mesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(outlines, { depth: 1, bevelEnabled: false }),
      new THREE.MeshStandardMaterial({ color: REST_COLOR.clone(), roughness: 0.82, metalness: 0 })
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.scale.z = HEIGHT_FLAT;
    mesh.userData.code = shape.properties.id;
    const [[x0, y0], [x1, y1]] = path.bounds(shape);
    const [cx, cy] = path.centroid(shape);
    scene.add(mesh);
    slabs.set(shape.properties.id, {
      mesh,
      code: shape.properties.id,
      height: HEIGHT_FLAT,
      toHeight: HEIGHT_FLAT,
      toColor: REST_COLOR.clone(),
      center: new THREE.Vector3(cx - MAP_WIDTH / 2, MAP_HEIGHT / 2 - cy, 0),
      size: Math.max(x1 - x0, y1 - y0),
    });
  }
  return slabs;
}

/**
 * The Explore page's relief model: the country as blocks on a table,
 * each state as tall and as dark as its value. The camera glides to a
 * chosen state; the others sink and fade. The page's skyline lists the
 * same values for keyboards and screen readers, and stands in where the
 * browser has no WebGL.
 */
export default function ReliefModel({
  shapes,
  positions,
  flat,
  selected,
  hot,
  pins,
  clearRight,
  compact,
  onHover,
  onSelect,
}: ReliefModelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const pinRefs = useRef(new Map<string, HTMLDivElement>());
  const hotRef = useRef(hot);
  /** The place the camera last went to; undefined before a stage's first move. */
  const flown = useRef<string | null | undefined>(undefined);
  const handlers = useRef({ onHover, onSelect });
  const [failed, setFailed] = useState(false);
  hotRef.current = hot;
  handlers.current = { onHover, onSelect };

  // The stage: built once for the shapes, driven through refs after that,
  // so a hover or a new measure never rebuilds the scene.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.NoToneMapping;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(GROUND, 2600, 5600);
    const camera = new THREE.PerspectiveCamera(26, 1, 10, 6000);
    camera.up.set(0, 0, 1);
    scene.add(new THREE.HemisphereLight(colors.white, colors.gray[200], 2.1));
    const sun = new THREE.DirectionalLight(colors.white, 1.5);
    sun.position.set(-520, -380, 760);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -720,
      right: 720,
      top: 520,
      bottom: -520,
      near: 100,
      far: 2200,
    });
    sun.shadow.radius = 9;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 1.2;
    scene.add(sun);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(6000, 6000),
      new THREE.ShadowMaterial({ color: colors.primary[900], opacity: 0.2 })
    );
    ground.receiveShadow = true;
    scene.add(ground);

    const slabs = buildSlabs(shapes, scene);
    const meshes = [...slabs.values()].map((slab) => slab.mesh);

    const controls = new OrbitControls(camera, canvas);
    Object.assign(controls, {
      enableDamping: true,
      dampingFactor: 0.09,
      enablePan: false,
      rotateSpeed: 0.5,
      zoomSpeed: 0.7,
      minDistance: 240,
      maxDistance: 2300,
      minPolarAngle: 0.25,
      maxPolarAngle: 1.22,
      minAzimuthAngle: -0.75,
      maxAzimuthAngle: 0.75,
    });
    controls.target.copy(HOME_TARGET);
    camera.position.copy(HOME_TARGET).add(HOME_OFFSET);

    const still = prefersReducedMotion();
    let glide: {
      from: { target: THREE.Vector3; position: THREE.Vector3 };
      to: { target: THREE.Vector3; position: THREE.Vector3 };
      start: number;
    } | null = null;
    let frame = 0;
    let pointer: PointerEvent | null = null;
    let pressedAt: [number, number] | null = null;
    const raycaster = new THREE.Raycaster();
    const point = new THREE.Vector2();
    const projected = new THREE.Vector3();

    const pick = (event: PointerEvent): string | null => {
      const box = canvas.getBoundingClientRect();
      point.set(
        ((event.clientX - box.left) / box.width) * 2 - 1,
        -((event.clientY - box.top) / box.height) * 2 + 1
      );
      raycaster.setFromCamera(point, camera);
      return (raycaster.intersectObjects(meshes, false)[0]?.object.userData.code as string) ?? null;
    };

    const draw = (now: number) => {
      frame = 0;
      if (glide) {
        const t = Math.min(1, (now - glide.start) / GLIDE_MS);
        controls.target.lerpVectors(glide.from.target, glide.to.target, easeInOut(t));
        camera.position.lerpVectors(glide.from.position, glide.to.position, easeInOut(t));
        if (t >= 1) {
          glide = null;
        }
        stage.awake = Math.max(stage.awake, 2);
      }
      controls.update();
      for (const slab of slabs.values()) {
        const ease = still ? 1 : 0.11;
        slab.height += (slab.toHeight - slab.height) * ease;
        slab.mesh.scale.z = slab.height;
        slab.mesh.material.color.lerp(slab.toColor, still ? 1 : 0.12);
        slab.mesh.material.emissive.setScalar(slab.code === hotRef.current ? 0.014 : 0);
      }
      if (pointer && !glide) {
        const code = pick(pointer);
        if (code !== hotRef.current) {
          handlers.current.onHover(code);
        }
        canvas.style.cursor = code ? 'pointer' : 'grab';
      }
      renderer.render(scene, camera);
      // The labels stand on their blocks.
      const box = canvas.getBoundingClientRect();
      for (const [code, element] of pinRefs.current) {
        const slab = slabs.get(code);
        if (slab) {
          projected.copy(slab.center).setZ(slab.height).project(camera);
          element.style.transform = `translate(${((projected.x + 1) / 2) * box.width}px, ${((1 - projected.y) / 2) * box.height}px) translate(-50%, -100%)`;
        }
      }
      stage.awake -= 1;
      if (stage.awake > 0) {
        frame = requestAnimationFrame(draw);
      }
    };

    const stage: Stage = {
      renderer,
      camera,
      controls,
      slabs,
      awake: 0,
      wake: () => {
        stage.awake = 150;
        if (!frame) {
          frame = requestAnimationFrame(draw);
        }
      },
      flyTo: (target, offset, atOnce) => {
        const to = { target: target.clone(), position: target.clone().add(offset) };
        if (still || atOnce) {
          glide = null;
          controls.target.copy(to.target);
          camera.position.copy(to.position);
        } else {
          glide = {
            from: { target: controls.target.clone(), position: camera.position.clone() },
            to,
            start: performance.now(),
          };
        }
        stage.wake();
      },
      fit: (right, phone) => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (!width || !height) {
          return;
        }
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        // Shift the country left of the page's column, and widen the view on a narrow box.
        camera.setViewOffset(width, height, right / 2, 0, width, height);
        camera.fov = phone
          ? 37
          : THREE.MathUtils.clamp(26 * (1.55 / Math.max(1, (width - right) / height)), 26, 40);
        camera.updateProjectionMatrix();
        controls.enableRotate = !phone;
        controls.enableZoom = !phone;
        stage.wake();
      },
      dispose: () => {
        cancelAnimationFrame(frame);
        controls.dispose();
        for (const mesh of meshes) {
          mesh.geometry.dispose();
          mesh.material.dispose();
        }
        ground.geometry.dispose();
        ground.material.dispose();
        renderer.dispose();
      },
    };
    stageRef.current = stage;

    const onMove = (event: PointerEvent) => {
      pointer = event;
      stage.wake();
    };
    const onLeave = () => {
      pointer = null;
      handlers.current.onHover(null);
    };
    const onDown = (event: PointerEvent) => {
      pressedAt = [event.clientX, event.clientY];
      glide = null;
    };
    const onUp = (event: PointerEvent) => {
      // A press that moved was a turn of the model, not a choice.
      if (
        pressedAt &&
        Math.hypot(event.clientX - pressedAt[0], event.clientY - pressedAt[1]) <= 5
      ) {
        handlers.current.onSelect(pick(event));
      }
      pressedAt = null;
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    controls.addEventListener('change', stage.wake);

    return () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      stage.dispose();
      stageRef.current = null;
      flown.current = undefined;
    };
  }, [shapes]);

  // The box's size, and the part of it the page's column covers.
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) {
      return undefined;
    }
    stage.fit(clearRight, compact);
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(() => stage.fit(clearRight, compact));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [clearRight, compact, shapes, failed]);

  // Values and the chosen state set where each block is going.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }
    for (const slab of stage.slabs.values()) {
      const position = positions[slab.code];
      const other = !!selected && slab.code !== selected;
      if (flat || position === undefined) {
        slab.toHeight = HEIGHT_FLAT;
        slab.toColor = REST_COLOR.clone();
      } else {
        const color = new THREE.Color(reliefColor(position));
        slab.toHeight =
          (HEIGHT_MIN + position * (HEIGHT_MAX - HEIGHT_MIN)) * (other ? OTHERS_HEIGHT : 1);
        slab.toColor = other ? color.lerp(REST_COLOR, OTHERS_FADE) : color;
      }
    }
    stage.wake();
  }, [positions, flat, selected, shapes, failed]);

  // The camera follows the chosen state, and goes back out without one.
  // A new stage opens on the place at once; after that, a change glides.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || flown.current === selected) {
      return;
    }
    const atOnce = flown.current === undefined;
    flown.current = selected;
    const slab = selected ? stage.slabs.get(selected) : null;
    if (slab) {
      const distance = THREE.MathUtils.clamp(slab.size * 6.5, 760, 1300);
      stage.flyTo(slab.center, VIEW_DIRECTION.clone().multiplyScalar(distance), atOnce);
    } else {
      stage.flyTo(HOME_TARGET, HOME_OFFSET, atOnce);
    }
  }, [selected, shapes, failed]);

  useEffect(() => {
    stageRef.current?.wake();
  }, [hot, pins]);

  if (failed) {
    return (
      <p
        role="note"
        style={{
          margin: 0,
          padding: spacing['2xl'],
          color: colors.text.secondary,
          fontSize: typography.fontSize.sm,
        }}
      >
        This browser cannot draw the 3D model. The row of states below shows the same values.
      </p>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="A relief model of the United States. Each state stands as tall as its value. The row of states below lists the values."
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: 'grab',
          touchAction: compact ? 'pan-y' : 'none',
        }}
        data-testid="relief-model"
      />
      {pins.map((pin) => {
        const isHot = pin.code === hot;
        return (
          <div
            key={pin.code}
            ref={(element) => {
              if (element) {
                pinRefs.current.set(pin.code, element);
              } else {
                pinRefs.current.delete(pin.code);
              }
            }}
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              zIndex: isHot ? 2 : 1,
              paddingBottom: 14,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              willChange: 'transform',
            }}
          >
            <span
              style={{
                display: 'block',
                padding: '5px 8px',
                borderRadius: spacing.radius.element,
                background: isHot ? colors.white : colors.gray[900],
                color: isHot ? colors.gray[900] : colors.white,
                boxShadow: isHot ? `0 0 0 1px ${colors.border.light}` : undefined,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
                lineHeight: 1,
              }}
            >
              {pin.name}
              {pin.value && (
                <span style={{ marginLeft: 4, opacity: 0.72, fontWeight: 500 }}>{pin.value}</span>
              )}
            </span>
            <span
              style={{
                position: 'absolute',
                left: '50%',
                bottom: 2,
                width: 1,
                height: 12,
                background: colors.gray[900],
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
