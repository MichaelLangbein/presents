import { BufferGeometry, CubeTextureLoader, 
        Material, Mesh, PerspectiveCamera, Scene, 
        Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";


export class Stage {
    controls: OrbitControls;
    composer: EffectComposer;
    model: Mesh<BufferGeometry, Material>;
    scene: Scene;
    camera: PerspectiveCamera;
    renderer: WebGLRenderer;
    
    constructor(canvas: HTMLCanvasElement, model: Mesh<BufferGeometry, Material>, backgroundImageUrls: string[]) {
        const scene = new Scene();

        const camera = new PerspectiveCamera( 45, canvas.width / canvas.height, 0.01, 100);
        scene.add(camera);
        camera.position.set(0, 1, 4);
        camera.lookAt(new Vector3(0, 0, 0));

        const renderer = new WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, depth: true });
        renderer.setPixelRatio( window.devicePixelRatio );

        const controls = new OrbitControls(camera, renderer.domElement);

        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        const reflectionCube = new CubeTextureLoader().load(backgroundImageUrls);
        scene.background = reflectionCube;

        scene.add(model);
        model.position.set(0, 0, 0);
        model.scale.set(1, 1, 1);
        model.lookAt(camera.position);

        this.scene = scene;
        this.camera = camera;
        this.controls = controls;
        this.composer = composer;
        this.renderer = renderer;
        this.model = model;
    }

    loop(onLoop?: (i: number) => void) {
        let i = 0;
        const lp = (fps: number, inMs: number) => {
          setTimeout(() => {
            const start = new Date().getTime();
      

            i += 1;
            if (onLoop) onLoop(i);
            this.controls.update();
            this.composer.render();
      

            const end = new Date().getTime();
            const delta = end - start;
            const msLeft = 1000 / fps - delta;
            if (msLeft < 0.2 * (1000 / fps))
              console.log(`Little time left: ${msLeft} of ${1000 / fps}`);
            lp(fps, msLeft);
          }, inMs);
        }
      
        lp(30, 0);
    }
}