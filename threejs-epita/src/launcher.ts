import {
	AmbientLight,
	AnimationMixer,
	Color,
	Vector2,
	WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { Example } from './example'

let mouse = new Vector2()
export default class GLTFExample extends Example {
	constructor(renderer: WebGLRenderer) {
		super(renderer)

		this._scene.background = new Color(0x000000)

		const ambient = new AmbientLight(0xffffff, 0.5);
		this._scene.add(ambient);

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
		
	}

	public render(): void {
		super.render()
	}

	private gltfLoader() {
		const dracoLoader = new DRACOLoader()
		dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/')

		const loader = new GLTFLoader()
		loader.setDRACOLoader(dracoLoader)
		const book_path = 'assets/models/viking_book/scene.gltf'
		loader.load(
			book_path,
			(gltf) => {
				const mixer = new AnimationMixer(gltf.scene)
				gltf.animations.forEach((clip) => {
					mixer.clipAction(clip).play()
				})
				gltf.scene.scale.set(0.5, 0.5, 0.5)
				this._scene.add(gltf.scene)
			},
			undefined,
			function (e) {
				console.error(e)
			}
		)
	}
}
