import {
	AdditiveBlending,
	AmbientLight,
	AxesHelper,
	BackSide,
	BoxGeometry,
	Color,
	LoadingManager,
	Mesh,
	MeshBasicMaterial,
	Object3D,
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
import { gsap } from 'gsap'

let mouse = new Vector2()

export type BookInfo = { title: string; resume: string }
export type Book = {
	name: string
	mesh: Mesh
	glowMesh: Mesh
	initCoordinates: Vector3
	initRotation: number
	bookInfo: BookInfo
}

export default class GLTFExample extends Example {
	controls = new OrbitControls(this._cam, this._renderer.domElement)
	private _raycaster: Raycaster
	private bookSelected: Book | null = null

	bookGeom = new BoxGeometry(200 / 15, 300 / 15, 50 / 15)
	customGlowShader = new ShaderMaterial({
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
	glowMesh = new Mesh(this.bookGeom.clone(), this.customGlowShader.clone())

	public bookInfos = {
		petitPrince: { title: 'Le petit prince', resume: 'Ceci est le résumé du petit prince, le livre est chouette' },
		mobyDick: { title: 'Moby Dick', resume: "Sur un bateau dans l'eau, une baleine fait des siennes" },
	}

	public books: Book[] = [
		{
			name: 'book-PetitPrince',
			mesh: new Mesh(this.bookGeom.clone(), new MeshBasicMaterial({ color: new Color(0x601308) })),
			glowMesh: this.glowMesh.clone(),
			bookInfo: this.bookInfos.petitPrince,
			initCoordinates: new Vector3(25, 47, 14),
			initRotation: Math.PI / 5,
		},
		{
			name: 'book-MobyDick',
			mesh: new Mesh(this.bookGeom.clone(), new MeshBasicMaterial({ color: new Color(0x1586a5) })),
			glowMesh: this.glowMesh.clone(),
			bookInfo: this.bookInfos.mobyDick,
			initCoordinates: new Vector3(-25, 47, 14),
			initRotation: Math.PI / 5,
		},
	]

	constructor(renderer: WebGLRenderer) {
		super(renderer)
		this._raycaster = new Raycaster()

		document.addEventListener('mousemove', this.onMouseMove, false)
		document.addEventListener(
			'click',
			() => {
				if (this.bookSelected == null) {
					this.clickEvent()
				} else {
					this.resetEvent()
				}
			},
			true
		)

		this.initializeBooks()
	}

	public clickEvent() {
		this._raycaster.setFromCamera(mouse, this._cam)
		const intersects = this._raycaster.intersectObjects(this._scene.children, false)
		if (intersects.length > 0) {
			const object = intersects[0].object as Mesh
			if (object.name.includes('book')) {
				this.bookSelected = this.getHoverBook(object.name)
				const newX = (this._cam.position.x + object.position.x) / 2
				const newY = (this._cam.position.y + object.position.y) / 2
				const newZ = (this._cam.position.z + object.position.z) / 2
				gsap.to(object.position, {
					duration: 1,
					x: newX,
					y: newY,
					z: newZ,
				})
				this.addText(this.bookSelected!.bookInfo)
			}
		}
	}

	public resetEvent() {
		this._raycaster.setFromCamera(mouse, this._cam)
		const intersects = this._raycaster.intersectObjects(this._scene.children, false)
		if (intersects.length > 0) {
			const object = intersects[0].object as Mesh
			const hoverBook = this.getHoverBook(object.name)
			if (hoverBook == this.bookSelected) {
				gsap.to(this.bookSelected!.mesh.position, {
					duration: 1,
					x: this.bookSelected?.initCoordinates.x,
					y: this.bookSelected?.initCoordinates.y,
					z: this.bookSelected?.initCoordinates.z,
				})
				this.removeText()
				this.bookSelected = null
			} else {
				gsap.to(this.bookSelected!.mesh.position, {
					duration: 1,
					x: this.bookSelected?.initCoordinates.x,
					y: this.bookSelected?.initCoordinates.y,
					z: this.bookSelected?.initCoordinates.z,
				})
				this.removeText()
				this.clickEvent()
			}
		}
	}

	public instatiateBook(book: Book) {
		book.mesh.position.set(book.initCoordinates.x, book.initCoordinates.y, book.initCoordinates.z)
		book.mesh.name = book.name
		book.mesh.rotateY(book.initRotation)
		book.glowMesh.position.set(book.initCoordinates.x, book.initCoordinates.y, book.initCoordinates.z)
		book.glowMesh.rotation.set(book.mesh.rotation.x, book.mesh.rotation.y, book.mesh.rotation.z)
		book.glowMesh.scale.multiplyScalar(1.02)
		this._scene.add(book.mesh)
	}

	public getHoverBook(name: string): Book | null {
		let res = null
		this.books.forEach((book) => {
			if (book.name == name) res = book
		})
		return res
	}

	public initialize() {
		super.initialize()

		this.setControls()

		const dir = new AmbientLight(0xffffff, 3)
		this._scene.add(dir)

		this._scene.add(new AxesHelper(100))

		this.books.forEach((book) => this.instatiateBook(book))

		this.rotateOnScroll()
	}

	public initializeBooks() {
		const loadingManager = new LoadingManager(() => {
			const loadingScreen = document.getElementById('loading-screen')
			loadingScreen!.classList.add('fade-out')

			loadingScreen?.addEventListener('transitionend', () => {
				const loadingScreen = document.getElementById('loading-screen')
				loadingScreen?.remove()
			})
		})

		const dracoLoader = new DRACOLoader()
		dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/')
		const loader = new GLTFLoader(loadingManager)
		loader.setDRACOLoader(dracoLoader)

		var library = new Object3D()
		loader.load('assets/models/library/scene.gltf', (gltf) => {
			library = gltf.scene
			library.name = 'library'
			library.scale.set(50, 50, 50)
			library.position.y += 75
			library.position.z += 125
			this._scene.add(library)
		})

		var book_case = new Object3D()
		loader.load('assets/models/bookcase/scene.gltf', (gltf) => {
			book_case = gltf.scene
			book_case.name = 'bookcase'
			gltf.scene.scale.set(5000, 5000, 5000)
			this._scene.add(gltf.scene)
		})

		var animated_book
		loader.load('assets/models/books/animated_book/scene.gltf', (gltf) => {
			animated_book = gltf.scene
			animated_book.name = 'book2'
			animated_book.scale.set(0.01, 0.01, 0.01)
			animated_book.position.x = 27
			animated_book.position.y = 45
			animated_book.position.z = -22
			animated_book.rotateZ(Math.PI / 2)
			animated_book.rotateX((3 * Math.PI) / 4)
			this._scene.add(animated_book)
		})
	}

	public removeAllGlow() {
		this.books.forEach((book) => {
			this._scene.remove(book.glowMesh)
		})
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
			if (object.name.includes('book')) {
				const hoverBook = this.getHoverBook(object.name)
				this._scene.add(hoverBook!.glowMesh)
				hoverBook!.glowMesh.position.set(
					hoverBook!.mesh.position.x,
					hoverBook!.mesh.position.y,
					hoverBook!.mesh.position.z
				)
			} else {
				this.removeAllGlow()
			}
		} else {
			this.removeAllGlow()
		}
	}

	public render(): void {
		super.render()
	}

	private addText(bookInfo: BookInfo) {
		const tempV = new Vector3()
		tempV.project(this._cam)

		// convert the normalized position to CSS coordinates
		const resumeX = (tempV.x - 0.75 * 0.5 + 0.5) * window.innerWidth
		const resumeY = (tempV.y - 0.6 * -0.5 + 0.5) * window.innerHeight

		// move the elem to that position
		const labelContainerElem = document.querySelector('#labels')
		const resume = document.createElement('div')
		resume.textContent = bookInfo.resume
		labelContainerElem?.appendChild(resume)
		resume.style.transform = `translate(-50%, -50%) translate(${resumeX}px,${resumeY}px)`

		const title = document.createElement('div')
		title.textContent = bookInfo.title
		labelContainerElem?.appendChild(title)
		const titleX = (tempV.x * 0.5 + 0.5) * window.innerWidth
		const titleY = (tempV.y * -0.5 + 0.5) * window.innerHeight
		title.style.transform = `translate(-50%, -50%) translate(${titleX}px,${titleY}px)`
	}

	private removeText() {
		const labelContainerElem = document.querySelector('#labels')
		labelContainerElem!.innerHTML = ''
	}

	private rotateOnScroll() {
		window.addEventListener('wheel', (event: WheelEvent) => {
			if (event.deltaY > 0) {
				this._cam.position.applyAxisAngle(new Vector3(0, 1, 0), 0.02)
			} else {
				this._cam.position.applyAxisAngle(new Vector3(0, 1, 0), -0.02)
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
