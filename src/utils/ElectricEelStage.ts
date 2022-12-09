import { hsl } from "d3-color";
import { AmbientLight, BufferGeometry, DepthFormat, DepthTexture, Material, Mesh, UnsignedShortType, Vector2 } from "three";
import { AfterimagePass } from "three/examples/jsm/postprocessing/AfterimagePass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { ElectricEelPass } from "./ElectricEel";
import { SoundMgmt } from "./Sound";
import { Stage } from "./Stage";

export class ElectricEelStage extends Stage {
    constructor(player: SoundMgmt, canvas: HTMLCanvasElement, model: Mesh<BufferGeometry, Material>) {

        const urls = [
            "./interstellar/interstellar_ft.jpg",
            "./interstellar/interstellar_bk.jpg",
            "./interstellar/interstellar_up.jpg",
            "./interstellar/interstellar_dn.jpg",
            "./interstellar/interstellar_rt.jpg",
            "./interstellar/interstellar_lt.jpg",
        ];
        super(canvas, model, urls);


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
        this.composer.addPass(new UnrealBloomPass(new Vector2(2, 2), 3, 1, 0.2));
        this.composer.addPass(new AfterimagePass());

        this.scene.add(new AmbientLight());
    }

    loop() {
        super.loop((i) => {
            this.model.rotateY(0.001);
            const color = hsl(i % 360, 1, 0.5).rgb();
            const rgbcolor: [number, number, number] = [
                color.r / 256,
                color.g / 256,
                color.b / 256,
            ];
            // eel.setParas(rgbcolor, 1.0, 0.0005, 0.001, 0.3);
            // eel.setParas(rgbcolor, 1.0, 0.0005, amplitude * 0.1, 0.3);
            // eel.setParas(rgbcolor, 1.0 - amplitude, 0.00025, 0.001, 0.3);
        })
    }
}