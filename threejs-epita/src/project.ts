import {
	AdditiveBlending,
	AmbientLight,
	AxesHelper,
	BackSide,
	BoxGeometry,
	Color,
	ColorRepresentation,
	DirectionalLight,
	LoadingManager,
	Mesh,
	MeshBasicMaterial,
	MeshPhysicalMaterial,
	MeshToonMaterial,
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

export type BookInfo = { title: string; resume: string; object: Object3D }
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
		petitPrince: {
			title: 'Le petit prince',
			resume:
				"Le Petit Prince est une œuvre de langue française, la plus connue d'Antoine de Saint-Exupéry.\n\n" +
				"Le premier soir je me suis donc endormi sur le sable à mille milles de toute terre habitée. J'étais bien plus isolé qu'un naufragé sur un radeau au milieu de l'océan. Alors vous imaginez ma surprise, au lever du jour, quand une drôle de petite voix m'a réveillé. Elle disait:" +
				" -S'il vous plaît... dessine-moi un mouton !",
			object: new Object3D(),
		},
		mobyDick: {
			title: 'Moby Dick',
			resume:
				"Moby-Dick est un roman de l'écrivain américain Herman Melville paru en 1851" +
				"'L'histoire de Moby Dick est racontée par Ismaël, un marin sur le baleinier Pequod." +
				"Accompagné par son nouvel ami Queequeg, un harponneur couvert de tatouages, et le reste de l'équipe hétéroclite du navire, ils prennent la mer au départ de Nantucket," +
				' une île proche du Massachusetts aux États Unis.',
			object: new Object3D(),
		},
		harryPotter: {
			title: 'Harry Potter',
			resume: 'Harry Potter est un sorcier',
			object: new Object3D(),
		},

		wonka: {
			title: 'Dracula',
			resume: 'Seul dans son chateau en Transylvanie, le comte déchû attend',
			object: new Object3D(),
		},
	}

	public books: Book[] = [
		{
			name: 'book-PetitPrince',
			mesh: new Mesh(
				this.bookGeom.clone(),
				new MeshPhysicalMaterial({ roughness: 0.7, color: 0xf4f5f4, bumpScale: 0.002, metalness: 0.2 })
			),
			glowMesh: this.glowMesh.clone(),
			bookInfo: this.bookInfos.petitPrince,
			initCoordinates: new Vector3(25, 74, 14),
			initRotation: -Math.PI / 5,
		},
		{
			name: 'book-MobyDick',
			mesh: new Mesh(
				this.bookGeom.clone(),
				new MeshPhysicalMaterial({ roughness: 0.7, color: 0x1568a5, bumpScale: 0.002, metalness: 0.2 })
			),
			glowMesh: this.glowMesh.clone(),
			bookInfo: this.bookInfos.mobyDick,
			initCoordinates: new Vector3(-25, 45, 14),
			initRotation: Math.PI / 5,
		},
		{
			name: 'book-HarryPotter',
			mesh: new Mesh(
				this.bookGeom.clone(),
				new MeshPhysicalMaterial({ roughness: 0.7, color: 0xffbf00, bumpScale: 0.002, metalness: 0.2 })
			),
			glowMesh: this.glowMesh.clone(),
			bookInfo: this.bookInfos.harryPotter,
			initCoordinates: new Vector3(15, 74, -19),
			initRotation: (2 * Math.PI) / 5,
		},
		{
			name: 'book-Wonka',
			mesh: new Mesh(
				this.bookGeom.clone(),
				new MeshPhysicalMaterial({ roughness: 0.7, color: 0x991111, bumpScale: 0.002, metalness: 0.2 })
			),
			glowMesh: this.glowMesh.clone(),
			bookInfo: this.bookInfos.wonka,
			initCoordinates: new Vector3(-25, 101.5, -14),
			initRotation: -Math.PI / 5,
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
				this.rotateSelectedBook(this._scene.rotation.y - this.bookSelected!.initRotation)
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
				this.addStory(this.bookSelected!.bookInfo, new Vector3(newX, newY, newZ))
			}
		}
	}

	public resetEvent() {
		this._raycaster.setFromCamera(mouse, this._cam)
		const intersects = this._raycaster.intersectObjects(this._scene.children, false)
		if (intersects.length > 0) {
			const object = intersects[0].object as Mesh
			const hoverBook = this.getHoverBook(object.name)
			this.rotateSelectedBook(this.bookSelected!.initRotation - this._scene.rotation.y)
			if (hoverBook == this.bookSelected) {
				gsap.to(this.bookSelected!.mesh.position, {
					duration: 1,
					x: this.bookSelected?.initCoordinates.x,
					y: this.bookSelected?.initCoordinates.y,
					z: this.bookSelected?.initCoordinates.z,
					// rotateY: this.bookSelected?.initRotation,
				})
				this.removeText()
				this.removeStory()
				this.bookSelected = null
			} else {
				gsap.to(this.bookSelected!.mesh.position, {
					duration: 1,
					x: this.bookSelected?.initCoordinates.x,
					y: this.bookSelected?.initCoordinates.y,
					z: this.bookSelected?.initCoordinates.z,
					// rotateY: this.bookSelected?.initRotation,
				})
				this.removeText()
				this.removeStory()
				this.clickEvent()
			}
		}
	}

	public instatiateBook(book: Book) {
		book.mesh.position.set(book.initCoordinates.x, book.initCoordinates.y, book.initCoordinates.z)
		book.mesh.name = book.name
		book.mesh.receiveShadow = true
		book.mesh.castShadow = true
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

		const dir1 = new DirectionalLight(0xffffff, 1)
		dir1.position.set(100, 100, 100)
		const dir2 = new DirectionalLight(0xffffff, 1)
		dir2.position.set(-100, 100, 100)
		const dir3 = new DirectionalLight(0xffffff, 1)
		dir3.position.set(100, 100, -100)
		const dir4 = new DirectionalLight(0xffffff, 1)
		dir4.position.set(-100, 100, -100)
		this._scene.add(dir1, dir2, dir3, dir4)

		// this._scene.add(new AxesHelper(100))

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
			book_case.castShadow = true
			book_case.receiveShadow = true
			book_case.name = 'bookcase'
			gltf.scene.scale.set(5000, 5000, 5000)
			this._scene.add(gltf.scene)
		})

		this.createNeutralBooks()

		loader.load('assets/models/le_petit_prince/scene.gltf', (gltf) => {
			this.bookInfos.petitPrince.object = gltf.scene
			this.bookInfos.petitPrince.object.scale.set(5, 5, 5)
		})

		loader.load('assets/models/moby_dick/scene.gltf', (gltf) => {
			this.bookInfos.mobyDick.object = gltf.scene
			this.bookInfos.mobyDick.object.scale.set(2, 2, 2)
		})

		loader.load('assets/models/harry_potter/golden_snitch/scene.gltf', (gltf) => {
			this.bookInfos.harryPotter.object = gltf.scene
			this.bookInfos.harryPotter.object.scale.set(6, 6, 6)
		})

		loader.load('assets/models/wonka/scene.gltf', (gltf) => {
			this.bookInfos.wonka.object = gltf.scene
			this.bookInfos.wonka.object.scale.set(100, 100, 100)
		})
	}

	private createNeutralBooks() {
		const createBook = (color: ColorRepresentation, x: number, y: number, z: number, rotation: number) => {
			const book = new Mesh(
				this.bookGeom.clone(),
				new MeshPhysicalMaterial({ roughness: 0.7, color: color, bumpScale: 0.002, metalness: 0.2 })
			)
			book.position.set(x, y, z)
			book.rotateY(rotation)
			this._scene.add(book)
		}
		createBook(0x372400, 25, 45, -14, Math.PI / 5)
		createBook(0x112324, 28, 45, -11, Math.PI / 5)
		createBook(0x223435, 31, 45, -8, Math.PI / 5)
		createBook(0x243211, 15, 20, -27, (2 * Math.PI) / 5)
		createBook(0x070707, 18, 20, -24, (2 * Math.PI) / 5)
		createBook(0x125327, -25, 20, 21, Math.PI / 5)
		createBook(0xafebcd, -29, 20, 19, Math.PI / 5)
		createBook(0xefebcd, -33, 20, 17, Math.PI / 5)
		createBook(0x661111, 21.5, 74, 20.5, -Math.PI / 5)
		createBook(0x665511, 23.5, 74, 17, -Math.PI / 5)
		createBook(0x331111, -28, 101.5, -10, -Math.PI / 5)
		createBook(0x111155, -21, 45, 17, Math.PI / 5)
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
		this.story.rotateY(0.01)
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

	public rotateSelectedBook(rotation: number) {
		if (this.bookSelected != null) {
			this.bookSelected.mesh.rotation.y = rotation
			this.bookSelected.glowMesh.rotation.y = rotation
		}
	}

	public render(): void {
		super.render()
	}

	private addText(bookInfo: BookInfo) {
		const tempV = new Vector3()
		tempV.project(this._cam)

		// convert the normalized position to CSS coordinates
		const resumeX = (tempV.x * 0.5 + 0.5) * window.innerWidth
		const resumeY = (tempV.y * -0.5 + 0.1) * window.innerHeight

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
		const titleY = (tempV.y * -0.5 - 0.1) * window.innerHeight
		title.style.transform = `translate(-50%, -50%) translate(${titleX}px,${titleY}px)`
	}
	story = new Object3D()

	private addStory(bookInfo: BookInfo, pos: Vector3) {
		bookInfo.object.position.x = (this._cam.position.x + pos.x) / 2 + 5
		bookInfo.object.position.y = (this._cam.position.y + pos.y) / 2
		bookInfo.object.position.z = (this._cam.position.z + pos.z) / 2
		this.story = bookInfo.object
		this._scene.add(this.story)
	}

	private removeStory() {
		this._scene.remove(this.story)
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
