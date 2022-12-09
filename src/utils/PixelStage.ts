import { AmbientLight, BufferGeometry, DirectionalLight, Material, Mesh, Vector2 } from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
// @ts-ignore
import { RenderPixelatedPass } from 'three/examples/jsm/postprocessing/RenderPixelatedPass.js';
import { SoundMgmt } from "./Sound";
import { Stage } from "./Stage";

export class PixelStage extends Stage {
    constructor(player: SoundMgmt, canvas: HTMLCanvasElement, model: Mesh<BufferGeometry, Material>) {
        
        const urls = [
            "./teal/0003.jpg",
            "./teal/0002.jpg",
            
            "./teal/0001.jpg",
            "./teal/0006.jpg",
            
            "./teal/0005.jpg",
            "./teal/0004.jpg",
        ];
        
        super(canvas, model, urls);

        this.scene.add(new AmbientLight());
        this.scene.add(new DirectionalLight());

        this.composer.addPass(new UnrealBloomPass(new Vector2(2, 2), 0.5, 1, 0.5));
        this.composer.addPass(new RenderPixelatedPass(6, this.scene, this.camera));
    }
}