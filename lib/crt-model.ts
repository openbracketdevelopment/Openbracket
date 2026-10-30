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
  sections: { z: number; width: number; bottom: number; top: number }[],
  radius: number,
) {
  const positions: number[] = [],
    indices: number[] = []
  const count = outline(1, 1, radius).length
  for (const section of sections)
    for (const point of outline(
      section.width,
      section.top - section.bottom,
      radius,
      (section.top + section.bottom) / 2,
    ))
      positions.push(point.x, point.y, section.z)
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
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
export function createGlassGeometry() {
  const { screenWidth: width, screenHeight: height } = crtDimensions
  const geometry = new THREE.PlaneGeometry(width, height, 48, 36)
  const positions = geometry.getAttribute("position")
  const radius = 0.16
  for (let i = 0; i < positions.count; i++) {
    let x = positions.getX(i),
      y = positions.getY(i)
    const u = x / (width / 2),
      v = y / (height / 2)
    const cx = Math.max(0, Math.abs(x) - (width / 2 - radius)),
      cy = Math.max(0, Math.abs(y) - (height / 2 - radius))
    const distance = Math.hypot(cx, cy)
    if (distance > radius) {
      x = Math.sign(x) * (width / 2 - radius + (cx * radius) / distance)
      y = Math.sign(y) * (height / 2 - radius + (cy * radius) / distance)
    }
    positions.setXYZ(i, x, y, 0.97 + 0.16 * (1 - u * u) * (1 - v * v))
  }
  geometry.computeVertexNormals()
  return geometry
}
export function createCrtModel(
  screen: THREE.Texture,
  grain: THREE.Texture,
  logo: THREE.Texture,
) {
  const group = new THREE.Group()
  const plastic = new THREE.MeshStandardMaterial({
    color: "#bdb7aa",
    roughness: 0.72,
    bumpMap: grain,
    bumpScale: 0.006,
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
    roughness: 0.95,
  })
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    map: screen,
    emissiveMap: screen,
    emissive: "#ffffff",
    emissiveIntensity: 0.62,
    roughness: 0.34,
    metalness: 0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.3,
    envMapIntensity: 0.12,
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
    group.add(mesh)
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
        { z: 1.355, width: 4.57, bottom: 0.77, top: 4.27 },
        { z: 1.285, width: 4.38, bottom: 0.88, top: 4.12 },
        { z: 0.955, width: 3.97, bottom: 1.0025, top: 3.9975 },
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
  add(
    new THREE.PlaneGeometry(4.03, 3.035),
    new THREE.MeshBasicMaterial({ color: "#050807" }),
    0,
    2.5,
    0.94,
  )
  const glass = add(createGlassGeometry(), glassMaterial, 0, 2.5, 0)
  glass.name = "convex-display"
  glass.castShadow = false
  glass.receiveShadow = false
  // Reference-style horizontal vents sit on the tapered right-hand enclosure.
  const ventGeometry = new THREE.BoxGeometry(0.013, 0.027, 1.0)
  for (let i = 0; i < 18; i++) {
    const vent = add(ventGeometry, ventMaterial, 2.218, 1.12 + i * 0.055, -0.48)
    vent.rotation.y = 0.125
  }
  // Wedge rests directly on the ground; its top shares the housing footprint.
  const wedgeShape = new THREE.Shape([
    new THREE.Vector2(-1.52, 0.12),
    new THREE.Vector2(1.4, 0.12),
    new THREE.Vector2(1.18, 0.37),
    new THREE.Vector2(-1.12, 0.37),
  ])
  const wedge = add(
    new THREE.ExtrudeGeometry(wedgeShape, {
      depth: 4.45,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.025,
      bevelSegments: 2,
      steps: 1,
    }),
    plastic,
  )
  wedge.rotation.y = Math.PI / 2
  wedge.position.x = -2.225
  wedge.name = "integrated-wedge-base"
  const button = add(
    new THREE.BoxGeometry(0.31, 0.28, 0.025),
    plastic,
    1.82,
    0.54,
    1.392,
  )
  button.name = "recessed-power-button"
  add(new THREE.BoxGeometry(0.33, 0.3, 0.012), seam, 1.82, 0.54, 1.348)
  add(
    new THREE.BoxGeometry(0.085, 0.038, 0.012),
    new THREE.MeshStandardMaterial({
      color: "#49a224",
      emissive: "#33be16",
      emissiveIntensity: 1,
    }),
    1.39,
    0.8,
    1.37,
  )
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
  return { group, plastic, bezel, seam, glassMaterial }
}
