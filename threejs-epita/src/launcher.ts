import {
	AmbientLight,
	AnimationMixer,
	Color,
	Object3D,
	Vector2,
	WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { Example } from './example'

let mouse = new Vector2()
export default class HomeScreen extends Example {
	_pivot: Object3D;

	constructor(renderer: WebGLRenderer) {
		super(renderer)

		this._scene.background = new Color(0x000000)

		const ambient = new AmbientLight(0xffffff, 0.5);
		this._scene.add(ambient);

		this._pivot = new Object3D();
		this._scene.add(this._pivot);

		new OrbitControls(this._cam, renderer.domElement);
	}

	public initialize() {
		super.initialize()

		this._cam.position.z += 60;
		this.gltfLoader();
	}

	public resize(w: number, h: number): void {
		super.resize(w, h)
	}

	public destroy(): void {
		super.destroy()
	}

	public update(delta: number): void {
		this._pivot.rotateY(0.001);
	}

	public render(): void {
		super.render()
	}

	private gltfLoader() {
		const dracoLoader = new DRACOLoader()
		dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/')

		const loader = new GLTFLoader()
		loader.setDRACOLoader(dracoLoader)
		const book_path = 'assets/models/books/magic_book/scene.gltf'
		loader.load(
			book_path,
			(gltf) => {
				const mixer = new AnimationMixer(gltf.scene)
				gltf.animations.forEach((clip) => {
					mixer.clipAction(clip).play()
				})
				gltf.scene.scale.set(100, 100, 100)
				gltf.scene.position.y -= 20
				gltf.scene.rotateY(-Math.PI / 8);
				gltf.scene.rotateX(Math.PI / 8);
				this._pivot.add(gltf.scene)
			},
			undefined,
			function (e) {
				console.error(e)
			}
		)
	}
}
