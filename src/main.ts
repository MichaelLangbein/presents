import { AmbientLight, BoxGeometry, DepthFormat, DepthTexture, Mesh, MeshLambertMaterial, MeshPhongMaterial, OrthographicCamera, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, SphereGeometry, UnsignedShortType, Vector3, WebGLRenderer, WebGLRenderTarget } from 'three';


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

const renderPassTarget = new WebGLRenderTarget(canvas.width, canvas.height);
renderPassTarget.depthTexture = new DepthTexture(canvas.width, canvas.height);
renderPassTarget.depthTexture.format = DepthFormat;
renderPassTarget.depthTexture.type = UnsignedShortType;
renderPassTarget.stencilBuffer = false;
renderer.setRenderTarget(renderPassTarget);

const renderCamera = new PerspectiveCamera(50, canvas.width / canvas.height, 0.01, 5);
renderCamera.position.set(0, 1.8, 3);
renderCamera.lookAt(new Vector3(0, 0, 0));

const light = new AmbientLight();
renderScene.add(light);

const box = new Mesh(new BoxGeometry(2, 2, 2), new MeshPhongMaterial({ color: `rgb(125, 50, 50)` }));
renderScene.add(box);


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

const rainCam = new OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
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

        float readDepth( sampler2D depthSampler, vec2 coord ) {
            float fragCoordZ = texture2D( depthSampler, coord ).x;
            float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
            return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
        }

        float random (vec2 st) {
            return fract(sin(dot(st.xy,
                                 vec2(12.9898,78.233)))*
                43758.5453123);
        }

        void main() {
            float noise = texture2D( tNoise, vUv ).r;
            float depth = readDepth( tDepth, vUv );
            float z = max(noise, depth);

            gl_FragColor.rgb = vec3(z);
            gl_FragColor.a = 1.0;
        }
    `
});
const rainScreen = new Mesh(new PlaneGeometry(2, 2, 1, 1), rainScreenMaterial);
rainScene.add(rainScreen);
rainScreen.lookAt(rainCam.position);




/************************************************************************
 *              Merging                                                 *
 ************************************************************************/

const mergeScene = new Scene();
const mergeCam = new OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
mergeCam.position.set(0, 0, -1);

const mergeScreen = new Mesh(new PlaneGeometry(2, 2, 1, 1), new ShaderMaterial({

}));
mergeScene.add(mergeScreen);
mergeScreen.lookAt(mergeCam.position);


/************************************************************************
 *              Looping                                                 *
 ************************************************************************/


function loop(fps: number, inMs: number) {
    setTimeout(() => {
        const start = new Date().getTime();

        // animation
        box.rotateY(0.01);

        // render scene to buffer
        renderer.setRenderTarget(renderPassTarget);
        renderer.render(renderScene, renderCamera);

        // render noise to buffer
        renderer.setRenderTarget(noiseRenderTarget);
        noiseScreen.material.uniforms.utime.value += (1000 / fps);
        renderer.render(noiseScene, noiseCam);

        // // render rain buffer
        // renderer.setRenderTarget(rainPassTarget);
        // rainScreen.material.uniforms.tNoise.value = noiseRenderTarget.texture;
        // rainScreen.material.uniforms.tDepth.value = renderPassTarget.depthTexture;
        // rainScreen.material.uniforms.tLast.value = rainPassTarget.texture;
        // renderer.render(rainScene, rainCam);

        // render to canvas
        renderer.setRenderTarget(null);
        rainScreen.material.uniforms.tNoise.value = noiseRenderTarget.texture;
        rainScreen.material.uniforms.tDepth.value = renderPassTarget.depthTexture;
        renderer.render(rainScene, rainCam);

        const end = new Date().getTime();
        const delta = end - start;
        const msLeft = (1000 / fps) - delta;
        loop(fps, msLeft);
    }, inMs);
}

loop(30, 0);

