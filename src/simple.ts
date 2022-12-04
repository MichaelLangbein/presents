import { AmbientLight, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';




const canvas = document.getElementById('canvas') as HTMLCanvasElement;
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;


const renderer = new WebGLRenderer({
    alpha: true,
    canvas: canvas
})

const scene = new Scene();
// scene.background = `black`;

const light = new AmbientLight();
scene.add(light);

const camera = new PerspectiveCamera(50, canvas.width / canvas.height, 0.01, 100);
camera.position.set(0, 0, -1);
camera.lookAt(0, 0, 0);

const loader = new GLTFLoader();
const andreas = await loader.loadAsync("/andreas.glb");
scene.add(andreas.scene);
andreas.scene.position.set(0, 0, 0);
andreas.scene.lookAt(camera.position);


renderer.render(scene, camera);