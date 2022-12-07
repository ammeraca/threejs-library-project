import { PerspectiveCamera, Scene, WebGLRenderer } from 'three'

export class Project {
	protected _renderer: WebGLRenderer

	protected _scene: Scene

	protected _cam: PerspectiveCamera

	private readonly _name: string

	constructor(renderer: WebGLRenderer) {
		this._renderer = renderer
		this._scene = new Scene()
		this._cam = new PerspectiveCamera(45, 1, 0.1, 10000)
		this._cam.position.set(0, 25, 175)

		this._name = ''
	}

	public initialize() {
	}

	public destroy() {
	}

	public update(delta: number, elapsed: number) {
	}

	public render() {
		this._renderer.render(this._scene, this._cam)
	}

	public resize(w: number, h: number) {
		this._cam.aspect = w / h
		this._cam.updateProjectionMatrix()
	}

	public get name() {
		return this._name
	}
}
