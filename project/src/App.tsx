import { useEffect } from 'react';
import { BoxGeometry, Mesh, MeshNormalMaterial, SphereGeometry } from 'three';

import SceneInit from './lib/SceneInit';

function App() {
  useEffect(() => {
    const test = new SceneInit('myThreeJsCanvas');
    test.initialize();
    test.animate();

    const sphere = new SphereGeometry();
    const mesh = new Mesh(sphere, new MeshNormalMaterial());

    test.scene.add(mesh);
  }, []);

  return (
    <div>
      <canvas id="myThreeJsCanvas" />
    </div>
  );
}

export default App;
