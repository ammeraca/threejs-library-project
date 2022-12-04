import { AdditiveBlending, AnimationMixer, AxesHelper, BoxGeometry, Color, DirectionalLight, FrontSide, Mesh, MeshBasicMaterial, Raycaster, ShaderMaterial, Vector2, WebGLRenderer } from 'three';
import { Example } from './example';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

let mouse = new Vector2(0,0);

export default class GLTFExample extends Example {
  controls = new OrbitControls(this._cam, this._renderer.domElement);
  private _raycaster: Raycaster;
  private _mouse: Vector2;
  // mixer = new AnimationMixer();

  bookGeom = new BoxGeometry(2 / 15, 3 / 15, 0.5 / 15)
  customMaterial = new ShaderMaterial({
    uniforms: {
      c: { value: 0.1 },
      p: { value: 1 },
      glowColor: { value: new Color(0xfaaaa0) },
      viewVector: { value: this._cam.position },
    },
    vertexShader: document.getElementById('vertexShader')!.textContent!,
    fragmentShader: document.getElementById('fragmentShader')!.textContent!,
    side: FrontSide,
    blending: AdditiveBlending,
    transparent: true,
  })

  public books = {
    book: new Mesh(this.bookGeom.clone(), new MeshBasicMaterial({ color: new Color(0x448f44) })),
    bookGlow: new Mesh(this.bookGeom.clone(), this.customMaterial.clone())
  }

  constructor(renderer: WebGLRenderer) {
    super(renderer);

    this._mouse = new Vector2();
    this._raycaster = new Raycaster();
  }

  public initialize() {
    super.initialize()

    this.setControls();

		const dir = new DirectionalLight(0xffffff, 5)
		dir.position.set(-20, 40, 40)
		dir.shadow.mapSize.set(8192, 8192)
		dir.castShadow = true
		this._scene.add(dir)

		this._scene.add(new AxesHelper(100))

		window.addEventListener('pointerdown', this.onPointerDown)

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
				gltf.scene.scale.set(50, 50, 50)
				this._scene.add(gltf.scene)
			},
			undefined,
			function (e) {
				console.error(e)
			}
		) 

		this.books.book.rotateY(-Math.PI / 8)
		this.books.book.position.set(0.2, 0.45, 0.2)
		this.books.book.name = 'book'
    this._scene.add(this.books.book)

		this.books.bookGlow.position.set(this.books.book.position.x, this.books.book.position.y, this.books.book.position.z)
		this.books.bookGlow.rotation.set(this.books.book.rotation.x, this.books.book.rotation.y, this.books.book.rotation.z)
		this.books.bookGlow.scale.multiplyScalar(1.2)
  }

  
  public onPointerDown(event: MouseEvent) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    if(this._raycaster){
      this._raycaster.setFromCamera(mouse, this._cam)
      const intersects = this._raycaster.intersectObjects(this._scene.children, false)
      if (intersects.length > 0) {
        const object = intersects[0].object as Mesh
        if (object.name === 'book') console.log(object)
        else this._scene.remove(this.books.bookGlow)
      }
    }
  }

  public resize(w: number, h: number): void {
    super.resize(w,h);
  }

  public destroy(): void {
    super.destroy();
  }

  public update(delta: number): void {
    this.controls.update();
    
  }

  public render(): void {
    super.render();
    this._raycaster.setFromCamera(this._mouse, this._cam);
    const intersection = this._raycaster.intersectObject(this._scene, true);
    if (intersection && intersection.length > 0) {
      const object = intersection[0].object as Mesh
      if (object.name === 'book') console.log(object)
      else this._scene.remove(this.books.bookGlow)
    }
  }

  public setControls(){
		this.controls = new OrbitControls(this._cam, this._renderer.domElement)
		this.controls.target.set(0, 0.5, 0)
		this.controls.enablePan = false
		this.controls.minPolarAngle = Math.PI / 2.4
		this.controls.maxPolarAngle = Math.PI / 2.15
		this.controls.minDistance = 1
	  this.controls.maxDistance = 100
		this.controls.enableDamping = true
		this.controls.rotateSpeed = 0.6
		this.controls.enableZoom = false
	}
}