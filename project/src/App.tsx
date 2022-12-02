import { useEffect } from "react";
import {
  AnimationMixer,
  BoxGeometry,
  Color,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const App = () => {
  useEffect(() => {
    var scene = new Scene();
    scene.background = new Color(0xa9a9a9);
    var camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    var renderer = new WebGLRenderer();
    var mixer: AnimationMixer;

    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);

    const dir = new DirectionalLight(0xffffff, 5);
    dir.position.set(-20, 40, 40);
    dir.shadow.mapSize.set(8192, 8192);
    dir.castShadow = true;
    scene.add(dir);

    new OrbitControls(camera, renderer.domElement);

    scene.add(new Mesh(new SphereGeometry(), new MeshStandardMaterial()));
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.4.3/"
    );

    // const loader = new GLTFLoader();
    // loader.setDRACOLoader(dracoLoader);
    // // const book = new Mesh();
    // loader.load(
    //   "assets/scene.gltf",
    //   (gltf) => {
    //     mixer = new AnimationMixer(gltf.scene);
    //     gltf.animations.forEach((clip) => {
    //       mixer.clipAction(clip).play();
    //     });
    //     gltf.scene.scale.set(1, 1, 1);
    //     scene.add(gltf.scene);
    //   },
    //   undefined,
    //   function (e) {
    //     console.error(e);
    //   }
    // );

    const book = new Mesh(
      new BoxGeometry(21, 29, 5),
      new MeshStandardMaterial()
    );
    scene.add(book);
    camera.position.z = 5;

    var animate = function () {
      requestAnimationFrame(animate);

      renderer.render(scene, camera);
    };

    animate();
  }, []);

  return <div></div>;
};

export default App;
