import { useEffect, useRef } from "react";
import { BoxGeometry, Mesh, MeshNormalMaterial, PerspectiveCamera, Scene, WebGLRenderer } from "three";

const App = () => {
  useEffect(() => {
    
    var scene = new Scene();
    var camera = new PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    var renderer = new WebGLRenderer();
    
    renderer.setSize( window.innerWidth, window.innerHeight );
    
    document.body.appendChild( renderer.domElement );
    
    var geometry = new BoxGeometry( 1, 1, 1 );
    var material = new MeshNormalMaterial();
    var cube = new Mesh( geometry, material );
    
    scene.add( cube );
    camera.position.z = 5;
    
    var animate = function () {
      requestAnimationFrame( animate );
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render( scene, camera );
    };
    
    animate();
  }, []);

  return (
    <div>

    </div>
  );
}

export default App;