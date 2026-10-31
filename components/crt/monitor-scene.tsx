"use client"
import { useEffect, useRef } from "react"
import * as THREE from "three"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"
import { createCrtModel } from "../../lib/crt-model"
import {
  bootMessages,
  initialPower,
  powerTiming,
  screenEffect,
  type PowerState,
} from "../../lib/crt-power"
import type { TexasClock } from "../../lib/texas-clock"

export type MonitorSceneProps = {
  text: string
  blink: boolean
  active: boolean
  reduced: boolean
  power: PowerState
  clock: TexasClock | null
  pressed: boolean
  onReady?: () => void
  onFailure?: () => void
  highlighted: boolean
}
export default function MonitorScene(props: MonitorSceneProps) {
  const callbacks = useRef(props)
  useEffect(() => {
    callbacks.current = props
  }, [props])
  const host = useRef<HTMLDivElement>(null)
  const update = useRef<((value: MonitorSceneProps) => void) | null>(null)
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
      callbacks.current.onFailure?.()
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
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.shadowMap.autoUpdate = false
    renderer.shadowMap.needsUpdate = true
    element.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(16, 1, 0.1, 80)
    const target = new THREE.Vector3(0, 2.5, 0.0)
    camera.position.set(10.5, 4.35, 18.2)
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
    const surfaceContext = screenCanvas.getContext("2d")!
    const contentCanvas = document.createElement("canvas")
    contentCanvas.width = 1024
    contentCanvas.height = 768
    const context = contentCanvas.getContext("2d")!
    const emissionCanvas = document.createElement("canvas")
    emissionCanvas.width = 1024
    emissionCanvas.height = 768
    const emissionContext = emissionCanvas.getContext("2d")!
    const emissionTexture = new THREE.CanvasTexture(emissionCanvas)
    emissionTexture.colorSpace = THREE.SRGBColorSpace
    emissionTexture.wrapS = emissionTexture.wrapT = THREE.ClampToEdgeWrapping
    const screenTexture = new THREE.CanvasTexture(screenCanvas)
    screenTexture.colorSpace = THREE.SRGBColorSpace
    screenTexture.wrapS = screenTexture.wrapT = THREE.ClampToEdgeWrapping
    screenTexture.anisotropy = Math.min(
      4,
      renderer.capabilities.getMaxAnisotropy(),
    )
    const noise = new Uint8Array(64 * 64 * 4)
    let seed = 37
    for (let i = 0; i < noise.length; i += 4) {
      seed = (seed * 16807) % 2147483647
      noise[i] = noise[i + 1] = noise[i + 2] = 236 + (seed % 16)
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
    const powerCanvas = document.createElement("canvas")
    powerCanvas.width = powerCanvas.height = 128
    const powerContext = powerCanvas.getContext("2d")!
    const powerTexture = new THREE.CanvasTexture(powerCanvas)
    powerTexture.colorSpace = THREE.SRGBColorSpace
    const model = createCrtModel(screenTexture, grain, logoTexture, {
      emission: emissionTexture,
      powerGlyph: powerTexture,
    })
    scene.add(model.group)
    scene.add(new THREE.HemisphereLight("#e9efff", "#7a7060", 1.1))
    const key = new THREE.DirectionalLight("#fff6e8", 2.0)
    key.position.set(-3.5, 9, 5)
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
    // A fully feathered contact patch grounds the base without a cropped cast-shadow plane.
    const contactCanvas = document.createElement("canvas")
    contactCanvas.width = contactCanvas.height = 128
    const contactContext = contactCanvas.getContext("2d")!
    const radial = contactContext.createRadialGradient(64, 64, 5, 64, 64, 64)
    radial.addColorStop(0, "rgba(0,0,0,.22)")
    radial.addColorStop(1, "rgba(0,0,0,0)")
    contactContext.fillStyle = radial
    contactContext.fillRect(0, 0, 128, 128)
    const contactTexture = new THREE.CanvasTexture(contactCanvas)
    const contact = new THREE.Mesh(
      new THREE.PlaneGeometry(3.3, 2.7),
      new THREE.MeshBasicMaterial({
        map: contactTexture,
        transparent: true,
        depthWrite: false,
      }),
    )
    contact.rotation.x = -Math.PI / 2
    contact.position.set(0, 0.075, -0.2)
    scene.add(contact)
    let visible = true,
      usable = true,
      sized = false,
      logoReady = false,
      revealed = false,
      disposed = false,
      frame = 0,
      cursorVisible = true
    let current: MonitorSceneProps = {
      text: "hello, human. :)",
      blink: false,
      active: false,
      reduced: false,
      power: initialPower,
      clock: null,
      pressed: false,
      highlighted: false,
    }
    const restZ = model.button.position.z
    let buttonMotion = {
      from: restZ,
      to: restZ,
      startedAt: 0,
      duration: 0,
      returning: false,
    }
    function positionButton(now: number) {
      const t = buttonMotion.duration
        ? Math.min(1, (now - buttonMotion.startedAt) / buttonMotion.duration)
        : 1
      const ease = buttonMotion.returning
        ? 1 + 1.55 * (t - 1) ** 3 + 0.55 * (t - 1) ** 2
        : 1 - (1 - t) ** 3
      const z = buttonMotion.from + (buttonMotion.to - buttonMotion.from) * ease
      if (z !== model.button.position.z) {
        model.button.position.z = z
        renderer.shadowMap.needsUpdate = true
      }
      return t < 1
    }
    function render() {
      frame = 0
      if (
        !usable ||
        !sized ||
        !logoReady ||
        disposed ||
        !visible ||
        document.hidden
      )
        return
      const now = performance.now()
      const movingButton = positionButton(now)
      const transition =
        current.power.phase === "POWERING_OFF" ||
        current.power.phase === "POWERING_ON"
      if (transition) paintScreen(false)
      renderer.render(scene, camera)
      const point = model.button
        .localToWorld(new THREE.Vector3(0, 0, 0.02))
        .project(camera)
      const { width, height } = element!.getBoundingClientRect()
      element!.parentElement?.style.setProperty(
        "--power-x",
        `${((point.x + 1) * width) / 2}px`,
      )
      element!.parentElement?.style.setProperty(
        "--power-y",
        `${((1 - point.y) * height) / 2}px`,
      )
      element!.dataset.ready = "true"
      if (!revealed) {
        revealed = true
        callbacks.current.onReady?.()
      }
      const duration = current.reduced
        ? powerTiming.reducedFade
        : current.power.phase === "POWERING_OFF"
          ? powerTiming.off
          : powerTiming.on
      if (
        movingButton ||
        (transition && now - current.power.startedAt < duration)
      )
        invalidate()
    }
    function invalidate() {
      if (!frame && !disposed && usable && visible && !document.hidden)
        frame = requestAnimationFrame(render)
    }
    function drawContent() {
      context.clearRect(0, 0, 1024, 768)
      context.fillStyle = "#070b0b"
      context.fillRect(0, 0, 1024, 768)
      const glow = context.createRadialGradient(430, 380, 20, 512, 384, 650)
      glow.addColorStop(0, "#0b1510")
      glow.addColorStop(1, "#040708")
      context.fillStyle = glow
      context.fillRect(0, 0, 1024, 768)
      context.textBaseline = "top"
      if (
        current.power.phase === "BOOTING" ||
        current.power.phase === "POWERING_ON"
      ) {
        context.fillStyle = "#a7d6a5"
        context.font = '27px "Courier New", monospace'
        const messages = bootMessages.slice(
          0,
          current.power.phase === "POWERING_ON" ? 1 : current.power.bootStep,
        )
        messages.forEach((line, index) =>
          context.fillText(line, 72, 82 + index * 49),
        )
        drawClock()
        return
      }
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
      context.font = '52px "Courier New", monospace'
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
      lines.forEach((value, i) => context.fillText(value, 90, 346 + i * 70))
      if (!current.blink || cursorVisible)
        context.fillRect(
          91 + context.measureText(lines[lines.length - 1]).width,
          345 + (lines.length - 1) * 70,
          22,
          52,
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
      drawClock()
    }
    function drawClock() {
      context.shadowBlur = 0
      context.strokeStyle = "#8ead88"
      context.fillStyle = "#9bc795"
      context.lineWidth = 2
      const cx = 82,
        cy = 672
      if (current.clock?.isDay) {
        context.beginPath()
        context.arc(cx, cy, 7, 0, Math.PI * 2)
        context.stroke()
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4
          context.beginPath()
          context.moveTo(cx + Math.cos(angle) * 11, cy + Math.sin(angle) * 11)
          context.lineTo(cx + Math.cos(angle) * 15, cy + Math.sin(angle) * 15)
          context.stroke()
        }
      } else if (current.clock) {
        context.beginPath()
        context.arc(cx, cy, 11, 0.5, Math.PI * 1.8)
        context.quadraticCurveTo(cx - 4, cy + 2, cx + 10, cy + 5)
        context.fill()
      }
      context.font = '26px "Courier New", monospace'
      context.fillText(
        current.clock?.label || "DFW, TX · --:-- -- CT",
        110,
        658,
      )
      context.font = '16px "Courier New", monospace'
      context.fillText("[ OB ]", 888, 663)
    }
    function paintScreen(requestFrame = true) {
      // Hold the last actual screen pixels (including the cursor) throughout collapse.
      if (current.power.phase !== "POWERING_OFF") drawContent()
      const effect = screenEffect(
        current.power.phase,
        performance.now() - current.power.startedAt,
        current.reduced,
      )
      emissionContext.globalAlpha = 1
      emissionContext.fillStyle = "#000"
      emissionContext.fillRect(0, 0, 1024, 768)
      if (effect.image > 0) {
        emissionContext.globalAlpha = effect.image
        const height = 768 * effect.scaleY
        emissionContext.drawImage(
          contentCanvas,
          0,
          (768 - height) / 2,
          1024,
          height,
        )
        emissionContext.globalAlpha = 1
      }
      emissionContext.save()
      emissionContext.shadowColor = "#b9e6b8"
      emissionContext.shadowBlur = 18
      if (effect.line > 0) {
        emissionContext.globalAlpha = effect.line
        emissionContext.fillStyle =
          current.power.phase === "POWERING_OFF" ? "#e4f3e7" : "#91c891"
        const width = 880 * effect.lineWidth
        // Soft phosphor halo around a crisp white core, clipped by the glass mesh.
        emissionContext.fillRect((1024 - width) / 2, 382, width, 4)
        emissionContext.shadowBlur = 0
        emissionContext.fillStyle = "#f1fff0"
        emissionContext.fillRect((1024 - width) / 2, 383, width, 1.5)
      }
      if (effect.point > 0) {
        emissionContext.globalAlpha = effect.point
        const glow = emissionContext.createRadialGradient(
          512,
          384,
          0,
          512,
          384,
          14,
        )
        glow.addColorStop(0, "#edf9e9")
        glow.addColorStop(1, "rgba(170,220,170,0)")
        emissionContext.fillStyle = glow
        emissionContext.fillRect(498, 370, 28, 28)
      }
      emissionContext.restore()
      surfaceContext.fillStyle = "#07090a"
      surfaceContext.fillRect(0, 0, 1024, 768)
      surfaceContext.drawImage(emissionCanvas, 0, 0)
      const glassContext = surfaceContext
      // A feathered area-light reflection follows the glass UVs without a rectangular edge.
      glassContext.save()
      glassContext.translate(320, 180)
      glassContext.rotate(-0.16)
      glassContext.scale(1, 0.64)
      const reflection = glassContext.createRadialGradient(0, 0, 25, 0, 0, 330)
      reflection.addColorStop(0, "rgba(185,196,214,.10)")
      reflection.addColorStop(0.5, "rgba(185,196,214,.045)")
      reflection.addColorStop(1, "rgba(185,196,214,0)")
      glassContext.fillStyle = reflection
      glassContext.fillRect(-350, -350, 700, 700)
      glassContext.restore()
      glassContext.fillStyle = "rgba(0,0,0,.10)"
      for (let y = 0; y < 768; y += 4) glassContext.fillRect(0, y, 1024, 1)
      const vignette = glassContext.createRadialGradient(
        512,
        384,
        280,
        512,
        384,
        650,
      )
      vignette.addColorStop(0, "rgba(0,0,0,0)")
      vignette.addColorStop(1, "rgba(0,0,0,.24)")
      glassContext.fillStyle = vignette
      glassContext.fillRect(0, 0, 1024, 768)
      screenTexture.needsUpdate = true
      emissionTexture.needsUpdate = true
      model.glassMaterial.emissiveIntensity = effect.emission
      if (requestFrame) invalidate()
    }
    const logoImage = new window.Image()
    function applyTheme() {
      const light = document.documentElement.dataset.theme === "light"
      model.plastic.color.set(light ? "#343b37" : "#bdb7aa")
      model.powerMaterial.color.copy(model.plastic.color)
      powerContext.clearRect(0, 0, 128, 128)
      powerContext.strokeStyle = light ? "#cbd3c7" : "#41453b"
      powerContext.lineWidth = 7
      powerContext.lineCap = "round"
      powerContext.beginPath()
      powerContext.arc(64, 70, 32, -Math.PI / 2 + 0.6, Math.PI * 1.5 - 0.6)
      powerContext.stroke()
      powerContext.beginPath()
      powerContext.moveTo(64, 18)
      powerContext.lineTo(64, 62)
      powerContext.stroke()
      powerTexture.needsUpdate = true
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
    logoImage.onload = () => {
      logoReady = true
      applyTheme()
    }
    logoImage.onerror = () => {
      logoReady = true
      applyTheme()
    }
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
        visible &&
        !document.hidden &&
        usable
      )
        blinkTimer = setInterval(() => {
          cursorVisible = !cursorVisible
          paintScreen()
        }, 600)
    }
    update.current = next => {
      const now = performance.now()
      if (
        next.pressed !== current.pressed ||
        next.reduced !== current.reduced
      ) {
        positionButton(now)
        buttonMotion = {
          from: model.button.position.z,
          to: restZ - (next.pressed ? 0.024 : 0),
          startedAt: now,
          duration: next.reduced ? 0 : next.pressed ? 100 : 190,
          returning: !next.pressed,
        }
      }
      current = next
      model.powerMaterial.emissive.set(
        current.highlighted ? "#181a16" : "#000000",
      )
      model.powerMaterial.emissiveIntensity = current.highlighted ? 0.35 : 0
      model.powerMaterial.roughness = current.pressed ? 0.92 : 0.82
      const on = current.power.phase !== "OFF"
      model.indicatorMaterial.color.set(on ? "#49a224" : "#aa2924")
      model.indicatorMaterial.emissive.set(on ? "#33be16" : "#a01c17")
      if (current.reduced && model.group.rotation.y !== 0) {
        model.group.rotation.y = 0
        renderer.shadowMap.needsUpdate = true
      }
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
      sized = true
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
      renderer.shadowMap.needsUpdate = true
      invalidate()
    }
    function pointerLeave() {
      model.group.rotation.y = 0
      renderer.shadowMap.needsUpdate = true
      invalidate()
    }
    element.addEventListener("pointermove", pointerMove)
    element.addEventListener("pointerleave", pointerLeave)
    const contextLost = (event: Event) => {
      event.preventDefault()
      usable = false
      element.dataset.ready = "false"
      callbacks.current.onFailure?.()
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
      logoImage.onerror = null
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
      emissionTexture.dispose()
      powerTexture.dispose()
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
    update.current?.(props)
  }, [props])
  return <div className="crt-webgl" ref={host} aria-hidden="true" />
}
