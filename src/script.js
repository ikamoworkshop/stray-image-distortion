import * as THREE from 'three'
import studio from '@theatre/studio'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js'
import { CustomPass } from './shader/distortion/CustomPass.js'

import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js'
import { DotScreenShader } from 'three/addons/shaders/DotScreenShader.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import raymarchingVertex from './shader/distortion/vertex.glsl'
import raymarchingFragment from './shader/distortion/fragment.glsl'

import { getProject, types } from '@theatre/core'

/**
 * Theatre.js
 */

studio.initialize()

const project = getProject('Image Distort')
const sheet = project.sheet('Animated scene')

const distortion = sheet.object('Image Distort', {
    progress: types.number(0, {range:[0, 1]}),
})

/**
 * Base
 */
// Debug
const gui = new GUI()
const debugObject = {}
debugObject.progress = 0
debugObject.scale = 2
gui.add(debugObject, 'progress').min(0).max(1).step(0.01).name('progress')
gui.add(debugObject,'scale').min(0.1).max(10).step(0.01).name('scale')

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const imageTextures = [
    textureLoader.load('./images/01.png'),
    textureLoader.load('./images/02.png'),
    textureLoader.load('./images/03.png'),
]

/**
 * Mesh
 */
// Geometry
const geometry = new THREE.PlaneGeometry(1, 1.4, 1, 1)

// Material
const material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms:{
        uTime: new THREE.Uniform(0),
        uProgress: new THREE.Uniform(debugObject.progress),
        uResolution: new THREE.Uniform(new THREE.Vector4()),
        uTexture: new THREE.Uniform(imageTextures[0])
    },
    vertexShader: raymarchingVertex,
    fragmentShader: raymarchingFragment
})

const meshes = []

// Mesh
imageTextures.forEach((texture, i) => {
    let m = material.clone()
    m.uniforms.uTexture.value = texture
    let mesh = new THREE.Mesh(geometry, m)
    mesh.position.x = (i * 2) - 2
    scene.add(mesh)
    meshes.push(mesh)
})

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

const imageAspect = 1;

let a1
let a2

if(sizes.height/sizes.width > imageAspect){
    a1 = (sizes.width/sizes.height) * imageAspect
    a2 = 1
} else {
    a1 = 1
    a2 = (sizes.height/sizes.width) * imageAspect
}

material.uniforms.uResolution.value.x = sizes.width
material.uniforms.uResolution.value.y = sizes.height
material.uniforms.uResolution.value.z = a1
material.uniforms.uResolution.value.w = a2

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    const imageAspect = 1;

    if(sizes.height/sizes.width > imageAspect){
        a1 = (sizes.width/sizes.height) * imageAspect
        a2 = 1
    } else {
        a1 = 1
        a2 = (sizes.height/sizes.width) * imageAspect
    }

    material.uniforms.uResolution.value.x = sizes.width
    material.uniforms.uResolution.value.y = sizes.height
    material.uniforms.uResolution.value.z = a1
    material.uniforms.uResolution.value.w = a2

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, .001, 1000)
camera.position.set(0, 0, 2)
scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Post Processing
 */
const composer = new EffectComposer( renderer );
composer.addPass( new RenderPass( scene, camera ) );

const effect1 = new ShaderPass( CustomPass );
composer.addPass( effect1 );

const effect2 = new ShaderPass( RGBShiftShader )
effect2.uniforms[ 'amount' ].value = 0.0015
composer.addPass( effect2 )

// const effect3 = new OutputPass();
// composer.addPass( effect3 );

distortion.onValuesChange(newValue => {
    effect1.uniforms[ 'progress' ].value = newValue.progress
})

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update Post Processing Uniforms
    effect1.uniforms[ 'time' ].value = elapsedTime
    effect1.uniforms[ 'scale' ].value = debugObject.scale

    meshes.forEach((mesh, i) => {
        // mesh.position.y = -debugObject.progress - .2
        mesh.rotation.z = debugObject.progress * Math.PI/2
    })

    // Update controls
    // controls.update()

    // Render
    // renderer.render(scene, camera)
    composer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()