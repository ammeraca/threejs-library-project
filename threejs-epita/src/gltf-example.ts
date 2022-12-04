import {
	AdditiveBlending,
	AnimationMixer,
	AxesHelper,
	BackSide,
	BoxGeometry,
	Color,
	DirectionalLight,
	FrontSide,
	Mesh,
	MeshBasicMaterial,
	Raycaster,
	ShaderMaterial,
	Vector2,
	Vector3,
	WebGLRenderer,
} from 'three'

import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { Example } from './example'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

let mouse = new Vector2()
export default class GLTFExample extends Example {
	controls = new OrbitControls(this._cam, this._renderer.domElement)
	private _raycaster: Raycaster
	// mixer = new AnimationMixer();

	bookGeom = new BoxGeometry(200 / 15, 300 / 15, 50 / 15)
	customMaterial = new ShaderMaterial({
		uniforms: {
			c: { value: 1.5 },
			p: { value: 5 },
			glowColor: { value: new Color(0x5aaaaa) },
			viewVector: { value: this._cam.position },
		},
		vertexShader: document.getElementById('vertexShader')!.textContent!,
		fragmentShader: document.getElementById('fragmentShader')!.textContent!,
		side: BackSide,
		blending: AdditiveBlending,
		transparent: true,
	})

	public books = {
		book: new Mesh(this.bookGeom.clone(), new MeshBasicMaterial({ color: new Color(0x448f44) })),
		bookGlow: new Mesh(this.bookGeom.clone(), this.customMaterial.clone()),
	}

	constructor(renderer: WebGLRenderer) {
		super(renderer)

		this._raycaster = new Raycaster()
		document.addEventListener('mousemove', this.onMouseMove, false)
	}

	public initialize() {
		super.initialize()

		this.setControls()

		const dir = new DirectionalLight(0xffffff, 5)
		dir.position.set(-20, 40, 40)
		dir.shadow.mapSize.set(8192, 8192)
		dir.castShadow = true
		this._scene.add(dir)

		this._scene.add(new AxesHelper(100))

		this.gltfLoader()

		this.books.book.position.set(20, 47, 20)
		this.books.book.name = 'book'
		this._scene.add(this.books.book)

		this.books.bookGlow.position.set(this.books.book.position.x, this.books.book.position.y, this.books.book.position.z)
		this.books.bookGlow.rotation.set(this.books.book.rotation.x, this.books.book.rotation.y, this.books.book.rotation.z)
		this.books.bookGlow.name = 'book'
		this.books.bookGlow.scale.multiplyScalar(1.02)

		this.rotateOnScroll()
	}

	public onMouseMove(ev: MouseEvent) {
		mouse.x = (ev.clientX / window.innerWidth) * 2 - 1
		mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1
	}

	public resize(w: number, h: number): void {
		super.resize(w, h)
	}

	public destroy(): void {
		super.destroy()
	}

	public update(delta: number): void {
		this.controls.update()
		this._raycaster.setFromCamera(mouse, this._cam)
		const intersects = this._raycaster.intersectObjects(this._scene.children, false)
		if (intersects.length > 0) {
			const object = intersects[0].object as Mesh
			if (object.name === 'book') this._scene.add(this.books.bookGlow)
			else this._scene.remove(this.books.bookGlow)
		} else {
			this._scene.remove(this.books.bookGlow)
		}
	}

	public render(): void {
		super.render()
	}

	private gltfLoader() {
		const dracoLoader = new DRACOLoader()
		dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/')

		const loader = new GLTFLoader()
		loader.setDRACOLoader(dracoLoader)
		const bookcase_path = 'assets/models/bookcase/scene.gltf'
		loader.load(
			bookcase_path,
			(gltf) => {
				const mixer = new AnimationMixer(gltf.scene)
				gltf.animations.forEach((clip) => {
					mixer.clipAction(clip).play()
				})
				gltf.scene.scale.set(5000, 5000, 5000)
				this._scene.add(gltf.scene)
			},
			undefined,
			function (e) {
				console.error(e)
			}
		)
	}

	private rotateOnScroll() {
		window.addEventListener('wheel', (event: WheelEvent) => {
			if (event.deltaY > 0) {
				this._scene.rotateY(-0.02)
			} else {
				this._scene.rotateY(0.02)
			}
		})
	}

	private setControls() {
		this.controls.target.set(0, 60, 0)
		this.controls.enablePan = false
		this.controls.minPolarAngle = Math.PI / 2.4
		this.controls.maxPolarAngle = Math.PI / 2.15
		this.controls.minDistance = 150
		this.controls.enableDamping = true
		this.controls.rotateSpeed = 0.6
		this.controls.enableZoom = false
	}
}
