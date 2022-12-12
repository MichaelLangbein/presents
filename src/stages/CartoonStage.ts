import { BufferGeometry, Material, Mesh, PointLight } from "three";
import { SoundMgmt } from "../utils/Sound";
import { Stage } from "./Stage";
import { HalftonePass } from "three/examples/jsm/postprocessing/HalftonePass";

export class CartoonStage extends Stage {

  light: PointLight;
    halftonePass: HalftonePass;
  
  constructor( private sound: SoundMgmt, canvas: HTMLCanvasElement, mesh: Mesh<BufferGeometry, Material>, backgroundUrls: string[] ) {
    super(canvas, mesh, backgroundUrls);

    const light = new PointLight();
    this.scene.add(light);
    light.position.set(-3, 3, 0);

    const params = {
      shape: 1,
      radius: 4,
      rotateR: Math.PI / 12,
      rotateB: (Math.PI / 12) * 2,
      rotateG: (Math.PI / 12) * 3,
      scatter: 0,
      blending: 1,
      blendingMode: 1,
      greyscale: false,
      disable: false,
    };
    const halftonePass = new HalftonePass( canvas.width, canvas.height, params );
    this.composer.addPass(halftonePass);

    this.light = light;
    this.halftonePass = halftonePass;
  }

  loop(onLoop?: ((i: number) => void) | undefined): void {
    const n = 100;
    const data: number[] = [];
    let meanAmplitude = 0.0;
    super.loop((i) => {


        const amplitude = this.sound.getCurrentAmplitude();
        if (amplitude) {
            data.push(Math.abs(amplitude));
            if (data.length > n) data.shift();
            meanAmplitude = data.reduce((v, c) => c + v, 0) / n;
        }
    
        const speed = 0.4;
        const radius = 5 * ( 1.0 - meanAmplitude);
        const theta = - speed * i % 360;
        const xNew = radius * Math.sin((theta * 2.0 * Math.PI) / 360);
        const zNew = radius * Math.cos((theta * 2.0 * Math.PI) / 360);

        this.light.position.set(xNew, 3, zNew);
        const dotRadius = (meanAmplitude / 0.5) * 25 + 1;
        (this.halftonePass.uniforms as any)['radius'].value = dotRadius;
        console.log(dotRadius)

    });
  }
}
