import {
  Scene,
  PerspectiveCamera,
  WebGL1Renderer,
  AmbientLight,
  Vector3,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
// import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass';
import { GlitchPass } from "three/examples/jsm/postprocessing/GlitchPass";
// import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
// @ts-ignore
import { RenderPixelatedPass } from "three/examples/jsm/postprocessing/RenderPixelatedPass.js";
// import { GodRaysFakeSunShader, GodRaysDepthMaskShader, GodRaysCombineShader, GodRaysGenerateShader } from 'three/examples/jsm/shaders/GodRaysShader';  // https://github.com/mrdoob/three.js/blob/master/examples/webgl_postprocessing_godrays.html
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// https://stackoverflow.com/questions/65098657/three-js-post-processing-how-to-keep-depth-texture-for-multiple-passes

async function main() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;

  const scene = new Scene();

  const camera = new PerspectiveCamera( 45, canvas.width / canvas.height, 0.01, 100);
  scene.add(camera);
  camera.position.set(0, 2, 5);
  camera.lookAt(new Vector3(0, 0, 0));

  const renderer = new WebGL1Renderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
  });

  const controls = new OrbitControls(camera, renderer.domElement);

  const composer = new EffectComposer(renderer);

  const shaderPass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null }, // input texture
      tDepth: { value: null },
      opacity: { value: 0.5 },
    },
    vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,
    fragmentShader: /* glsl */ `
		uniform sampler2D tDiffuse;
		uniform sampler2D tDepth;	
		uniform float opacity;
		varying vec2 vUv;	

		void main() {
			gl_FragColor = texture2D( tDiffuse, vUv );
			gl_FragColor.a = opacity;
		}`,
  });

  composer.addPass(new RenderPass(scene, camera));
  // composer.addPass(shaderPass);
  composer.addPass(new RenderPixelatedPass(2, scene, camera));
  composer.addPass(new GlitchPass());
  // composer.addPass(new UnrealBloomPass(new Vector2(2, 2), 3, 1, 0.2))
  // composer.addPass(new AfterimagePass());

  const light = new AmbientLight();
  scene.add(light);

  // const cube = new Mesh(new BoxGeometry(2, 2, 2), new MeshPhongMaterial({ color: 'rgb(255, 0, 0)' }));
  // scene.add(cube);
  const loader = new GLTFLoader();
  const andreas = await loader.loadAsync("/luis.glb");
  scene.add(andreas.scene);
  andreas.scene.position.set(0, 0, 0);
  andreas.scene.scale.set(1, 1, 1);
  andreas.scene.lookAt(camera.position);

  let t = 0;
  function loop(inMs: number) {
    setTimeout(() => {
      const startTime = new Date().getTime();

      t += 1000 / 60;
      andreas.scene.rotateY(0.01);
      shaderPass.uniforms.opacity.value = Math.abs(Math.sin(0.001 * t));
      composer.render();

      controls.update();

      const endTime = new Date().getTime();
      const remaining = 1000 / 60 - (endTime - startTime);

      loop(remaining);
    }, inMs);
  }

  loop(0);
}

main();
