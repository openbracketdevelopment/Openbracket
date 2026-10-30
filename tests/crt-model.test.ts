import { test } from "node:test"
import assert from "node:assert/strict"
import * as THREE from "three"
import {
  createCrtModel,
  createGlassGeometry,
  crtDimensions,
  crtScreen,
  pedestal,
} from "../lib/crt-model"

test("CRT glass is convex in both axes with continuous normals, valid UVs, and no collapsed triangles", () => {
  assert.equal(crtDimensions.screenWidth / crtDimensions.screenHeight, 4 / 3)
  const geometry = createGlassGeometry()
  const positions = geometry.getAttribute("position"),
    normals = geometry.getAttribute("normal"),
    uv = geometry.getAttribute("uv"),
    indices = geometry.getIndex()!
  const centerZ = positions.getZ(0)
  assert.ok(centerZ > crtScreen.edgeZ + 0.33)
  assert.ok(centerZ < 1.35, "glass remains recessed inside the front casing")
  let horizontalEdge = 0,
    verticalEdge = 0
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      y = positions.getY(i),
      z = positions.getZ(i)
    if (Math.abs(x) > 1.95 && Math.abs(y) < 0.05) horizontalEdge = z
    if (Math.abs(y) > 1.46 && Math.abs(x) < 0.05) verticalEdge = z
    assert.ok(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z))
    assert.ok(
      Math.abs(uv.getX(i) - (x / crtDimensions.screenWidth + 0.5)) < 1e-6,
    )
    assert.ok(
      Math.abs(uv.getY(i) - (y / crtDimensions.screenHeight + 0.5)) < 1e-6,
    )
    assert.ok(
      normals.getZ(i) > 0.75,
      "all normals face forward without grazing corner spikes",
    )
    assert.ok(
      Math.abs(
        Math.hypot(normals.getX(i), normals.getY(i), normals.getZ(i)) - 1,
      ) < 1e-5,
    )
  }
  assert.ok(centerZ > horizontalEdge + 0.3 && centerZ > verticalEdge + 0.3)
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3()
  for (let i = 0; i < indices.count; i += 3) {
    a.fromBufferAttribute(positions, indices.getX(i))
    b.fromBufferAttribute(positions, indices.getX(i + 1))
    c.fromBufferAttribute(positions, indices.getX(i + 2))
    assert.ok(
      b.sub(a).cross(c.sub(a)).lengthSq() > 1e-16,
      "no degenerate corner faces",
    )
  }
  geometry.dispose()
})

test("the centered domed pedestal supports a raised housing with a short swivel neck", () => {
  const screen = new THREE.Texture(),
    grain = new THREE.Texture(),
    logo = new THREE.Texture()
  const { group } = createCrtModel(screen, grain, logo)
  group.updateMatrixWorld(true)
  const housing = group.getObjectByName("monitor-housing")!
  assert.equal(housing.position.y, pedestal.housingLift)
  const body = new THREE.Box3().setFromObject(
    group.getObjectByName("stepped-rear-housing")!,
  )
  assert.ok(body.max.z - body.min.z > 2.8)
  const base = new THREE.Box3().setFromObject(
    group.getObjectByName("pedestal-base")!,
  )
  const neck = new THREE.Box3().setFromObject(
    group.getObjectByName("swivel-neck")!,
  )
  const mount = new THREE.Box3().setFromObject(
    group.getObjectByName("underside-mount")!,
  )
  const baseRatio = (base.max.x - base.min.x) / crtDimensions.width
  assert.ok(baseRatio >= 0.5 && baseRatio <= 0.65)
  assert.ok(Math.abs(base.max.x + base.min.x) < 0.001)
  assert.ok(base.min.y > 0.075 && base.min.y < 0.12)
  assert.ok(base.max.y - base.min.y < 0.3)
  assert.ok(
    body.min.y - base.max.y > 0.4,
    "visible space flanks the central neck",
  )
  assert.ok(
    neck.min.y <= base.max.y && neck.max.y >= mount.min.y,
    "support pieces connect",
  )
  assert.ok(group.getObjectByName("convex-display"))
  assert.ok(group.getObjectByName("printed-openbracket-logo"))
  assert.ok(!group.getObjectByName("integrated-wedge-base"))
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>()
  let vertices = 0
  group.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return
    geometries.add(object.geometry)
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material])
      materials.add(material)
    const positions = object.geometry.getAttribute("position")
    vertices += positions.count
    for (let i = 0; i < positions.count; i++)
      assert.ok(
        Number.isFinite(positions.getX(i)) &&
          Number.isFinite(positions.getY(i)) &&
          Number.isFinite(positions.getZ(i)),
      )
  })
  assert.ok(vertices < 20000)
  geometries.forEach(geometry => geometry.dispose())
  materials.forEach(material => material.dispose())
  screen.dispose()
  grain.dispose()
  logo.dispose()
})
