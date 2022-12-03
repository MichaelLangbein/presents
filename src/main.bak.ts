import { Scene, PerspectiveCamera, WebGL1Renderer, AmbientLight, MeshPhongMaterial, Mesh, BoxGeometry, Vector3, DepthTexture } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';


// https://stackoverflow.com/questions/65098657/three-js-post-processing-how-to-keep-depth-texture-for-multiple-passes


const canvas = document.getElementById('canvas') as HTMLCanvasElement;

const scene = new Scene();

const camera = new PerspectiveCamera(45, canvas.width / canvas.height, 0.01, 100);
scene.add(camera);
camera.position.set(0, 2, 5);
camera.lookAt(new Vector3(0, 0, 0));

const renderer = new WebGL1Renderer({
    canvas: canvas,
    alpha: true,
    antialias: true
});

const composer = new EffectComposer(renderer);

const renderPass = new RenderPass(scene, camera);
const glitchPass = new GlitchPass();

const testShader = {
	uniforms: {
		'tDiffuse': { value: null }, // input texture
		'tDepth': { value: null },
		'opacity': { value: .5 }
	},
	vertexShader: /* glsl */`
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,
	fragmentShader: /* glsl */`
		uniform sampler2D tDiffuse;
		uniform sampler2D tDepth;	
		uniform float opacity;
		varying vec2 vUv;	

		void main() {
			gl_FragColor = texture2D( tDiffuse, vUv );
			gl_FragColor.a = opacity;
		}`
};
const shaderPass = new ShaderPass(testShader);


composer.addPass(renderPass);
composer.addPass(shaderPass);
composer.addPass(glitchPass);

const light = new AmbientLight();
scene.add(light);

const cube = new Mesh(new BoxGeometry(2, 2, 2), new MeshPhongMaterial({ color: 'rgb(255, 0, 0)' }));
scene.add(cube);


let t = 0;
function loop(inMs: number) {
    setTimeout(() => {
		const startTime = new Date().getTime();

        t += 1000 / 60;
        cube.rotateY(0.01);
        shaderPass.uniforms.opacity.value = Math.abs(Math.sin(0.001 * t));
		composer.render();


		const endTime = new Date().getTime();
		const remaining = (1000 / 60) - (endTime - startTime);

        loop(remaining);
    }, inMs);
}

loop(0);