import './style.css'
import * as THREE from 'three'
import * as lil from 'lil-gui'
import { gsap as g } from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/**
 * Debug
 */
const gui = new lil.GUI({ closed: false, width: 300 })
const parameters = {
  color: 0xff0000,
  spin: () => {
    g.to(boxMesh.rotation, { y: boxMesh.rotation.y + Math.PI * 1.25, duration: 1, delay: 0.5 })
  },
  count: 100000,
  size: 0.01,
  galaxyRadius: 10,
  galaxyBranchCount: 3,
  galaxyBranchSpin: 0.5,
  galaxyBranchRandomness: 1,
  galaxyBranchRandomnessPower: 3,
  galaxyInsideColor: 0xdb3f0f,
  galaxyOutsideColor: 0x8aa8f4,
}

/**
 * Cursor
 */
const cursor = {
  x: 0,
  y: 0,
}
window.onmousemove = (event) => {
  cursor.x = event.clientX / sizes.w - 0.5
  cursor.y = -(event.clientY / sizes.h - 0.5)
}
const sizes = {
  w: window.innerWidth,
  h: window.innerHeight,
}
window.onresize = () => {
  sizes.w = window.innerWidth
  sizes.h = window.innerHeight

  camera.aspect = sizes.w / sizes.h
  camera.updateProjectionMatrix()

  renderer.setSize(sizes.w, sizes.h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}
window.onkeydown = (event) => {
  if (event.key === 'h') {
    gui._hidden ? gui.show() : gui.hide()
  }
  if (event.key === 'c') {
    gui._closed ? gui.open() : gui.close()
  }
}

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(75, sizes.w / sizes.h, 0.1, 100)
camera.position.z = 7
camera.position.y = 10
camera.position.x = 1.5
scene.add(camera)

/* Controls */
const controls = new OrbitControls(camera, webgl)
controls.enableDamping = true

/* Renderer */
const renderer = new THREE.WebGLRenderer({
  canvas: webgl,
})
renderer.setSize(sizes.w, sizes.h)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/*
 * Objects
 * */
const material = new THREE.MeshStandardMaterial()
material.metalness = 0
material.roughness = 0.7

/*
 * Lights
 * */
/* cheap */
const ambientLight = new THREE.AmbientLight(0xb9d5ff, 0.12)
scene.add(ambientLight)

// Axes helper
const axesHelper = new THREE.AxesHelper(11)
scene.add(axesHelper)
const gridHelper = new THREE.GridHelper(10, 10)
scene.add(gridHelper)

const clock = new THREE.Clock()

/*
 * Galaxy
 * */
let particlesGeometry = null
let particlesMaterial = null
let particles = null

const generateGalaxy = () => {
  /* destroy old galaxy */
  if (particles) {
    particlesGeometry.dispose()
    particlesMaterial.dispose()
    scene.remove(particles)
  }
  particlesGeometry = new THREE.BufferGeometry()

  const particlesPositions = new Float32Array(parameters.count * 3)
  const particlesColors = new Float32Array(parameters.count * 3)
  const colorInside = new THREE.Color(parameters.galaxyInsideColor)
  const colorOutside = new THREE.Color(parameters.galaxyOutsideColor)

  for (let i = 0; i < parameters.count; i++) {
    const i3 = i * 3
    const randomRadius = Math.random() * parameters.galaxyRadius
    const branchAngle = ((i % parameters.galaxyBranchCount) / parameters.galaxyBranchCount) * Math.PI * 2
    const branchSpinAngle = randomRadius * parameters.galaxyBranchSpin
    parameters.galaxyBranchRandomnessPower

    /* adding 3d spread on the galaxy branch position */
    const randomX =
      Math.pow(Math.random(), parameters.galaxyBranchRandomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.galaxyBranchRandomness
    const randomY =
      Math.pow(Math.random(), parameters.galaxyBranchRandomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.galaxyBranchRandomness
    const randomZ =
      Math.pow(Math.random(), parameters.galaxyBranchRandomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.galaxyBranchRandomness

    particlesPositions[i3] = Math.cos(branchAngle + branchSpinAngle) * randomRadius + randomX //x position
    particlesPositions[i3 + 1] = randomY //y position
    particlesPositions[i3 + 2] = Math.sin(branchAngle + branchSpinAngle) * randomRadius + randomZ //z position

    // Color
    const mixedColor = colorInside.clone()
    mixedColor.lerp(colorOutside, randomRadius / parameters.galaxyRadius)

    particlesColors[i3] = mixedColor.r
    particlesColors[i3 + 1] = mixedColor.g
    particlesColors[i3 + 2] = mixedColor.b
  }
  particlesMaterial = new THREE.PointsMaterial({
    size: parameters.size,
    sizeAttenuation: true,
    depthWrite: true,
    blending: THREE.AdditiveBlending,
    // color: 0xff5588,
    vertexColors: true,
  })

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3))
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particlesColors, 3))

  particles = new THREE.Points(particlesGeometry, particlesMaterial)
  scene.add(particles)
}
generateGalaxy()

/* debug */
if (particles) {
  const galaxyFolder = gui.addFolder('galaxy')
  galaxyFolder
    .add(parameters, 'count')
    .min(100)
    .max(1000000)
    .step(100)
    .onFinishChange(generateGalaxy)
    .name('systemCount')
  galaxyFolder
    .add(parameters, 'size')
    .min(0.001)
    .max(0.1)
    .step(0.001)
    .onFinishChange(generateGalaxy)
    .name('systemSize')
  galaxyFolder.add(parameters, 'galaxyRadius').min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy)
  galaxyFolder.add(parameters, 'galaxyBranchCount').min(2).max(20).step(1).onFinishChange(generateGalaxy)
  galaxyFolder.add(parameters, 'galaxyBranchSpin').min(-5).max(5).step(0.001).onFinishChange(generateGalaxy)
  galaxyFolder
    .add(parameters, 'galaxyBranchRandomness')
    .min(0)
    .max(2)
    .step(0.001)
    .onFinishChange(generateGalaxy)
  galaxyFolder
    .add(parameters, 'galaxyBranchRandomnessPower')
    .min(1)
    .max(10)
    .step(1)
    .onFinishChange(generateGalaxy)
  galaxyFolder.addColor(parameters, 'galaxyInsideColor').onFinishChange(generateGalaxy)
  galaxyFolder.addColor(parameters, 'galaxyOutsideColor').onFinishChange(generateGalaxy)
}

function animate() {
  // Time
  const elapsedTime = clock.getElapsedTime()

  // Update objects
  particles.rotation.y = elapsedTime * 0.1

  // Update controls
  controls.update()

  // Render
  renderer.render(scene, camera)

  requestAnimationFrame(animate)
}
animate()
