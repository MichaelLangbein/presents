import { BufferGeometry, Material, Mesh, PCFSoftShadowMap, PointLight, Vector3 } from "three";
import { GodraysPass } from "three-good-godrays";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { SoundMgmt } from "./Sound";
import { Stage } from "./Stage";


export class GodRayStage extends Stage {
    constructor(player: SoundMgmt, canvas:HTMLCanvasElement, model: Mesh<BufferGeometry, Material>) {
        
        
        super(canvas, model, []);


        // shadowmaps are needed for this effect
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;

        // Make sure to set applicable objects in your scene to cast + receive shadows
        // so that this effect will work
        model.castShadow = true;
        model.receiveShadow = true;

        // godrays can be cast from either `PointLight`s or `DirectionalLight`s
        const lightPos = new Vector3(0, 20, 0);
        const pointLight = new PointLight(0xffffff, 1, 10000);
        pointLight.castShadow = true;
        pointLight.shadow.mapSize.width = 1024;
        pointLight.shadow.mapSize.height = 1024;
        pointLight.shadow.autoUpdate = true;
        pointLight.shadow.camera.near = 0.1;
        pointLight.shadow.camera.far = 1000;
        pointLight.shadow.camera.updateProjectionMatrix();
        pointLight.position.copy(lightPos);
        this.scene.add(pointLight);

        // set up rendering pipeline and add godrays pass at the end
        const godraysPass = new GodraysPass(pointLight, this.camera);
        // If this is the last pass in your pipeline, set `renderToScreen` to `true`
        this.composer.addPass(godraysPass as any);
    }
}