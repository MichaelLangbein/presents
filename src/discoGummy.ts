import { hsl } from "d3-color";
import { Scene, BufferGeometry, PerspectiveCamera, Vector3, WebGLRenderer, AmbientLight, CubeTextureLoader, PointLight, Vector2, Material, Mesh, CubeRefractionMapping, MeshPhongMaterial, Color, MixOperation, PlaneGeometry, ShaderMaterial, CustomBlending, AddEquation, OneMinusSrcAlphaFactor, SrcAlphaFactor, SrcColorFactor, MinEquation, MaxEquation, SrcAlphaSaturateFactor } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
// import { HalftonePass } from 'three/examples/jsm/postprocessing/HalftonePass';
import './style.css';
import { SoundMgmt } from "./utils/Sound";


async function audio() {
  const player = new SoundMgmt();
  await player.loadFromUrl("./penguinmusic.mp3"); // https://michaellangbein.github.io/presents
  const playButton = document.getElementById("playMusic") as HTMLButtonElement;
  playButton.addEventListener("click", () => {
    if (player.isPlaying()) {
      player.stop();
      playButton.innerHTML = "Play music";
    } else {
      player.play(() => playButton.innerHTML = "Play music");
      playButton.innerHTML = "Stop music";
    }
  });
  return player;
}



async function main() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  canvas.width = canvas.clientWidth; 
  canvas.height = canvas.clientHeight;
  const player = await audio();

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


  const model2 = new Mesh(model.geometry, new MeshPhongMaterial({
    // color: 0xff6600, envMap: reflectionCube, combine: MixOperation, reflectivity: 0.3,
    // color: 0xffee00, envMap: reflectionCube,
    color: 0xffee00, envMap: refractionCube, refractionRatio: 0.5,
    opacity: 0.6, transparent: true
  }));
  scene.add(model2);
  model2.position.set(0, 0, 0);
  model2.lookAt(camera.position);


  const background = new Mesh(new PlaneGeometry(30, 30, 2, 2), new ShaderMaterial({
    uniforms: {
      uTime: { value: Math.random() }
    },
    vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
    `,
    fragmentShader: `
              
              //
              // Description : Array and textureless GLSL 2D simplex noise function.
              //      Author : Ian McEwan, Ashima Arts.
              //  Maintainer : stegu
              //     Lastmod : 20110822 (ijm)
              //     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
              //               Distributed under the MIT License. See LICENSE file.
              //               https://github.com/ashima/webgl-noise
              //               https://github.com/stegu/webgl-noise
              // 
              
              vec3 mod289(vec3 x) {
                return x - floor(x * (1.0 / 289.0)) * 289.0;
              }
              
              vec2 mod289(vec2 x) {
                return x - floor(x * (1.0 / 289.0)) * 289.0;
              }
              
              vec3 permute(vec3 x) {
                return mod289(((x*34.0)+10.0)*x);
              }
              
              float snoise(vec2 v)
                {
                const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                                    0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                                  -0.577350269189626,  // -1.0 + 2.0 * C.x
                                    0.024390243902439); // 1.0 / 41.0
              // First corner
                vec2 i  = floor(v + dot(v, C.yy) );
                vec2 x0 = v -   i + dot(i, C.xx);
              
              // Other corners
                vec2 i1;
                //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
                //i1.y = 1.0 - i1.x;
                i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                // x0 = x0 - 0.0 + 0.0 * C.xx ;
                // x1 = x0 - i1 + 1.0 * C.xx ;
                // x2 = x0 - 1.0 + 2.0 * C.xx ;
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
              
              // Permutations
                i = mod289(i); // Avoid truncation effects in permutation
                vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                  + i.x + vec3(0.0, i1.x, 1.0 ));
              
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                m = m*m ;
                m = m*m ;
              
              // Gradients: 41 points uniformly over a line, mapped onto a diamond.
              // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)
              
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;
              
              // Normalize gradients implicitly by scaling m
              // Approximation of: m *= inversesqrt( a0*a0 + h*h );
                m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
              
              // Compute final noise value at P
                vec3 g;
                g.x  = a0.x  * x0.x  + h.x  * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
              }

              varying vec2 vUv;
              uniform float uTime;

              float fractalNoise(vec2 p, float t) {
                float noise = 0.6 * snoise( 5.0 * p * t)
                            + 0.3 * snoise(15.0 * p * t)
                            + 0.1 * snoise(60.0 * p * t);
                return noise;
              }

              void main() {
                float r = fractalNoise(vUv, sin(uTime) * snoise(vUv));
                gl_FragColor = vec4(r, r, r, 0.1);
              }

    `
  }));
  background.material.blending = CustomBlending;
  background.material.blendEquation = MaxEquation;
  background.material.blendSrc = SrcAlphaSaturateFactor;
  background.material.blendDst = SrcColorFactor;
  camera.add(background);
  background.translateZ(-30);
  scene.add(camera);



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
      const amplitude = player.getCurrentAmplitude();
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
      background.material.uniforms.uTime.value = 0.0001 * i * (1000 / fps);
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
