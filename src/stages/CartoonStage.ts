import { BufferGeometry, Material, Mesh } from "three";
import { SoundMgmt } from "../utils/Sound";
import { Stage } from "./Stage";


export class CartoonStage extends Stage {
    constructor(private sound: SoundMgmt, canvas: HTMLCanvasElement, mesh: Mesh<BufferGeometry, Material>, backgroundUrls: string[]) {
        super(canvas, mesh, backgroundUrls);
    }
}