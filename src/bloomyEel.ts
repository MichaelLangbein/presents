import { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, Vector3, Vector2, DepthTexture, DepthFormat, UnsignedShortType } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_postprocessing_godrays.html
// import { GodRaysFakeSunShader, GodRaysDepthMaskShader, GodRaysCombineShader, GodRaysGenerateShader } from "three/examples/jsm/shaders/GodRaysShader";
// import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
// import { GlitchPass } from "three/examples/jsm/postprocessing/GlitchPass";
import { AfterimagePass } from "three/examples/jsm/postprocessing/AfterimagePass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
// @ts-ignore
import { RenderPixelatedPass } from "three/examples/jsm/postprocessing/RenderPixelatedPass.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ElectricEelPass } from "./utils/ElectricEel";
import { hsl } from "d3-color";
import "./style.css";

// https://stackoverflow.com/questions/65098657/three-js-post-processing-how-to-keep-depth-texture-for-multiple-passes



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
  
  const url = "https://michaellangbein.github.io/presents//documentary-technology.mp3";
  let musicBuffer: AudioBuffer;
  fetch(url).then(data => {
      data.arrayBuffer().then(rawData => {
          ctx.decodeAudioData(rawData).then(decoded => {
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

  const camera = new PerspectiveCamera(45, canvas.width / canvas.height, 0.01, 100);
  scene.add(camera);
  camera.position.set(0, 1, 2);
  camera.lookAt(new Vector3(0, 0, 0));

  const renderer = new WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    depth: true,
  });

  const controls = new OrbitControls(camera, renderer.domElement);

  const composer = new EffectComposer(renderer);
  composer.renderTarget1.depthTexture = new DepthTexture(canvas.width,canvas.height);
  composer.renderTarget1.depthTexture.format = DepthFormat;
  composer.renderTarget1.depthTexture.type = UnsignedShortType;
  composer.renderTarget1.stencilBuffer = false;
  composer.renderTarget2.depthTexture = new DepthTexture(canvas.width,canvas.height);
  composer.renderTarget2.depthTexture.format = DepthFormat;
  composer.renderTarget2.depthTexture.type = UnsignedShortType;
  composer.renderTarget2.stencilBuffer = false;

  composer.addPass(new RenderPass(scene, camera));
  const eel = new ElectricEelPass(canvas.width,canvas.height,camera.near,camera.far);
  composer.addPass(eel);
  // composer.addPass(new GlitchPass());
  // composer.addPass(shaderPass);
  // composer.addPass(new RenderPixelatedPass(2, scene, camera));
  // composer.addPass(new GlitchPass());
  composer.addPass(new UnrealBloomPass(new Vector2(2, 2), 3, 1, 0.2));
  composer.addPass(new AfterimagePass());

  const light = new AmbientLight();
  scene.add(light);

  const loader = new GLTFLoader();
  const model = await loader.loadAsync("https://michaellangbein.github.io/presents/luis.glb");
  scene.add(model.scene);
  model.scene.position.set(0, 0, 0);
  model.scene.scale.set(1, 1, 1);
  model.scene.lookAt(camera.position);



  let i = 0;
  function loop(fps: number, inMs: number) {
    setTimeout(() => {
      const start = new Date().getTime();

      // animation
      i += 1;
      let amplitude = 0;
      if (globalMusicBufferData && musicStartTime) {
        const timeInSongMs = start - musicStartTime;
        amplitude = globalMusicBufferData[20 * timeInSongMs];
      }
      model.scene.rotateY(0.001);
      const color = hsl(i % 360, 1, 0.5).rgb();
      const rgbcolor: [number, number, number] = [
        color.r / 256,
        color.g / 256,
        color.b / 256,
      ];
      // eel.setParas(rgbcolor, 1.0, 0.0005, 0.001, 0.3);
      // eel.setParas(rgbcolor, 1.0, 0.0005, amplitude * 0.1, 0.3);
      eel.setParas(rgbcolor, 1.0 - amplitude, 0.00025, 0.001, 0.3);
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
