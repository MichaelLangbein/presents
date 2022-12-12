import { Mesh, BufferGeometry, Material } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export function getBase() {
  const isProd = import.meta.env.PROD;
  const base = isProd ? "https://michaellangbein.github.io/presents/" : "./";
  return base;
}

export async function loadModel(
  name: "Andreas" | "Helena" | "Sabine" | "Luis"
) {
  const base = getBase();

  const loader = new GLTFLoader();

  switch (name) {
    case "Andreas":
      const ga = await loader.loadAsync(`${base}/models/andreas.glb`);
      const ma = ga.scene.children[9] as Mesh<BufferGeometry, Material>;
      return ma;
    case "Helena":
      const gh = await loader.loadAsync(`${base}/models/helena.glb`);
      const mh = gh.scene.children[0] as Mesh<BufferGeometry, Material>;
      return mh;
    case "Sabine":
      const gs = await loader.loadAsync(`${base}/models/sabine.glb`);
      const ms = gs.scene.children[0] as Mesh<BufferGeometry, Material>;
      return ms;
    case "Luis":
      const gl = await loader.loadAsync(`${base}/models/luis.glb`);
      const ml = gl.scene.children[0] as Mesh<BufferGeometry, Material>;
      return ml;
    default:
      throw new Error(`Unknown model: ${name}`);
  }
}

export function getTextures(
  name:
    | "interstellar"
    | "brown_clouds"
    | "blue_clouds"
    | "polluted"
    | "sunset"
    | "nebulae"
    | "asteroids"
) {
  const base = getBase();
  switch (name) {
    case "interstellar":
      return [
        `${base}/textures/interstellar/interstellar_ft.jpg`,
        `${base}/textures/interstellar/interstellar_bk.jpg`,
        `${base}/textures/interstellar/interstellar_up.jpg`,
        `${base}/textures/interstellar/interstellar_dn.jpg`,
        `${base}/textures/interstellar/interstellar_rt.jpg`,
        `${base}/textures/interstellar/interstellar_lt.jpg`,
      ];
    case "brown_clouds":
      return [
        `${base}/textures/brown_clouds/browncloud_ft.jpg`,
        `${base}/textures/brown_clouds/browncloud_bk.jpg`,
        `${base}/textures/brown_clouds/browncloud_up.jpg`,
        `${base}/textures/brown_clouds/browncloud_dn.jpg`,
        `${base}/textures/brown_clouds/browncloud_rt.jpg`,
        `${base}/textures/brown_clouds/browncloud_lf.jpg`,
      ];
    case "blue_clouds":
      return [
        `${base}/textures/blue_clouds/bluecloud_ft.jpg`,
        `${base}/textures/blue_clouds/bluecloud_bk.jpg`,
        `${base}/textures/blue_clouds/bluecloud_up.jpg`,
        `${base}/textures/blue_clouds/bluecloud_dn.jpg`,
        `${base}/textures/blue_clouds/bluecloud_rt.jpg`,
        `${base}/textures/blue_clouds/bluecloud_lf.jpg`,
      ];
    case "asteroids":
      return [
        `${base}/textures/asteroids/asteroids_ft.jpg`,
        `${base}/textures/asteroids/asteroids_bk.jpg`,
        `${base}/textures/asteroids/asteroids_up.jpg`,
        `${base}/textures/asteroids/asteroids_dn.jpg`,
        `${base}/textures/asteroids/asteroids_rt.jpg`,
        `${base}/textures/asteroids/asteroids_lf.jpg`,
      ];
    case "nebulae":
      return [
        `${base}/textures/nebulae/nebulae_ft.jpg`,
        `${base}/textures/nebulae/nebulae_bk.jpg`,
        `${base}/textures/nebulae/nebulae_up.jpg`,
        `${base}/textures/nebulae/nebulae_dn.jpg`,
        `${base}/textures/nebulae/nebulae_rt.jpg`,
        `${base}/textures/nebulae/nebulae_lf.jpg`,
      ];
    case "polluted":
      return [
        `${base}/textures/polluted/polluted_ft.jpg`,
        `${base}/textures/polluted/polluted_bk.jpg`,
        `${base}/textures/polluted/polluted_up.jpg`,
        `${base}/textures/polluted/polluted_dn.jpg`,
        `${base}/textures/polluted/polluted_rt.jpg`,
        `${base}/textures/polluted/polluted_lf.jpg`,
      ];
    case "sunset":
      return [
        `${base}/textures/sunset/sunset_ft.jpg`,
        `${base}/textures/sunset/sunset_bk.jpg`,
        `${base}/textures/sunset/sunset_up.jpg`,
        `${base}/textures/sunset/sunset_dn.jpg`,
        `${base}/textures/sunset/sunset_rt.jpg`,
        `${base}/textures/sunset/sunset_lf.jpg`,
      ];
    default:
      throw new Error(`Unknown textures: ${name}`);
  }
}

export function getSong(
  name: "docu" | "penguin" | "lofi" | "lifelike" | "tech" | "space"
) {
  const base = getBase();
  switch (name) {
    case "docu":
      return `${base}/audio/documentary-technology.mp3`;
    case "penguin":
      return `${base}/audio/penguinmusic.mp3`;
    case "lofi":
      return `${base}/audio/lofi-study.mp3`;
    case "lifelike":
      return `${base}/audio/lifelike.mp3`;
    case "tech":
      return `${base}/audio/documentary-11052.mp3`;
    case "space":
      return `${base}/audio/space-age-10714.mp3`;
    default:
      throw new Error(`Unknown song: ${name}`);
  }
}
