import { hsl } from "d3-color";
import { AmbientLight, BufferGeometry, DepthFormat, DepthTexture, Material, Mesh, UnsignedShortType, Vector2 } from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { ElectricEelPass } from "../utils/ElectricEel";
import { SoundMgmt } from "../utils/Sound";
import { Stage } from "./Stage";

export class ElectricEelStage extends Stage {
    
    eel: ElectricEelPass;
    constructor(private player: SoundMgmt, canvas: HTMLCanvasElement, model: Mesh<BufferGeometry, Material>, urls: string[]) {

        super(canvas, model, urls);

        // making sure that the composer's two textures contain depth information
        this.composer.renderTarget1.depthTexture = new DepthTexture(canvas.width,canvas.height);
        this.composer.renderTarget1.depthTexture.format = DepthFormat;
        this.composer.renderTarget1.depthTexture.type = UnsignedShortType;
        this.composer.renderTarget1.stencilBuffer = false;
        this.composer.renderTarget2.depthTexture = new DepthTexture(canvas.width,canvas.height);
        this.composer.renderTarget2.depthTexture.format = DepthFormat;
        this.composer.renderTarget2.depthTexture.type = UnsignedShortType;
        this.composer.renderTarget2.stencilBuffer = false;

        const eel = new ElectricEelPass(canvas.width, canvas.height, this.camera.near, this.camera.far);
        this.composer.addPass(eel);
        this.composer.addPass(new UnrealBloomPass(new Vector2(2, 2), 0.5, 1, 0.2));
        // this.composer.addPass(new AfterimagePass());

        this.scene.add(new AmbientLight());

        this.eel = eel;
    }

    loop() {
        super.loop((i) => {

            const amplitude = this.player.getCurrentAmplitude();
            const color = hsl(amplitude * 360, 1, 0.5).rgb();
            const rgbcolor: [number, number, number] = [
                color.r / 256,
                color.g / 256,
                color.b / 256,
            ];

            this.model.rotateY(0.001);
            // this.eel.setParas(rgbcolor, 1.0, 0.0005, 0.0005, 1.0);
            // this.eel.setParas(rgbcolor, 1.0, 0.0005, amplitude * 0.1, 0.3);
            // this.eel.setParas(rgbcolor, 1.0 - amplitude, 0.00025, 0.0005, 0.7);
            const fadeRate = 1.001;
            const speedFactor = 0.0003;
            const spawnChance = 0.0005;
            const mixRate = 0.4;
            this.eel.setParas(rgbcolor, fadeRate, speedFactor, spawnChance, mixRate);
        })
    }
}