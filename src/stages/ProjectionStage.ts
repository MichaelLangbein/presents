import { Mesh, BufferGeometry, Material, PCFSoftShadowMap,
    sRGBEncoding, ACESFilmicToneMapping, HemisphereLight,
    TextureLoader, LinearFilter, SpotLight, MeshLambertMaterial, PlaneGeometry, SpotLightHelper } from "three";
import { getBase } from "../utils/accessors";
import { SoundMgmt } from "../utils/Sound";
import { Stage } from "./Stage";


export class ProjectionStage extends Stage {
    constructor(private sound: SoundMgmt, canvas: HTMLCanvasElement, model: Mesh<BufferGeometry, Material>, backgroundUrls: string[]) {
        
        // const model2 = new Mesh(model.geometry, new MeshLambertMaterial());
        const model2 = model;
        model2.geometry.computeVertexNormals();
        model2.castShadow = true;
        model2.receiveShadow = true;
        
        super(canvas, model2, backgroundUrls);

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap;
        this.renderer.outputEncoding = sRGBEncoding;
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;

        const ambient = new HemisphereLight(0xffffff, 0x444444, 0.05);
        this.scene.add(ambient);

        const loader = new TextureLoader();
        const texture = loader.load(`${getBase()}/textures/disturb.jpg`);
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        texture.encoding = sRGBEncoding;

        const spotLight = new SpotLight(0xffffff, 5);
        spotLight.position.set(-7, 7, 0);
        spotLight.lookAt(this.model.position);
        spotLight.angle = Math.PI / 6;
        spotLight.penumbra = 1;
        spotLight.decay = 2;
        spotLight.distance = 100;
        // @ts-ignore
        spotLight.map = texture;
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 1024;
        spotLight.shadow.mapSize.height = 1024;
        spotLight.shadow.camera.near = 0.01;
        spotLight.shadow.camera.far = 200;
        spotLight.shadow.focus = 1;
        this.scene.add(spotLight);

        const lightHelper = new SpotLightHelper( spotLight );
        this.scene.add(lightHelper);

        const ground = new Mesh(new PlaneGeometry(1000, 1000), new MeshLambertMaterial({ color: 0x808080 }));
        ground.position.set( 0, -2, 0 );
        ground.rotation.x = - Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }
}