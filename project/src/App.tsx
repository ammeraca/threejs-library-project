import {
	AdditiveBlending,
	AmbientLight,
	AnimationMixer,
	AxesHelper,
	BackSide,
	BoxGeometry,
	Color,
	DirectionalLight,
	FrontSide,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	PerspectiveCamera,
	Raycaster,
	ReinhardToneMapping,
	Scene,
	ShaderMaterial,
	Side,
	Vector2,
	WebGLRenderer,
} from 'three'
import { useEffect, useRef } from 'react'

import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { GUI } from 'dat.gui'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'

const App = () => {
	const mountRef = useRef(null)
	let camera: PerspectiveCamera, scene: Scene, renderer: WebGLRenderer, controls: OrbitControls
	var setControls = function () {
		controls = new OrbitControls(camera, renderer.domElement)
		controls.target.set(0, 0, 0)
		controls.enablePan = false
		controls.minPolarAngle = Math.PI / 2.4
		controls.maxPolarAngle = Math.PI / 2.15
		// controls.minDistance = 16
		// controls.maxDistance = 30
		controls.enableDamping = true
		controls.rotateSpeed = 0.6
		controls.enableZoom = false
	}

	useEffect(() => {
		scene = new Scene()
		scene.background = new Color(0xa9a9a9)
		camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
		camera.position.set(200, 200, 0)
		renderer = new WebGLRenderer()
		renderer.setSize(window.innerWidth, window.innerHeight)
		const raycaster = new Raycaster()

		const mouse = new Vector2()
		var mixer: AnimationMixer

		setControls()

		const dir = new DirectionalLight(0xffffff, 5)
		dir.position.set(-20, 40, 40)
		dir.shadow.mapSize.set(8192, 8192)
		dir.castShadow = true
		scene.add(dir)

		renderer.toneMapping = ReinhardToneMapping

		const darkMaterial = new MeshStandardMaterial({ color: 'black' })
		let materials: { [x: string]: any } = {}

		const renderScene = new RenderPass(scene, camera)

		scene.add(new AxesHelper())

		const params = {
			bloomStrength: 5,
			bloomThreshold: 0,
			bloomRadius: 0,
		}

		const bloomPass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85)
		bloomPass.threshold = params.bloomThreshold
		bloomPass.strength = params.bloomStrength
		bloomPass.radius = params.bloomRadius

		const bloomComposer = new EffectComposer(renderer)
		bloomComposer.addPass(renderScene)
		bloomComposer.addPass(bloomPass)

		window.addEventListener('pointerdown', onPointerDown)

		function onPointerDown(event: MouseEvent) {
			mouse.x = (event.clientX / window.innerWidth) * 2 - 1
			mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

			raycaster.setFromCamera(mouse, camera)
			const intersects = raycaster.intersectObjects(scene.children, false)
			if (intersects.length > 0) {
				const object = intersects[0].object as Mesh
				if (object.name === 'book') scene.add(bookGlow)
				else scene.remove(bookGlow)
			}
		}

		const dracoLoader = new DRACOLoader()
		dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/')

		const loader = new GLTFLoader()
		loader.setDRACOLoader(dracoLoader)
		const bookcase_path = 'assets/bookcase/scene.gltf'
		loader.load(
			bookcase_path,
			(gltf) => {
				mixer = new AnimationMixer(gltf.scene)
				gltf.animations.forEach((clip) => {
					mixer.clipAction(clip).play()
				})
				gltf.scene.scale.set(5000, 5000, 5000)
				scene.add(gltf.scene)
			},
			undefined,
			function (e) {
				console.error(e)
			}
		)

		var customMaterial = new ShaderMaterial({
			uniforms: {
				c: { value: 0.05 },
				p: { value: 4.5 },
				glowColor: { value: new Color(0xfaaaa0) },
				viewVector: { value: camera.position },
			},
			vertexShader: document.getElementById('vertexShader')!.textContent!,
			fragmentShader: document.getElementById('fragmentShader')!.textContent!,
			side: FrontSide,
			blending: AdditiveBlending,
			transparent: true,
		})

		const bookGeom = new BoxGeometry(200 / 15, 300 / 15, 50 / 15)

		const book = new Mesh(bookGeom.clone(), new MeshBasicMaterial({ color: new Color(0x448f44) }))

		book.rotateY(-Math.PI / 8)
		book.position.set(20, 45, 20)
		book.name = 'book'

		const bookGlow = new Mesh(bookGeom.clone(), customMaterial.clone())
		bookGlow.position.set(book.position.x, book.position.y, book.position.z)
		bookGlow.rotation.set(book.rotation.x, book.rotation.y, book.rotation.z)
		bookGlow.scale.multiplyScalar(1.2)
		scene.add(book)

		const currentRef = mountRef.current! as HTMLElement
		currentRef.appendChild(renderer.domElement)

		var animate = function () {
			requestAnimationFrame(animate)

			scene.traverse((obj) => darkenNonBloomed(obj as Mesh))
			bloomComposer.render()
			scene.traverse((obj) => restoreMaterial(obj as Mesh))
			renderer.render(scene, camera)
		}

		// FIXME: USE IT !
		// var destroy = () => {
		// 	gui.hide()
		// }

		function darkenNonBloomed(obj: Mesh) {
			if (obj.isMesh && obj.name !== 'book') {
				materials[obj.uuid] = obj.material
				obj.material = darkMaterial
			}
		}

		function restoreMaterial(obj: Mesh) {
			if (materials[obj.uuid]) {
				obj.material = materials[obj.uuid]
				delete materials[obj.uuid]
			}
		}

		window.addEventListener('wheel', function (event: WheelEvent) {
			if (event.deltaY > 0) {
				scene.rotateY(-Math.PI / 8)
			} else {
				scene.rotateY(Math.PI / 8)
			}
		})

		animate()

		// const gui = new GUI()
		// const folder = gui.addFolder('Bloom Parameters')

		// folder.add(params, 'bloomThreshold', 0.0, 1.0).onChange(function (value) {
		// 	bloomPass.threshold = Number(value)
		// })
		// folder.add(params, 'bloomStrength', 0.0, 10.0).onChange(function (value) {
		// 	bloomPass.strength = Number(value)
		// })
		// folder
		// 	.add(params, 'bloomRadius', 0.0, 1.0)
		// 	.step(0.01)
		// 	.onChange(function (value) {
		// 		bloomPass.radius = Number(value)
		// 	})

		return () => {
			const currentRef = mountRef.current! as HTMLElement
			currentRef.removeChild(renderer.domElement)
		}
	}, [])

	return <div ref={mountRef}></div>
}

export default App
