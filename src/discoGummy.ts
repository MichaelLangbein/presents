import { hsl } from "d3-color";
import { Scene, BufferGeometry, PerspectiveCamera, Vector3, WebGLRenderer, AmbientLight, CubeTextureLoader, PointLight, Vector2, Material, Mesh, CubeRefractionMapping, MeshPhongMaterial, Color } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
// import { HalftonePass } from 'three/examples/jsm/postprocessing/HalftonePass';
import './style.css';



let globalMusicBufferData: Float32Array | undefined = undefined;
let musicStartTime: number;
function audio() {
  const humanHearingMaxRate = 20_000; // Hz
  const sampleRate = 2 * humanHearingMaxRate; // because signal reconstruction

  // overall context
  const ctx = new AudioContext({ sampleRate });

  // global volume control
  const gainNode = ctx.createGain();
  const gainValue = 0.05;
  const validFrom = 0;
  gainNode.gain.setValueAtTime(gainValue, validFrom);
  gainNode.connect(ctx.destination);

  const url =
    "https://michaellangbein.github.io/presents//documentary-technology.mp3";
  let musicBuffer: AudioBuffer;
  fetch(url).then((data) => {
    data.arrayBuffer().then((rawData) => {
      ctx.decodeAudioData(rawData).then((decoded) => {
        musicBuffer = decoded;
        console.log("music data downloaded");
        globalMusicBufferData = new Float32Array(musicBuffer.getChannelData(0));
      });
    });
  });

  const playButton = document.getElementById("playMusic") as HTMLButtonElement;
  playButton.addEventListener("click", () => {
    const musicSource = ctx.createBufferSource();
    musicSource.buffer = musicBuffer;
    musicSource.playbackRate.setValueAtTime(0.5, 0);

    musicSource.connect(gainNode);
    musicSource.start();
    musicStartTime = new Date().getTime();
  });
}

audio();

async function main() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;

  const scene = new Scene();

  const camera = new PerspectiveCamera( 45, canvas.width / canvas.height, 0.01, 100);
  scene.add(camera);
  camera.position.set(0, 1, 4);
  camera.lookAt(new Vector3(0, 0, 0));

  const renderer = new WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, depth: true });
  renderer.setPixelRatio( window.devicePixelRatio );

  const controls = new OrbitControls(camera, renderer.domElement);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new Vector2(2, 2), 0.45, 0.5, 0.5);
  composer.addPass(bloom);
    // composer.addPass(new HalftonePass(canvas.width, canvas.height, {
    //     shape: 1,
    //     radius: 4,
    //     rotateR: Math.PI / 12,
    //     rotateB: Math.PI / 12 * 2,
    //     rotateG: Math.PI / 12 * 3,
    //     scatter: 0,
    //     blending: 1,
    //     blendingMode: 1,
    //     greyscale: false,
    //     disable: false
    // }));

  const path = "brown_clouds/browncloud_";
  const format = ".jpg";
  const urls = [
      path + "ft" + format,
      path + "bk" + format,
      path + "up" + format,
      path + "dn" + format,
      path + "rt" + format,
      path + "lf" + format,
  ];
  const reflectionCube = new CubeTextureLoader().load(urls);
  const refractionCube = new CubeTextureLoader().load(urls);
  reflectionCube.mapping = CubeRefractionMapping;
  scene.background = reflectionCube;


  const loader = new GLTFLoader();
  const group = await loader.loadAsync("https://michaellangbein.github.io/presents/helena.glb");
  const model = group.scene.children[0] as Mesh<BufferGeometry, Material>;
  scene.add(model);
  model.position.set(0, 0, 0);
  model.scale.set(1, 1, 1);
  model.lookAt(camera.position);

//   const cubeMaterial3 = new THREE.MeshLambertMaterial( { color: 0xff6600, envMap: reflectionCube, combine: THREE.MixOperation, reflectivity: 0.3 } );
//   const cubeMaterial2 = new THREE.MeshLambertMaterial( { color: 0xffee00, envMap: refractionCube, refractionRatio: 0.95 } );
//   const cubeMaterial1 = new THREE.MeshLambertMaterial( { color: 0xffffff, envMap: reflectionCube } );

  const model2 = new Mesh(model.geometry, new MeshPhongMaterial({
    // color: 0xff6600, envMap: reflectionCube, combine: MixOperation, reflectivity: 0.3,
    // color: 0xffee00, envMap: reflectionCube,
    color: 0xffee00, envMap: refractionCube, refractionRatio: 0.5,
    opacity: 0.5, transparent: true
  }));
  scene.add(model2);
  model2.position.set(0, 0, 0);
  model2.lookAt(camera.position);




  const ambient = new AmbientLight(0xffffff);
  scene.add(ambient);
  const pointLight = new PointLight(0xffffff, 2);
  scene.add(pointLight);
  pointLight.position.set(0, 0, 3);

  let i = 0;
  function loop(fps: number, inMs: number) {
    setTimeout(() => {
      const start = new Date().getTime();



      i += 1;
      let amplitude = 0;
      if (globalMusicBufferData && musicStartTime) {
        const timeInSongMs = start - musicStartTime;
        amplitude = globalMusicBufferData[20 * timeInSongMs];
      }
    //   bloom.strength = amplitude * 0.1;
      model2.material.refractionRatio = amplitude * 0.1;
    //   model2.material.color = new Color(hsl(amplitude * 36, 0.5, 0.5).formatHex());
      model.rotateY(0.001);
      model2.rotateY(0.001);
      const theta = i % 360;
      const xNew = 3 * Math.sin(theta * 2.0 * Math.PI / 360);
      const yNew = 3 * Math.cos(theta * 2.0 * Math.PI / 360);
      pointLight.position.set(xNew, yNew, 0);
      pointLight.color = new Color(hsl(amplitude * 360, 0.5, 0.5).formatHex());
      controls.update();

      composer.render();



      const end = new Date().getTime();
      const delta = end - start;
      const msLeft = 1000 / fps - delta;
      if (msLeft < 0.2 * (1000 / fps))
        console.log(`Little time left: ${msLeft} of ${1000 / fps}`);
      loop(fps, msLeft);
    }, inMs);
  }

  loop(30, 0);
}

main();
