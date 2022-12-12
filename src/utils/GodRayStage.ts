import { BufferGeometry, Color, Material, Mesh, MeshStandardMaterial, PCFSoftShadowMap, PlaneGeometry, PointLight, Vector3 } from "three";
import { GodraysPass } from "three-good-godrays";
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

        const ground = new Mesh(new PlaneGeometry(2, 2, 1, 1), new MeshStandardMaterial());
        ground.receiveShadow = true;
        this.scene.add(ground);
        ground.position.set(0, -0.5, 0);
        ground.lookAt(new Vector3(0, 0, 0));

        // godrays can be cast from either `PointLight`s or `DirectionalLight`s
        const lightPos = new Vector3(0, 1, -2);
        const pointLight = new PointLight(new Color(`rgb(125, 10, 125)`), 1, 10000);
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
        const godraysPass = new GodraysPass(pointLight, this.camera, {
            raymarchSteps: 60,
            maxDensity: 0.5,
            blur: true,
            color: new Color(`rgb(125, 10, 125)`),
            density: 3 / 128,
            distanceAttenuation: 2,
        });
        // If this is the last pass in your pipeline, set `renderToScreen` to `true`
        godraysPass.renderToScreen = true;
        this.composer.addPass(godraysPass as any);
    }
}