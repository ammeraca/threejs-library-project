import {
	AdditiveBlending,
	AmbientLight,
	AnimationMixer,
	AxesHelper,
	BackSide,
	BoxGeometry,
	Color,
	DoubleSide,
	Group,
	Mesh,
	MeshBasicMaterial,
	Raycaster,
	ShaderMaterial,
	Shape,
	ShapeGeometry,
	Vector2,
	Vector3,
	WebGLRenderer,
} from 'three'

import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { Example } from './example'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader'
import { gsap } from 'gsap'

let mouse = new Vector2()
export default class GLTFExample extends Example {
	controls = new OrbitControls(this._cam, this._renderer.domElement)
	private _raycaster: Raycaster
	private bookSelected: Mesh | null = null
	private resume: Group | null = null
	private bookSelectedInitialPosition: Vector3 = new Vector3()
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
		document.addEventListener(
			'click',
			() => {
				if (this.bookSelected == null) {
					this._raycaster.setFromCamera(mouse, this._cam)
					const intersects = this._raycaster.intersectObjects(this._scene.children, false)
					if (intersects.length > 0) {
						const object = intersects[0].object as Mesh
						this.bookSelected = object
						this.bookSelectedInitialPosition = object.position.clone()
						const newX = (this._cam.position.x + object.position.x) / 2
						const newY = (this._cam.position.y + object.position.y) / 2
						const newZ = (this._cam.position.z + object.position.z) / 2
						gsap.to(object.position, {
							duration: 1,
							x: newX,
							y: newY,
							z: newZ,
						})
						this.addText(new Vector3(newX, newY, newZ + 3))
					}
				} else {
					this._raycaster.setFromCamera(mouse, this._cam)
					const intersects = this._raycaster.intersectObjects(this._scene.children, false)
					if (intersects.length > 0) {
						const object = intersects[0].object as Mesh

						if (object == this.bookSelected) {
							gsap.to(this.bookSelected.position, {
								duration: 1,
								x: this.bookSelectedInitialPosition.x,
								y: this.bookSelectedInitialPosition.y,
								z: this.bookSelectedInitialPosition.z,
							})
							this._scene.remove(this.resume!)
							this.bookSelected = null
						}
					}
				}
			},
			true
		)
	}

	public initialize() {
		super.initialize()

		this.setControls()

		const dir = new AmbientLight(0xffffff, 3)
		// dir.position.set(-20, 40, 40)
		// dir.shadow.mapSize.set(8192, 8192)
		// dir.castShadow = true
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
			if (object.name === 'book') {
				this._scene.add(this.books.bookGlow)
				this.books.bookGlow.position.set(
					this.books.book.position.x,
					this.books.book.position.y,
					this.books.book.position.z
				)
			} else this._scene.remove(this.books.bookGlow)
		} else {
			this._scene.remove(this.books.bookGlow)
		}
	}

	public render(): void {
		super.render()
	}

	private addText(textPosition: Vector3) {
		const loader: FontLoader = new FontLoader()
		loader.load('assets/fonts/helvetiker.json', (font) => {
			const color = new Color(0xbc4444)

			const matDark = new MeshBasicMaterial({
				color: color,
				side: DoubleSide,
			})

			const message = 'Titre'

			const shapes = font.generateShapes(message, 100)
			const geometry = new ShapeGeometry(shapes)
			geometry.computeBoundingBox()
			const xMid = -0.5 * (geometry.boundingBox!.max.x - geometry.boundingBox!.min.x)
			geometry.translate(xMid, 0, 0)
			const holeShapes: Shape[] = []

			for (let i = 0; i < shapes.length; i++) {
				const shape = shapes[i]

				if (shape.holes && shape.holes.length > 0) {
					for (let j = 0; j < shape.holes.length; j++) {
						const hole = shape.holes[j]
						holeShapes.push(hole as Shape)
					}
				}
			}

			shapes.push.apply(shapes, holeShapes)
			const style = SVGLoader.getStrokeStyle(5, color.getStyle())
			const strokeText = new Group()

			for (let i = 0; i < shapes.length; i++) {
				const shape = shapes[i]
				const points = shape.getPoints()
				const geometry = SVGLoader.pointsToStroke(
					points.map((point) => {
						return new Vector3(point.x, point.y, 0)
					}),
					style
				)
				geometry.translate(xMid, 0, 0)
				const strokeMesh = new Mesh(geometry, matDark)
				strokeText.add(strokeMesh)
			}

			strokeText.scale.multiplyScalar(0.05)
			strokeText.position.set(textPosition.x, textPosition.y, textPosition.z)
			strokeText.rotation.set(
				this.bookSelected!.rotation.x,
				this.bookSelected!.rotation.y,
				this.bookSelected!.rotation.z
			)
			this.resume = strokeText
			this._scene.add(strokeText)
		})
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
