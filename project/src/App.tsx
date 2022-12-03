import {
	AnimationMixer,
	AxesHelper,
	BoxGeometry,
	Color,
	DirectionalLight,
	Mesh,
	MeshBasicMaterial,
	PerspectiveCamera,
	Raycaster,
	ReinhardToneMapping,
	Scene,
	ShaderMaterial,
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
		controls.rotateSpeed = 0.25
	}

	useEffect(() => {
		scene = new Scene()
		scene.background = new Color(0xa9a9a9)
		camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
		renderer = new WebGLRenderer()
		renderer.toneMapping = ReinhardToneMapping
		var mixer: AnimationMixer
		const darkMaterial = new MeshBasicMaterial({ color: 'black' })
		let materials: { [x: string]: any } = {}

		renderer.setSize(window.innerWidth, window.innerHeight)

		setControls()

		const dir = new DirectionalLight(0xffffff, 5)
		dir.position.set(-20, 40, 40)
		dir.shadow.mapSize.set(8192, 8192)
		dir.castShadow = true
		scene.add(dir)

		const renderScene = new RenderPass(scene, camera)

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

		const raycaster = new Raycaster()

		const mouse = new Vector2()

		window.addEventListener('pointerdown', onPointerDown)

		function onPointerDown(event: MouseEvent) {
			mouse.x = (event.clientX / window.innerWidth) * 2 - 1
			mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

			raycaster.setFromCamera(mouse, camera)
			const intersects = raycaster.intersectObjects(scene.children, false)
			if (intersects.length > 0) {
				const object = intersects[0].object
			}
		}
		const dracoLoader = new DRACOLoader()
		dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/')

		scene.add(new AxesHelper())

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
		const book = new Mesh(
			new BoxGeometry(200 / 15, 300 / 15, 50 / 15),
			new MeshBasicMaterial({ color: new Color(0x448f44) })
		)
		book.rotateY(-Math.PI / 8)
		book.position.set(20, 45, 20)
		book.name = 'book'
		scene.add(book)
		camera.position.set(200, 200, 0)

		const currentRef = mountRef.current! as HTMLElement
		currentRef.appendChild(renderer.domElement)

		var animate = function () {
			requestAnimationFrame(animate)

			scene.traverse((obj) => darkenNonBloomed(obj as Mesh))
			bloomComposer.render()
			scene.traverse((obj) => restoreMaterial(obj as Mesh))
			renderer.render(scene, camera)
		}

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

		animate()

		const gui = new GUI()

		const folder = gui.addFolder('Bloom Parameters')

		folder.add(params, 'bloomThreshold', 0.0, 1.0).onChange(function (value) {
			bloomPass.threshold = Number(value)
		})

		folder.add(params, 'bloomStrength', 0.0, 10.0).onChange(function (value) {
			bloomPass.strength = Number(value)
		})

		folder
			.add(params, 'bloomRadius', 0.0, 1.0)
			.step(0.01)
			.onChange(function (value) {
				bloomPass.radius = Number(value)
			})

		return () => {
			const currentRef = mountRef.current! as HTMLElement
			currentRef.removeChild(renderer.domElement)
		}
	}, [])

	return <div ref={mountRef}></div>
}

export default App
