import { AmbientLight, BoxGeometry, DepthFormat, DepthTexture, Mesh, 
    MeshPhongMaterial, OrthographicCamera, PerspectiveCamera, 
    PlaneGeometry, Scene, ShaderMaterial, UnsignedShortType, 
    Vector3, WebGLRenderer, WebGLRenderTarget } from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { hsl } from 'd3-color';



const canvas = document.getElementById('canvas') as HTMLCanvasElement;
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;


const renderer = new WebGLRenderer({
    alpha: true,
    antialias: true,
    depth: true,
    canvas: canvas
});
if ( renderer.capabilities.isWebGL2 === false && renderer.extensions.has( 'WEBGL_depth_texture' ) === false ) {
    console.error(`D'oh!`);
}

/************************************************************************
 *              Render pass                                             *
 ************************************************************************/

const renderScene = new Scene();

const faceRenderTarget = new WebGLRenderTarget(canvas.width, canvas.height);
faceRenderTarget.depthTexture = new DepthTexture(canvas.width, canvas.height);
faceRenderTarget.depthTexture.format = DepthFormat;
faceRenderTarget.depthTexture.type = UnsignedShortType;
faceRenderTarget.stencilBuffer = false;
renderer.setRenderTarget(faceRenderTarget);

const renderCamera = new PerspectiveCamera(50, canvas.width / canvas.height, 0.01, 4);
renderCamera.position.set(0, 1.8, 3);
renderCamera.lookAt(new Vector3(0, 0, 0));

const light = new AmbientLight();
renderScene.add(light);

// const box = new Mesh(new BoxGeometry(2, 2, 2), new MeshPhongMaterial({ color: `rgb(125, 50, 50)` }));
// renderScene.add(box);
const loader = new GLTFLoader();
const andreas = await loader.loadAsync("/andreas.glb");
renderScene.add(andreas.scene);
andreas.scene.position.set(0, 0, 0);
andreas.scene.scale.set(4, 4, 6);
andreas.scene.lookAt(renderCamera.position);

/************************************************************************
 *              Noise                                                   *
 ************************************************************************/

const noiseScene = new Scene();

// Note: could really just share that noise cam with the postCam
const noiseCam = new OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
noiseCam.position.set(0, 0, -1);
noiseCam.lookAt(0, 0, 0);

const noiseScreen = new Mesh(new PlaneGeometry(2, 2, 1, 1), new ShaderMaterial({
     uniforms: {
         utime: { value: 0.0 },
     },
     vertexShader: `
         varying vec2 vUv;
         void main() {
             vUv = uv;
             gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
         }
     `,
     fragmentShader: `
         varying vec2 vUv;
         uniform float utime;
         
         float random (vec2 st) {
            return fract(sin(dot(st.xy,
                                 vec2(12.9898,78.233)))*
                43758.5453123);
        }

        // 2D Noise based on Morgan McGuire @morgan3d
        // https://www.shadertoy.com/view/4dS3Wd
        float perlin (in vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);

            // Four corners in 2D of a tile
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));

            // Smooth Interpolation

            // Cubic Hermine Curve.  Same as SmoothStep()
            vec2 u = f*f*(3.0-2.0*f);
            // u = smoothstep(0.,1.,f);

            // Mix 4 corners percentages
            return mix(a, b, u.x) +
                    (c - a)* u.y * (1.0 - u.x) +
                    (d - b) * u.x * u.y;
        }

         void main() {
            float n = perlin(vUv * sin(utime * 0.001));
            gl_FragColor = vec4(n, n, n, 1);
         }
     `
}));
noiseScreen.lookAt(noiseCam.position);
noiseScene.add(noiseScreen);
 
const noiseRenderTarget = new WebGLRenderTarget(canvas.width, canvas.height);



/************************************************************************
 *              Rain                                                    *
 ************************************************************************/

const rainScene = new Scene();

const rainCam = new OrthographicCamera(-1, 1, 1, -1, 0.01, 1);
rainScene.add(rainCam);
rainCam.position.set(0, 0, -1);
rainCam.lookAt(new Vector3(0, 0, 0));

const rainScreenMaterial = new ShaderMaterial({
    uniforms: {
        cameraNear: { value: renderCamera.near },
        cameraFar: { value: renderCamera.far },
        tNoise: { value: null },
        tDepth: { value: null },
        tLast: { value: null },
        uRandom: { value: 0.42 },
        uDeltaT: { value: 0.0 },
        uParticleColor: { value: [1, 0, 1] }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        #include <packing>

        varying vec2 vUv;
        uniform sampler2D tNoise;
        uniform sampler2D tDepth;
        uniform sampler2D tLast;
        uniform float cameraNear;
        uniform float cameraFar;
        uniform float uDeltaT;
        uniform float uRandom;
        uniform vec3 uParticleColor;

        float readDepth( sampler2D depthSampler, vec2 coord ) {
            float fragCoordZ = texture2D( depthSampler, coord ).x;
            float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
            return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
        }

        float random (vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
        }

        float SPEEDFACTOR = 0.000001;
        float FADERATE = 0.9999999;
        float SPAWNCHANCE = 0.0006;

        void main() {

            float delta = 0.005;

            float noise      = texture2D( tNoise, vUv ).r;
            float depth      = readDepth( tDepth, vUv );
            float proximity  = 1.0 - depth;
            float z          = max(noise, proximity);

            float noiseUp      = texture2D( tNoise, vUv + vec2(0.0, - delta) ).r;
            float depthUp      = readDepth( tDepth, vUv + vec2(0.0, - delta) );
            float proximityUp  = 1.0 - depthUp;
            float zUp          = max(noiseUp, proximityUp);

            float noiseRight     = texture2D( tNoise, vUv + vec2(delta, 0.0) ).r;
            float depthRight     = readDepth( tDepth, vUv + vec2(delta, 0.0) );
            float proximityRight = 1.0 - depthRight;
            float zRight         = max(noiseRight, proximityRight);

            vec2 slope = vec2(
                -(zRight - z) / delta,
                (zUp    - z) / delta
            );
            vec2 speed = slope / length(slope) * 0.1;

            vec2 samplePoint = vUv - speed * uDeltaT * SPEEDFACTOR;
            samplePoint = mod(samplePoint, 1.0);  // if on edge: sampling from other side of texture
            vec4 color = texture2D(tLast, samplePoint);

            // fade out
            color = color * FADERATE;

            // making streaks disappear after a while
            if (color.x < 0.0001) {  
                color = vec4(0.0, 0.0, 0.0, 0.0);
            }

            // disappear if no movement
            if (length(speed) < 0.001) {
                color = vec4(0.0, 0.0, 0.0, 0.0);
            }

            // spawn new ones
            // ... but only if there is any speed here
            if (length(speed) > 0.01) {
                float randVal = random(vUv * abs(sin(uRandom)) * 0.01);
                float distanceToCenter = length(vUv - vec2(0.5, 0.5));
                if (randVal > (1.0 - SPAWNCHANCE)) {  // spawn
                    color = vec4(uParticleColor.xyz, 1.0);
                }
            }

            gl_FragColor = vec4(color.xyz, 1);
        }
    `
});
const rainScreen = new Mesh(new PlaneGeometry(2, 2, 1, 1), rainScreenMaterial);
rainScene.add(rainScreen);
rainScreen.lookAt(rainCam.position);

const rainRenderTarget1 = new WebGLRenderTarget(canvas.width, canvas.height);
const rainRenderTarget2 = new WebGLRenderTarget(canvas.width, canvas.height);



/************************************************************************
 *              Merging                                                 *
 ************************************************************************/

const mergeScene = new Scene();
const mergeCam = new OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
mergeCam.position.set(0, 0, -1);
mergeCam.lookAt(new Vector3(0, 0, 0));

const mergeScreen = new Mesh(new PlaneGeometry(2, 2, 1, 1), new ShaderMaterial({
    uniforms: {
        tDiffuse: { value: null },
        tRain: { value: null },
        uFraction: { value: 0.5 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tRain;
        uniform float uFraction;

        varying vec2 vUv;
        void main() {
            vec4 img = texture2D( tDiffuse, vUv );
            vec4 rain = texture2D( tRain, vUv );
            gl_FragColor = uFraction * rain + (1.0 - uFraction) * img;
        }
        `
}));
mergeScene.add(mergeScreen);
mergeScreen.lookAt(mergeCam.position);


/************************************************************************
 *              Looping                                                 *
 ************************************************************************/


let i = 0;
function loop(fps: number, inMs: number) {
    setTimeout(() => {
        const start = new Date().getTime();

        // animation
        i += 1;
        const color = hsl(i % 360, 1, 0.5).rgb();
        // const rgbcolor = [color.r / 256, color.g / 256, color.b / 256];
        const rgbcolor = [1, 1, 1]

        // render scene to buffer
        renderer.setRenderTarget(faceRenderTarget);
        renderer.render(renderScene, renderCamera);

        // render noise to buffer
        renderer.setRenderTarget(noiseRenderTarget);
        // noiseScreen.material.uniforms.utime.value += (1000 / fps);
        renderer.render(noiseScene, noiseCam);

        // render rain to buffer
        const rainInput = i % 2 === 0 ? rainRenderTarget1 : rainRenderTarget2;
        const rainOutput = i % 2 === 0 ? rainRenderTarget2 : rainRenderTarget1;
        renderer.setRenderTarget(rainOutput);
        rainScreen.material.uniforms.tNoise.value = noiseRenderTarget.texture;
        rainScreen.material.uniforms.tDepth.value = faceRenderTarget.depthTexture;
        rainScreen.material.uniforms.tLast.value = rainInput.texture;
        rainScreen.material.uniforms.uRandom.value = Math.random();
        rainScreen.material.uniforms.uDeltaT.value += (1000 / fps);
        rainScreen.material.uniforms.uParticleColor.value = rgbcolor;
        renderer.render(rainScene, rainCam);

        // render to canvas
        renderer.setRenderTarget(null);
        mergeScreen.material.uniforms.tDiffuse.value = faceRenderTarget.texture;
        mergeScreen.material.uniforms.tRain.value = rainOutput.texture;
        mergeScreen.material.uniforms.uFraction.value = 0.7;
        renderer.render(mergeScene, mergeCam);

        const end = new Date().getTime();
        const delta = end - start;
        const msLeft = (1000 / fps) - delta;
        loop(fps, msLeft);
    }, inMs);
}

loop(30, 0);

