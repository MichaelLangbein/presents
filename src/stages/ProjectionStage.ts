import { Mesh, BufferGeometry, Material, PCFSoftShadowMap,
    sRGBEncoding, ACESFilmicToneMapping, HemisphereLight,
    TextureLoader, LinearFilter, SpotLight, MeshLambertMaterial, PlaneGeometry, SpotLightHelper } from "three";
import { getBase } from "../utils/accessors";
import { SoundMgmt } from "../utils/Sound";
import { Stage } from "./Stage";


export class ProjectionStage extends Stage {
    
    spotlight: SpotLight;
    
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
        spotLight.position.set(-7, 3, 0);
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

        const ground = new Mesh(new PlaneGeometry(1000, 1000), new MeshLambertMaterial({ color: 0x808080 }));
        ground.position.set( 0, -2, 0 );
        ground.rotation.x = - Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        this.spotlight = spotLight;
    }

    loop(onLoop?: ((i: number) => void) | undefined): void {
        super.loop((i) => {
            
            const amplitude = this.sound.getCurrentAmplitude();

            const speed = 0.4;
            const radius = 5;
            const theta = - speed * i % 360;
            const xNew = radius * Math.sin((theta * 2.0 * Math.PI) / 360);
            const zNew = radius * Math.cos((theta * 2.0 * Math.PI) / 360);

            this.model.rotateY(0.001);

            this.spotlight.position.setX(xNew);
            this.spotlight.position.setZ(zNew);
            this.spotlight.lookAt(this.model.position);

            // const spotlightAxis = this.spotlight.position.clone().min(this.model.position.clone());
            // this.spotlight.rotateOnAxis(spotlightAxis, 0.01);
        });
    }
}