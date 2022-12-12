import { BufferGeometry, Material, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector3, Vector4, WebGLRenderTarget } from "three";
import { SoundMgmt } from "../utils/Sound";
import { Stage } from "./Stage";
import { GodRaysFakeSunShader, GodRaysDepthMaskShader, GodRaysCombineShader, GodRaysGenerateShader 
} from 'three/examples/jsm/shaders/GodRaysShader';



// https://github.com/mrdoob/three.js/blob/master/examples/webgl_postprocessing_godrays.html

export class GodRayStage extends Stage {

    postScene: Scene;
    materialGodraysDepthMask: ShaderMaterial;
    materialGodraysGenerate: ShaderMaterial;
    materialGodraysCombine: ShaderMaterial;
    materialGodraysFakeSun: ShaderMaterial;
    rtTextureColors: WebGLRenderTarget;
    rtTextureDepth: WebGLRenderTarget;
    rtTextureDepthMask: WebGLRenderTarget;
    rtTextureGodrays1: WebGLRenderTarget;
    rtTextureGodrays2: WebGLRenderTarget;
    postCam: OrthographicCamera;

    constructor(public sunPosition: Vector3, player: SoundMgmt, canvas:HTMLCanvasElement, model: Mesh<BufferGeometry, Material>) {
        
        
        super(canvas, model, []);
        
        this.renderer.setClearColor(0xffffff);


      // depth
    //   const materialDepth = new MeshDepthMaterial();
    //   const materialScene = new MeshBasicMaterial({color: 0x000000});

      // 
      const scene = new Scene();
      const camera = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10000, 10000);
      camera.position.z = 100;
      scene.add(camera);

      const scaleFactor = 1.0 / 4.0;
      const rtTextureColors = new WebGLRenderTarget(canvas.width, canvas.height);
      const rtTextureDepth = new WebGLRenderTarget(canvas.width, canvas.height);
      const rtTextureDepthMask = new WebGLRenderTarget(canvas.width, canvas.height);
      const rtTextureGodrays1 = new WebGLRenderTarget(canvas.width * scaleFactor, canvas.height * scaleFactor);
      const rtTextureGodrays2 = new WebGLRenderTarget(canvas.width * scaleFactor, canvas.height * scaleFactor);
      
      const materialGodraysDepthMask = new ShaderMaterial(GodRaysDepthMaskShader);
      const materialGodraysGenerate = new ShaderMaterial(GodRaysGenerateShader);
      const materialGodraysCombine = new ShaderMaterial(GodRaysCombineShader);
      const materialGodraysFakeSun = new ShaderMaterial(GodRaysFakeSunShader);
      materialGodraysFakeSun.uniforms.bgColor.value.setHex(0x000000);
      materialGodraysFakeSun.uniforms.sunColor.value.setHex(0xffffff);
      materialGodraysCombine.uniforms.fGodRayIntensity.value = 0.75;

      const quad = new Mesh(new PlaneGeometry(1, 1), materialGodraysGenerate);
      quad.position.z = -9900;
      scene.add(quad);
 
      this.postScene = scene;
      this.postCam = camera;

      this.materialGodraysDepthMask = materialGodraysDepthMask;
      this.materialGodraysGenerate = materialGodraysGenerate;
      this.materialGodraysCombine = materialGodraysCombine;
      this.materialGodraysFakeSun = materialGodraysFakeSun;

      this.rtTextureColors = rtTextureColors;
      this.rtTextureDepth = rtTextureDepth;
      this.rtTextureDepthMask = rtTextureDepthMask;
      this.rtTextureGodrays1 = rtTextureGodrays1;
      this.rtTextureGodrays2 = rtTextureGodrays2;
    }

    loop(onLoop?: ((i: number) => void) | undefined): void {
        super.loop(() => {

            const clipPosition = new Vector4(this.sunPosition.x, this.sunPosition.y, this.sunPosition.z, 1);
            clipPosition.applyMatrix4(this.camera.matrixWorldInverse).applyMatrix4(this.camera.projectionMatrix);
            clipPosition.x /= clipPosition.w;
            clipPosition.y /= clipPosition.w;
    
            const screenSpacePosition = new Vector3();
            screenSpacePosition.x = ( clipPosition.x + 1 ) / 2; // transform from [-1,1] to [0,1]
            screenSpacePosition.y = ( clipPosition.y + 1 ) / 2; // transform from [-1,1] to [0,1]
            screenSpacePosition.z = clipPosition.z; // needs to stay in clip space for visibility checks
    
            this.materialGodraysGenerate.uniforms['vSunPositionScreenSpace'].value.copy(screenSpacePosition);
            this.materialGodraysFakeSun.uniforms['vSunPositionScreenSpace'].value.copy(screenSpacePosition);
    
            this.renderer.setRenderTarget(this.rtTextureColors);
            this.renderer.clear(true, true, false);

            this.postScene.overrideMaterial = this.materialGodraysFakeSun;
            this.renderer.setRenderTarget(this.rtTextureColors);
            this.renderer.render(this.postScene, this.postCam);

            this.renderer.setRenderTarget(this.rtTextureColors);
            this.renderer.render(this.scene, this.camera);


        });

    }
}