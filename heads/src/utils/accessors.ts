import { Mesh, BufferGeometry, Material } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export function getBase() {
  const isProd = import.meta.env.PROD;
  const base = isProd ? "https://michaellangbein.github.io/presents/" : "./";
  return base;
}

export async function loadModel(
  name: "Andreas" | "Helena" | "Sabine" | "Luis" | "Nicole" | "Julian" | "Jana" | "Joschka" | "Inge" | "Lucia"
) {
  const base = getBase();

  const loader = new GLTFLoader();

  switch (name) {
    case "Andreas":
      const ga = await loader.loadAsync(`${base}/models/andreas.glb`);
      // @ts-ignore
      const ma = ga.scene;
      return ma;
    case "Helena":
      const gh = await loader.loadAsync(`${base}/models/helena.glb`);
      const mh = gh.scene.children[0] as Mesh<BufferGeometry, Material>;
      return mh;
    case "Sabine":
      const gs = await loader.loadAsync(`${base}/models/sabine.glb`);
      // @ts-ignore
      const ms = gs.scene;
      return ms;
    case "Luis":
      const gl = await loader.loadAsync(`${base}/models/luis.glb`);
      const ml = gl.scene.children[0] as Mesh<BufferGeometry, Material>;
      return ml;
    case "Nicole":
      const gn = await loader.loadAsync(`${base}/models/nicole.glb`);
      const mn = gn.scene.children[0] as Mesh<BufferGeometry, Material>;
      return mn;    
    case "Julian":
      const gj = await loader.loadAsync(`${base}/models/julian.glb`);
      const mj = gj.scene.children[0] as Mesh<BufferGeometry, Material>;
      return mj;    
    case "Jana":
      const gja = await loader.loadAsync(`${base}/models/jana.glb`);
      const mja = gja.scene.children[0] as Mesh<BufferGeometry, Material>;
      return mja;    
    case "Joschka":
      const gjo = await loader.loadAsync(`${base}/models/joschka.glb`);
      // @ts-ignore
      const mjo = gjo.scene;
      return mjo;
    case "Inge":
      const gi = await loader.loadAsync(`${base}/models/inge.glb`);
      const mi = gi.scene.children[0] as Mesh<BufferGeometry, Material>;
      return mi;
    case "Lucia":
      const glu = await loader.loadAsync(`${base}/models/lucia.glb`);
      const mlu = glu.scene.children[0] as Mesh<BufferGeometry, Material>;
      return mlu;
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
      return { 
        source: 'https://opengameart.org/content/interstellar-skybox-png',
        textures: [
        `${base}/textures/interstellar/interstellar_ft.jpg`,
        `${base}/textures/interstellar/interstellar_bk.jpg`,
        `${base}/textures/interstellar/interstellar_up.jpg`,
        `${base}/textures/interstellar/interstellar_dn.jpg`,
        `${base}/textures/interstellar/interstellar_rt.jpg`,
        `${base}/textures/interstellar/interstellar_lt.jpg`,
      ]};
    case "brown_clouds":
      return { 
        source: 'https://opengameart.org/content/cloudy-skyboxes',
        textures: [
        `${base}/textures/brown_clouds/browncloud_ft.jpg`,
        `${base}/textures/brown_clouds/browncloud_bk.jpg`,
        `${base}/textures/brown_clouds/browncloud_up.jpg`,
        `${base}/textures/brown_clouds/browncloud_dn.jpg`,
        `${base}/textures/brown_clouds/browncloud_rt.jpg`,
        `${base}/textures/brown_clouds/browncloud_lf.jpg`,
      ]};
    case "blue_clouds":
      return { 
        source: 'https://opengameart.org/content/cloudy-skyboxes',
        textures: [
        `${base}/textures/blue_clouds/bluecloud_ft.jpg`,
        `${base}/textures/blue_clouds/bluecloud_bk.jpg`,
        `${base}/textures/blue_clouds/bluecloud_up.jpg`,
        `${base}/textures/blue_clouds/bluecloud_dn.jpg`,
        `${base}/textures/blue_clouds/bluecloud_rt.jpg`,
        `${base}/textures/blue_clouds/bluecloud_lf.jpg`,
      ]};
    case "asteroids":
      return { 
        source: 'https://opengameart.org/content/xonotic-skyboxes',
        textures: [
        `${base}/textures/asteroids/asteroids_ft.jpg`,
        `${base}/textures/asteroids/asteroids_bk.jpg`,
        `${base}/textures/asteroids/asteroids_up.jpg`,
        `${base}/textures/asteroids/asteroids_dn.jpg`,
        `${base}/textures/asteroids/asteroids_rt.jpg`,
        `${base}/textures/asteroids/asteroids_lf.jpg`,
      ]};
    case "nebulae":
      return { 
        source: 'https://opengameart.org/content/xonotic-skyboxes',
        textures: [
        `${base}/textures/nebulae/nebulae_ft.jpg`,
        `${base}/textures/nebulae/nebulae_bk.jpg`,
        `${base}/textures/nebulae/nebulae_up.jpg`,
        `${base}/textures/nebulae/nebulae_dn.jpg`,
        `${base}/textures/nebulae/nebulae_rt.jpg`,
        `${base}/textures/nebulae/nebulae_lf.jpg`,
      ]};
    case "polluted":
      return { 
        source: 'https://opengameart.org/content/xonotic-skyboxes',
        textures: [
        `${base}/textures/polluted/polluted_earth_ft.jpg`,
        `${base}/textures/polluted/polluted_earth_bk.jpg`,
        `${base}/textures/polluted/polluted_earth_up.jpg`,
        `${base}/textures/polluted/polluted_earth_dn.jpg`,
        `${base}/textures/polluted/polluted_earth_rt.jpg`,
        `${base}/textures/polluted/polluted_earth_lf.jpg`,
      ]};
    case "sunset":
      return { 
        source: 'https://opengameart.org/content/xonotic-skyboxes',
        textures: [
        `${base}/textures/sunset/distant_sunset_ft.jpg`,
        `${base}/textures/sunset/distant_sunset_bk.jpg`,
        `${base}/textures/sunset/distant_sunset_up.jpg`,
        `${base}/textures/sunset/distant_sunset_dn.jpg`,
        `${base}/textures/sunset/distant_sunset_rt.jpg`,
        `${base}/textures/sunset/distant_sunset_lf.jpg`,
      ]};
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
      return {
        source: 'https://pixabay.com/music/ambient-documentary-11052/',
        local: `${base}/audio/documentary-technology.mp3`
      };
    case "penguin":
      return {
        source: 'https://pixabay.com/music/upbeat-penguinmusic-modern-chillout-future-calm-12641/',
        local: `${base}/audio/penguinmusic.mp3`
      };
    case "lofi":
      return {
        source: 'https://pixabay.com/music/beats-lofi-study-112191/',
        local: `${base}/audio/lofi-study.mp3`
      };
    case "lifelike":
      return {
        source: 'https://pixabay.com/music/future-bass-lifelike-126735/',
        local: `${base}/audio/lifelike.mp3`
      };
    case "tech":
      return {
        source: 'https://pixabay.com/music/beautiful-plays-documentary-technology-124111/',
        local: `${base}/audio/documentary-11052.mp3`
      };
    case "space":
      return {
        source: 'https://pixabay.com/music/beats-space-age-10714/',
        local: `${base}/audio/space-age-10714.mp3`
      };
    default:
      throw new Error(`Unknown song: ${name}`);
  }
}
