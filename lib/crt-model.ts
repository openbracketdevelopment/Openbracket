import * as THREE from "three"

// Physical proportions in scene units; display opening is 4:3.
export const crtDimensions = {
  width: 4.8,
  height: 4.05,
  depth: 3.3,
  screenWidth: 3.94,
  screenHeight: 2.955,
}

function outline(width: number, height: number, radius: number, centerY = 0) {
  const points: THREE.Vector2[] = []
  const corners = [
    [width / 2 - radius, -height / 2 + radius, -Math.PI / 2],
    [width / 2 - radius, height / 2 - radius, 0],
    [-width / 2 + radius, height / 2 - radius, Math.PI / 2],
    [-width / 2 + radius, -height / 2 + radius, Math.PI],
  ]
  for (const [x, y, angle] of corners)
    for (let i = 0; i <= 8; i++) {
      const a = angle + ((i / 8) * Math.PI) / 2
      points.push(
        new THREE.Vector2(
          x + Math.cos(a) * radius,
          y + centerY + Math.sin(a) * radius,
        ),
      )
    }
  return points
}
function ring(
  outerWidth: number,
  outerHeight: number,
  innerWidth: number,
  innerHeight: number,
  innerOffset: number,
  depth: number,
) {
  const shape = new THREE.Shape(outline(outerWidth, outerHeight, 0.06))
  shape.holes.push(
    new THREE.Path(outline(innerWidth, innerHeight, 0.035, innerOffset)),
  )
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 4,
  })
}
function loft(
  sections: {
    z: number
    width: number
    bottom: number
    top: number
    radius?: number
  }[],
  radius: number,
) {
  const positions: number[] = [],
    indices: number[] = [],
    uv: number[] = []
  const count = outline(1, 1, radius).length
  for (const [sectionIndex, section] of sections.entries()) {
    const points = outline(
      section.width,
      section.top - section.bottom,
      section.radius ?? radius,
      (section.top + section.bottom) / 2,
    )
    for (const [i, point] of points.entries()) {
      positions.push(point.x, point.y, section.z)
      uv.push(i / count, sectionIndex / Math.max(1, sections.length - 1))
    }
  }
  for (let j = 0; j < sections.length - 1; j++)
    for (let i = 0; i < count; i++) {
      const a = j * count + i,
        b = j * count + ((i + 1) % count),
        c = a + count,
        d = b + count
      indices.push(a, c, b, b, c, d)
    }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  )
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
export const crtScreen = { radius: 0.2, edgeZ: 0.92, bulge: 0.34, centerY: 2.5 }
export const pedestal = { housingLift: 0.55, radius: 1.48, depthScale: 0.8 }

export function createGlassGeometry() {
  const { screenWidth: width, screenHeight: height } = crtDimensions
  // Concentric rounded-rectangle rings have no collapsed corner triangles.
  // UVs come from the actual XY positions, keeping terminal glyphs consistent.
  const boundary = new THREE.Shape(outline(width, height, crtScreen.radius))
    .getSpacedPoints(192)
    .slice(0, -1)
  const count = boundary.length,
    rings = 24
  const positions = [0, 0, crtScreen.edgeZ + crtScreen.bulge],
    uv = [0.5, 0.5],
    indices: number[] = []
  for (let ring = 1; ring <= rings; ring++)
    for (const point of boundary) {
      const x = (point.x * ring) / rings,
        y = (point.y * ring) / rings
      const u = x / (width / 2),
        v = y / (height / 2)
      positions.push(
        x,
        y,
        crtScreen.edgeZ + crtScreen.bulge * (1 - u * u) * (1 - v * v),
      )
      uv.push(x / width + 0.5, y / height + 0.5)
    }
  for (let i = 0; i < count; i++) indices.push(0, 1 + i, 1 + ((i + 1) % count))
  for (let ring = 1; ring < rings; ring++)
    for (let i = 0; i < count; i++) {
      const a = 1 + (ring - 1) * count + i,
        b = 1 + (ring - 1) * count + ((i + 1) % count)
      const c = a + count,
        d = b + count
      indices.push(a, c, d, a, d, b)
    }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  )
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export function createCrtModel(
  screen: THREE.Texture,
  grain: THREE.Texture,
  logo: THREE.Texture,
  display: { emission?: THREE.Texture; powerGlyph?: THREE.Texture } = {},
) {
  const group = new THREE.Group()
  const housing = new THREE.Group()
  housing.name = "monitor-housing"
  housing.position.y = pedestal.housingLift
  group.add(housing)
  const plastic = new THREE.MeshStandardMaterial({
    color: "#bdb7aa",
    roughness: 0.82,
    roughnessMap: grain,
    bumpMap: grain,
    bumpScale: 0.004,
  })
  const bezel = new THREE.MeshStandardMaterial({
    color: "#332b29",
    roughness: 0.76,
  })
  const seam = new THREE.MeshStandardMaterial({
    color: "#666154",
    roughness: 0.9,
  })
  const ventMaterial = new THREE.MeshStandardMaterial({
    color: "#24261f",
    roughness: 0.98,
    bumpMap: grain,
    bumpScale: 0.003,
  })
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    map: screen,
    emissiveMap: display.emission ?? screen,
    emissive: "#ffffff",
    emissiveIntensity: 0.62,
    roughness: 0.34,
    metalness: 0,
    clearcoat: 0.3,
    specularIntensity: 0.25,
    clearcoatRoughness: 0.4,
    envMapIntensity: 0.07,
    roughnessMap: grain,
  })
  function add(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
  ) {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    housing.add(mesh)
    return mesh
  }
  // The outer frame is a real beveled extrusion with an opening, not a solid box behind an overlay.
  const frame = add(
    ring(4.8, 4.05, 4.57, 3.5, 0.195, 0.32),
    plastic,
    0,
    2.325,
    1.03,
  )
  frame.name = "front-casing"
  const bodySections = [
    { z: 1.01, width: 4.78, bottom: 0.32, top: 4.33 },
    { z: 0.63, width: 4.77, bottom: 0.32, top: 4.32 },
    { z: 0.59, width: 4.75, bottom: 0.33, top: 4.3 },
    { z: 0.27, width: 4.7, bottom: 0.35, top: 4.27 },
    { z: 0.21, width: 4.66, bottom: 0.36, top: 3.76 },
    { z: -1.9, width: 4.13, bottom: 0.63, top: 3.32 },
  ]
  add(loft(bodySections, 0.045), plastic).name = "stepped-rear-housing"
  const back = add(
    new THREE.ShapeGeometry(new THREE.Shape(outline(4.13, 2.69, 0.045))),
    plastic,
    0,
    1.975,
    -1.9,
  )
  back.rotation.y = Math.PI
  // Narrow casing joint wraps around the housing just behind its front rim.
  add(
    loft(
      [
        { z: 0.618, width: 4.785, bottom: 0.317, top: 4.335 },
        { z: 0.605, width: 4.785, bottom: 0.317, top: 4.335 },
      ],
      0.045,
    ),
    seam,
  )
  const slope = add(
    loft(
      [
        { z: 1.355, width: 4.57, bottom: 0.77, top: 4.27, radius: 0.055 },
        { z: 1.365, width: 4.52, bottom: 0.8, top: 4.24, radius: 0.07 },
        { z: 1.35, width: 4.43, bottom: 0.85, top: 4.18, radius: 0.09 },
        { z: 1.32, width: 4.29, bottom: 0.91, top: 4.1, radius: 0.13 },
        { z: 1.24, width: 4.17, bottom: 0.965, top: 4.035, radius: 0.18 },
        { z: 1.08, width: 4.035, bottom: 1.0025, top: 3.9975, radius: 0.205 },
        { z: 0.925, width: 3.955, bottom: 1.015, top: 3.985, radius: 0.205 },
        { z: 0.86, width: 3.9, bottom: 1.0375, top: 3.9625, radius: 0.19 },
      ],
      0.12,
    ),
    bezel,
  )
  // The opening faces inward; reverse the loft triangles to light the recessed surfaces correctly.
  const index = slope.geometry.getIndex()!
  for (let i = 0; i < index.count; i += 3) {
    const b = index.getX(i + 1)
    index.setX(i + 1, index.getX(i + 2))
    index.setX(i + 2, b)
  }
  slope.geometry.computeVertexNormals()
  slope.name = "recessed-bezel"
  const glass = add(createGlassGeometry(), glassMaterial, 0, 2.5, 0)
  glass.name = "convex-display"
  glass.castShadow = false
  glass.receiveShadow = false
  // Reference-style horizontal vents sit on the tapered right-hand enclosure.
  const ventGeometry = new THREE.BoxGeometry(0.013, 0.027, 1.0)
  for (let i = 0; i < 18; i++) {
    const vent = add(ventGeometry, ventMaterial, 2.168, 1.12 + i * 0.055, -1.15)
    vent.rotation.y = 0.125
  }
  // Tilt/swivel pedestal: a domed oval footprint with a short central joint.
  const baseProfile = [
    [0, 0.1],
    [1.3, 0.1],
    [1.4, 0.11],
    [1.46, 0.13],
    [1.48, 0.16],
    [1.47, 0.19],
    [1.43, 0.22],
    [1.34, 0.25],
    [1.16, 0.28],
    [0.94, 0.305],
    [0.66, 0.33],
    [0.44, 0.34],
    [0, 0.34],
  ].map(([r, y]) => new THREE.Vector2(r, y))
  const base = add(
    new THREE.LatheGeometry(baseProfile, 64),
    plastic,
    0,
    0,
    -0.2,
  )
  base.scale.z = pedestal.depthScale
  base.name = "pedestal-base"
  group.add(base)
  const neckProfile = [
    [0, 0.3],
    [0.46, 0.3],
    [0.5, 0.33],
    [0.46, 0.37],
    [0.36, 0.42],
    [0.31, 0.49],
    [0.31, 0.69],
    [0.36, 0.77],
    [0.47, 0.83],
    [0.54, 0.88],
    [0.54, 0.94],
    [0, 0.94],
  ].map(([r, y]) => new THREE.Vector2(r, y))
  const neck = add(
    new THREE.LatheGeometry(neckProfile, 48),
    plastic,
    0,
    0,
    -0.2,
  )
  neck.name = "swivel-neck"
  group.add(neck)
  const mount = add(
    new THREE.CylinderGeometry(0.58, 0.54, 0.105, 48),
    seam,
    0,
    0.9103,
    -0.2,
  )
  mount.scale.z = 0.8
  mount.rotation.x = 0.127
  mount.name = "underside-mount"
  group.add(mount)
  const scuffMaterial = new THREE.MeshBasicMaterial({
    color: "#767569",
    transparent: true,
    opacity: 0.045,
    depthWrite: false,
  })
  for (const [x, y, angle] of [
    [1.65, 0.39, -0.12],
    [-1.82, 0.36, 0.06],
    [1.98, 0.68, -0.2],
  ]) {
    const scuff = add(
      new THREE.PlaneGeometry(0.16, 0.0025),
      scuffMaterial,
      x,
      y,
      1.379,
    )
    scuff.rotation.z = angle
    scuff.castShadow = false
  }
  const powerMaterial = plastic.clone()
  const buttonShape = new THREE.Shape(outline(0.265, 0.235, 0.025))
  const buttonGeometry = new THREE.ExtrudeGeometry(buttonShape, {
    depth: 0.018,
    bevelEnabled: true,
    bevelSize: 0.009,
    bevelThickness: 0.009,
    bevelSegments: 3,
    steps: 1,
  })
  buttonGeometry.translate(0, 0, -0.009)
  const button = add(buttonGeometry, powerMaterial, 1.82, 0.54, 1.399)
  button.name = "recessed-power-button"
  const recessShape = new THREE.Shape(outline(0.35, 0.32, 0.035))
  recessShape.holes.push(new THREE.Path(outline(0.303, 0.273, 0.025)))
  add(
    new THREE.ExtrudeGeometry(recessShape, {
      depth: 0.02,
      bevelEnabled: true,
      bevelSize: 0.004,
      bevelThickness: 0.004,
      bevelSegments: 2,
      steps: 1,
    }),
    seam,
    1.82,
    0.54,
    1.377,
  ).name = "power-button-recess"
  const symbol = new THREE.Mesh(
    new THREE.PlaneGeometry(0.19, 0.19),
    new THREE.MeshBasicMaterial({
      map: display.powerGlyph ?? logo,
      transparent: true,
      depthWrite: false,
    }),
  )
  symbol.position.z = 0.02
  symbol.castShadow = false
  button.add(symbol)
  const indicatorMaterial = new THREE.MeshStandardMaterial({
    color: "#49a224",
    emissive: "#33be16",
    emissiveIntensity: 0.8,
  })
  add(
    new THREE.BoxGeometry(0.085, 0.038, 0.012),
    indicatorMaterial,
    1.39,
    0.8,
    1.37,
  ).name = "power-indicator"
  const badge = add(
    new THREE.PlaneGeometry(1.12, 0.22),
    new THREE.MeshBasicMaterial({
      map: logo,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    }),
    -1.51,
    0.55,
    1.378,
  )
  badge.castShadow = false
  badge.name = "printed-openbracket-logo"
  return {
    group,
    plastic,
    bezel,
    seam,
    glassMaterial,
    button,
    powerMaterial,
    indicatorMaterial,
  }
}
