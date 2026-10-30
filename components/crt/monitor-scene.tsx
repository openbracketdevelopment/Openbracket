"use client"
import { useEffect, useRef } from "react"
import * as THREE from "three"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"
import { createCrtModel } from "../../lib/crt-model"

export type MonitorSceneProps = {
  text: string
  blink: boolean
  active: boolean
  reduced: boolean
}
export default function MonitorScene({
  text,
  blink,
  active,
  reduced,
}: MonitorSceneProps) {
  const host = useRef<HTMLDivElement>(null)
  const update = useRef<
    | ((
        text: string,
        blink: boolean,
        active: boolean,
        reduced: boolean,
      ) => void)
    | null
  >(null)
  useEffect(() => {
    const element = host.current
    if (!element) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      })
    } catch {
      return
    }
    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        window.innerWidth < 760 ? 1.25 : 1.5,
      ),
    )
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    element.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(16, 1, 0.1, 80)
    const target = new THREE.Vector3(0, 2.18, 0.0)
    camera.position.set(10.5, 4.03, 18.2)
    camera.lookAt(target)
    const environment = new RoomEnvironment()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const environmentMap = pmrem.fromScene(environment, 0.08)
    scene.environment = environmentMap.texture
    scene.environmentIntensity = 0.35
    environment.dispose()
    pmrem.dispose()
    const screenCanvas = document.createElement("canvas")
    screenCanvas.width = 1024
    screenCanvas.height = 768
    const context = screenCanvas.getContext("2d")!
    const screenTexture = new THREE.CanvasTexture(screenCanvas)
    screenTexture.colorSpace = THREE.SRGBColorSpace
    screenTexture.anisotropy = Math.min(
      4,
      renderer.capabilities.getMaxAnisotropy(),
    )
    const noise = new Uint8Array(64 * 64 * 4)
    let seed = 37
    for (let i = 0; i < noise.length; i += 4) {
      seed = (seed * 16807) % 2147483647
      noise[i] = noise[i + 1] = noise[i + 2] = 120 + (seed % 16)
      noise[i + 3] = 255
    }
    const grain = new THREE.DataTexture(noise, 64, 64)
    grain.wrapS = grain.wrapT = THREE.RepeatWrapping
    grain.repeat.set(9, 9)
    grain.needsUpdate = true
    const logoCanvas = document.createElement("canvas")
    logoCanvas.width = 640
    logoCanvas.height = 128
    const logoContext = logoCanvas.getContext("2d")!
    const logoTexture = new THREE.CanvasTexture(logoCanvas)
    logoTexture.colorSpace = THREE.SRGBColorSpace
    const model = createCrtModel(screenTexture, grain, logoTexture)
    scene.add(model.group)
    scene.add(new THREE.HemisphereLight("#e9efff", "#7a7060", 1.1))
    const key = new THREE.DirectionalLight("#fff6e8", 2.0)
    key.position.set(-3.5, 7.5, 7)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = -6
    key.shadow.camera.right = 6
    key.shadow.camera.top = 7
    key.shadow.camera.bottom = -4
    key.shadow.normalBias = 0.035
    key.shadow.bias = -0.0002
    key.shadow.radius = 4
    scene.add(key)
    const warmFill = new THREE.DirectionalLight("#ffbd99", 1.25)
    warmFill.position.set(5, 4.5, -0.3)
    scene.add(warmFill)
    const frontFill = new THREE.DirectionalLight("#d8e1ed", 0.45)
    frontFill.position.set(2, 2, 8)
    scene.add(frontFill)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.ShadowMaterial({ opacity: 0.22 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = 0.075
    ground.receiveShadow = true
    scene.add(ground)
    // A broad feathered contact patch keeps the wedge grounded at small render sizes.
    const contactCanvas = document.createElement("canvas")
    contactCanvas.width = contactCanvas.height = 128
    const contactContext = contactCanvas.getContext("2d")!
    const radial = contactContext.createRadialGradient(64, 64, 5, 64, 64, 64)
    radial.addColorStop(0, "rgba(0,0,0,.33)")
    radial.addColorStop(1, "rgba(0,0,0,0)")
    contactContext.fillStyle = radial
    contactContext.fillRect(0, 0, 128, 128)
    const contactTexture = new THREE.CanvasTexture(contactCanvas)
    const contact = new THREE.Mesh(
      new THREE.PlaneGeometry(6.3, 4.1),
      new THREE.MeshBasicMaterial({
        map: contactTexture,
        transparent: true,
        depthWrite: false,
      }),
    )
    contact.rotation.x = -Math.PI / 2
    contact.position.set(0.1, 0.08, 0)
    scene.add(contact)
    let visible = true,
      usable = true,
      disposed = false,
      frame = 0,
      cursorVisible = true
    let current = {
      text: "hello, human. :)",
      blink: false,
      active: false,
      reduced: false,
    }
    function render() {
      frame = 0
      if (!usable || disposed || !visible || document.hidden) return
      renderer.render(scene, camera)
      element!.dataset.ready = "true"
    }
    function invalidate() {
      if (!frame && !disposed && usable && visible && !document.hidden)
        frame = requestAnimationFrame(render)
    }
    function paintScreen() {
      context.clearRect(0, 0, 1024, 768)
      context.fillStyle = "#070b0b"
      context.fillRect(0, 0, 1024, 768)
      const glow = context.createRadialGradient(430, 380, 20, 512, 384, 650)
      glow.addColorStop(0, "#0b1510")
      glow.addColorStop(1, "#040708")
      context.fillStyle = glow
      context.fillRect(0, 0, 1024, 768)
      context.textBaseline = "top"
      context.font = '19px "Courier New", monospace'
      context.fillStyle = "#86ad8a"
      context.fillText("OPENBRACKET / HUMAN INTERFACE", 72, 65)
      context.strokeStyle = "#42644b"
      context.lineWidth = 1
      context.beginPath()
      context.moveTo(72, 104)
      context.lineTo(952, 104)
      context.stroke()
      context.font = '23px "Courier New", monospace'
      context.fillStyle = "#6c9273"
      context.fillText("OB/DOS v.01", 72, 144)
      context.fillText("connection: human <-> human", 72, 184)
      context.fillStyle = "#a7d6a5"
      context.font = '26px "Courier New", monospace'
      context.fillText("> run good-things.exe", 72, 255)
      context.font = '39px "Courier New", monospace'
      context.fillStyle = "#b2edaa"
      context.shadowColor = "#8bec9160"
      context.shadowBlur = 3
      const lines: string[] = []
      let line = ""
      for (const word of current.text.split(" ")) {
        const next = line ? `${line} ${word}` : word
        if (context.measureText(next).width > 820 && line) {
          lines.push(line)
          line = word
        } else line = next
      }
      lines.push(line)
      lines.forEach((value, i) => context.fillText(value, 90, 356 + i * 54))
      if (!current.blink || cursorVisible)
        context.fillRect(
          91 + context.measureText(lines[lines.length - 1]).width,
          355 + (lines.length - 1) * 54,
          17,
          39,
        )
      context.shadowBlur = 0
      context.font = '17px "Courier New", monospace'
      context.fillStyle = "#799b79"
      context.fillText("YOUR NEXT CHAPTER STARTS HERE.", 72, 548)
      context.strokeStyle = "#36523b"
      context.beginPath()
      context.moveTo(72, 635)
      context.lineTo(952, 635)
      context.stroke()
      context.font = '16px "Courier New", monospace'
      context.fillStyle = "#86ad8a"
      context.fillText("OPEN TO POSSIBILITIES", 72, 658)
      context.fillText("[ OB ]", 888, 658)
      // The soft upper-left reflection is painted into the curved glass UVs, not an HTML overlay.
      const reflection = context.createLinearGradient(100, 90, 540, 470)
      reflection.addColorStop(0, "rgba(185,196,214,.11)")
      reflection.addColorStop(0.7, "rgba(185,196,214,.035)")
      reflection.addColorStop(1, "rgba(185,196,214,0)")
      context.fillStyle = reflection
      context.beginPath()
      context.moveTo(96, 35)
      context.lineTo(560, 30)
      context.quadraticCurveTo(475, 90, 480, 160)
      context.lineTo(485, 436)
      context.lineTo(78, 419)
      context.closePath()
      context.fill()
      context.fillStyle = "rgba(0,0,0,.10)"
      for (let y = 0; y < 768; y += 4) context.fillRect(0, y, 1024, 1)
      const vignette = context.createRadialGradient(
        512,
        384,
        280,
        512,
        384,
        650,
      )
      vignette.addColorStop(0, "rgba(0,0,0,0)")
      vignette.addColorStop(1, "rgba(0,0,0,.43)")
      context.fillStyle = vignette
      context.fillRect(0, 0, 1024, 768)
      screenTexture.needsUpdate = true
      invalidate()
    }
    const logoImage = new window.Image()
    function applyTheme() {
      const light = document.documentElement.dataset.theme === "light"
      model.plastic.color.set(light ? "#343b37" : "#bdb7aa")
      model.bezel.color.set(light ? "#202322" : "#332b29")
      model.seam.color.set(light ? "#1d2420" : "#746e60")
      logoContext.clearRect(0, 0, 640, 128)
      if (logoImage.complete && logoImage.naturalWidth)
        logoContext.drawImage(logoImage, 0, 14, 100, 90)
      logoContext.fillStyle = light ? "#d2d6ca" : "#3f4039"
      logoContext.font = 'bold 58px "Courier New", monospace'
      logoContext.fillText("openbracket", 112, 86)
      logoTexture.needsUpdate = true
      invalidate()
    }
    logoImage.onload = applyTheme
    logoImage.src = "/brand/openbracket-icon.svg"
    const themeObserver = new MutationObserver(applyTheme)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    })
    applyTheme()
    let blinkTimer: ReturnType<typeof setInterval> | undefined
    function syncBlink() {
      clearInterval(blinkTimer)
      blinkTimer = undefined
      cursorVisible = true
      if (
        current.blink &&
        current.active &&
        !current.reduced &&
        visible &&
        !document.hidden &&
        usable
      )
        blinkTimer = setInterval(() => {
          cursorVisible = !cursorVisible
          paintScreen()
        }, 600)
    }
    update.current = (text, blink, active, reduced) => {
      current = { text, blink, active, reduced }
      syncBlink()
      paintScreen()
    }
    const visibilityObserver = new IntersectionObserver(
      entries => {
        visible = entries[0].isIntersecting
        syncBlink()
        if (visible) paintScreen()
      },
      { threshold: 0.05 },
    )
    visibilityObserver.observe(element)
    const visibilityChange = () => {
      syncBlink()
      if (!document.hidden) paintScreen()
    }
    document.addEventListener("visibilitychange", visibilityChange)
    const resize = () => {
      const { width, height } = element.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height)
      camera.aspect = width / height
      // Pull back for narrow canvases rather than cropping or stretching the object.
      const scale = Math.max(1, 1.05 / camera.aspect)
      camera.position
        .copy(target)
        .add(new THREE.Vector3(10.5, 1.85, 18.2).multiplyScalar(scale))
      camera.lookAt(target)
      camera.updateProjectionMatrix()
      invalidate()
    }
    const sizeObserver = new ResizeObserver(resize)
    sizeObserver.observe(element)
    resize()
    function pointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse" || current.reduced || !current.active)
        return
      const bounds = element!.getBoundingClientRect()
      model.group.rotation.y =
        ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.025
      invalidate()
    }
    function pointerLeave() {
      model.group.rotation.y = 0
      invalidate()
    }
    element.addEventListener("pointermove", pointerMove)
    element.addEventListener("pointerleave", pointerLeave)
    const contextLost = (event: Event) => {
      event.preventDefault()
      usable = false
      element.dataset.ready = "false"
      clearInterval(blinkTimer)
      cancelAnimationFrame(frame)
      frame = 0
    }
    renderer.domElement.addEventListener("webglcontextlost", contextLost)
    paintScreen()
    return () => {
      disposed = true
      update.current = null
      clearInterval(blinkTimer)
      cancelAnimationFrame(frame)
      logoImage.onload = null
      themeObserver.disconnect()
      visibilityObserver.disconnect()
      sizeObserver.disconnect()
      document.removeEventListener("visibilitychange", visibilityChange)
      element.removeEventListener("pointermove", pointerMove)
      element.removeEventListener("pointerleave", pointerLeave)
      renderer.domElement.removeEventListener("webglcontextlost", contextLost)
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>()
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry)
          for (const material of Array.isArray(object.material)
            ? object.material
            : [object.material])
            materials.add(material)
        }
      })
      geometries.forEach(geometry => geometry.dispose())
      materials.forEach(material => material.dispose())
      screenTexture.dispose()
      logoTexture.dispose()
      grain.dispose()
      contactTexture.dispose()
      environmentMap.dispose()
      key.shadow.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [])
  useEffect(() => {
    update.current?.(text, blink, active, reduced)
  }, [text, blink, active, reduced])
  return <div className="crt-webgl" ref={host} />
}
