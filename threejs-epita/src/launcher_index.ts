import { Clock, Color, WebGLRenderer } from 'three';
import { Project } from './model';

// @ts-ignore
const modules = import.meta.glob('./launcher.ts');

async function loadExamples(renderer: WebGLRenderer): Promise<Project[]> {
  const promises = [];
  for (const path in modules) {
    const name = "launcher";
    const p = modules[path]().then((mod: any) => {
      const example = new mod.default(renderer);
      example['_name'] = name;
      return example;
    })
    promises.push(p);
  }
  return Promise.all(promises);
}

function switchExample(next: Project, previous?: Project | null): void {
  next.initialize();
  next.resize(canvas.width, canvas.height);
  if (previous) {
    previous.destroy();
  }
  const title = document.getElementById('title');
  if (title) {
    title.innerText = next.name;
  }
}

const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
const renderer = new WebGLRenderer({ canvas, antialias: true });
renderer.setClearColor(new Color('#464646'));

const examples = await loadExamples(renderer);
const params = new URLSearchParams(window.location.search);
const exampleId = params.get('tp') ?? params.get('example') ?? 'texture-example';
let exampleIndex = examples.findIndex((e) => e.name === exampleId);
exampleIndex = exampleIndex === -1 ? 0 : exampleIndex;

const clock = new Clock();

switchExample(examples[exampleIndex]);

function animate() {
  const example = examples[exampleIndex];
  if (example) {
    example.update(clock.getDelta(), clock.getElapsedTime());
    example.render();
  }
  window.requestAnimationFrame(animate);
}
animate();

const resizeObserver = new ResizeObserver(entries => {
  const example = examples[exampleIndex];
  if (entries.length > 0) {
    const entry = entries[0];
    canvas.width = window.devicePixelRatio * entry.contentRect.width;
    canvas.height = window.devicePixelRatio * entry.contentRect.height;
    renderer.setSize(canvas.width, canvas.height, false);
    if (example) {
      example.resize(canvas.width, canvas.height);
    }
  }
});

resizeObserver.observe(canvas);
