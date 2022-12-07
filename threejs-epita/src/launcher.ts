import {
	AmbientLight,
	AnimationMixer,
	Color,
	Group,
	Mesh,
	Object3D,
	SphereGeometry,
	Spherical,
	WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { Example } from './example'

function rand(dist: number, out: Object3D): Object3D {
  const n = Math.random();
  const n2 = Math.random();

  const s = new Spherical(dist, n * 2.0 * Math.PI, n2 * 2.0 * Math.PI);

  out.position.setFromSpherical(s).multiplyScalar(dist);
  return out;
}

export default class HomeScreen extends Example {
	_pivot: Object3D;
	private _starGroup: Group;

	constructor(renderer: WebGLRenderer) {
		super(renderer)

		this._scene.background = new Color(0x000000)

		const ambient = new AmbientLight(0xffffff, 0.5);
		this._scene.add(ambient);

		this._pivot = new Object3D();
		this._scene.add(this._pivot);

		new OrbitControls(this._cam, renderer.domElement);
    const sphere = new SphereGeometry(5);
    this._starGroup = new Group();
    for (let i = 0; i < 2000; ++i) {
      const s = new Mesh(sphere);
      rand(20, s);
      s.scale.set(0.25, 0.25, 0.25);
      this._starGroup.add(s);
    }

    this._scene.add(this._starGroup);
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

		// this.lightGroup.traverse((child) => {
    //   const light = (child as PointLight);
    //   if (light) {
    //     light.intensity = Math.random();
		// 		light.position.set(Math.random(), Math.random(), Math.random())
    //   }
    // });
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
