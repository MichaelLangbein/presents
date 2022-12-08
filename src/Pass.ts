import { AmbientLight, BufferGeometry, Camera, Color, Group, Mesh, OrthographicCamera,
    PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial } from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export interface Pass {
    update: (deltaT: number, args: object) => void;
    getScene: () => Scene;
    getCam: () => Camera;
}


export const defaultVertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const defaultFragmentShader = `
    varying vec2 vUv;
    void main() {
        gl_FragColor = vec4(vUv.xy, 0.0, 1);
    }
`;

export class BasePass implements Pass {
    protected scene: Scene;
    protected camera: Camera;
    protected screen: Mesh<BufferGeometry, ShaderMaterial>;

    constructor(
        vertexShader = defaultVertexShader,
        fragmentShader = defaultFragmentShader,
        uniforms =  {}
    ) {
        
        this.scene = new Scene();
        this.scene.background = new Color('#000');
        
        this.camera = new OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
        this.camera.position.set(0, 0, -1);
        this.camera.lookAt(0, 0, 0);

        this.screen = new Mesh(new PlaneGeometry(2, 2, 1, 1), new ShaderMaterial({
            uniforms, vertexShader, fragmentShader
        }));

        this.screen.lookAt(this.camera.position);
        this.scene.add(this.screen);
    }

    update(deltaT: number, args: any) {
        for (const key in args) {
            const val = args[key];
            this.screen.material.uniforms[key].value = val;
        }
    }

    getScene() {
        return this.scene;
    }

    getCam() {
        return this.camera;
    }
}


export class BasePerspectivePass implements Pass {
    protected scene: Scene;
    protected camera: PerspectiveCamera;
    protected controls: OrbitControls;

    constructor(protected width: number, protected height: number, protected model: Group, domElement: any) {
        
        this.scene = new Scene();
        this.scene.background = new Color('#000');
        
        this.camera = new PerspectiveCamera(50, width/innerHeight, 0.01, 100);
        this.camera.position.set(0, 0, -1);
        this.camera.lookAt(0, 0, 0);

        this.controls = new OrbitControls( this.camera, domElement );


        const light = new AmbientLight();
        this.scene.add(light);

        this.scene.add(model);
        model.position.set(0, 0, 0);
        model.lookAt(this.camera.position);
    }

    update(deltaT: number, args: any) {
        this.controls.update();
    }

    getScene() {
        return this.scene;
    }

    getCam(): PerspectiveCamera {
        return this.camera;
    }
}


export class NoisePass extends BasePass {
    constructor() {
        super(/*glsl*/`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `, /*glsl*/`
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
        `, {
            utime: { value: 0.0 }
        });
    }
}


export class RainPass extends BasePass {
    constructor(width: number, height: number, cameraNear: number, cameraFar: number) {
        super(/*glsl*/`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `, /*glsl*/`
            #include <packing>

            varying vec2 vUv;
            uniform sampler2D tNoise;
            uniform sampler2D tDepth;
            uniform sampler2D tLast;
            uniform float cameraNear;
            uniform float cameraFar;
            uniform float uDeltaT;
            uniform float uDeltaX;
            uniform float uDeltaY;
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
            float FADERATE = 0.999999;
            float SPAWNCHANCE = 0.0005;

            void main() {

                float noise      = texture2D( tNoise, vUv ).r;
                float depth      = readDepth( tDepth, vUv );
                float proximity  = 1.0 - depth;
                float z          = max(noise, proximity);

                float noiseUp      = texture2D( tNoise, vUv + vec2(0.0, - uDeltaY) ).r;
                float depthUp      = readDepth( tDepth, vUv + vec2(0.0, - uDeltaY) );
                float proximityUp  = 1.0 - depthUp;
                float zUp          = max(noiseUp, proximityUp);

                float noiseRight     = texture2D( tNoise, vUv + vec2(uDeltaX, 0.0) ).r;
                float depthRight     = readDepth( tDepth, vUv + vec2(uDeltaX, 0.0) );
                float proximityRight = 1.0 - depthRight;
                float zRight         = max(noiseRight, proximityRight);

                float noiseDown      = texture2D( tNoise, vUv + vec2(0.0, + uDeltaY) ).r;
                float depthDown      = readDepth( tDepth, vUv + vec2(0.0, + uDeltaY) );
                float proximityDown  = 1.0 - depthDown;
                float zDown          = max(noiseDown, proximityDown);

                float noiseLeft     = texture2D( tNoise, vUv + vec2(-uDeltaX, 0.0) ).r;
                float depthLeft     = readDepth( tDepth, vUv + vec2(-uDeltaX, 0.0) );
                float proximityLeft = 1.0 - depthLeft;
                float zLeft         = max(noiseLeft, proximityLeft);

                vec2 slope = vec2(
                    -(zRight - zLeft) / (2.0 * uDeltaX),
                    (zUp    - zDown) / (2.0 * uDeltaY)
                );
                vec2 direction = slope / length(slope);
                vec2 speed =  (direction * 0.1);
                // vec2 randomJitter = vec2( random(vUv * abs(sin(uRandom)) * 0.01),  random(vUv * abs(cos(uRandom)) * 0.01) );
                // vec2 speed =  (direction * 0.1) + (randomJitter * 1.0);

                vec2 samplePoint = vUv - speed * uDeltaT * SPEEDFACTOR;
                samplePoint = mod(samplePoint, 1.0);  // if on edge: sampling from other side of texture
                vec4 color = texture2D(tLast, samplePoint);

                // fade out
                color = color * FADERATE;

                // disappear if no movement or if very faded
                if (length(speed) < 0.001 || color.a < 0.001) {
                    color = vec4(0.0, 0.0, 0.0, 0.0);
                }

                // spawn new ones
                // ... but only if there is any speed here
                if (length(speed) > 0.001) {
                    float randVal = random(vUv * abs(sin(uRandom)) * 0.01);
                    float distanceToCenter = length(vUv - vec2(0.5, 0.5));
                    if (randVal > (1.0 - SPAWNCHANCE)) {  // spawn
                        color = vec4(uParticleColor.xyz, 1.0);
                    }
                }


                // grow neighboring dot if own point doesn't yet have color
                if (length(speed) > 0.001 && color.a < 0.001) {
                    vec4 brightestNeighbor = vec4(0, 0, 0, 0);
                    for (float i = -2.0 * uDeltaX; i <= 2.0 * uDeltaX; i += uDeltaX) {
                        for (float j = -2.0 * uDeltaY; j <= 2.0 * uDeltaY; j += uDeltaY) {
                            vec4 spl = texture2D(tLast, vUv + vec2(i, j));
                            if (length(spl) > length(brightestNeighbor)) {
                                brightestNeighbor = spl;
                            }
                        }
                    }
                    color = 0.99 * brightestNeighbor;
                }

                gl_FragColor = color;
            }
        `, {
            cameraNear: { value: cameraNear },
            cameraFar: { value: cameraFar },
            tNoise: { value: null },
            tDepth: { value: null },
            tLast: { value: null },
            uRandom: { value: 0.42 },
            uDeltaT: { value: 0.0 },
            uParticleColor: { value: [1, 0, 1] },
            uDeltaX: { value: 1.0 / width },
            uDeltaY: { value: 1.0 / height }
        });
    }
}


export class MergingPass extends BasePass {
    constructor() {
        super(/*glsl*/`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `, /*glsl*/`
            uniform sampler2D tDiffuse;
            uniform sampler2D tRain;
            uniform float uFraction;

            varying vec2 vUv;
            void main() {
                vec4 img = texture2D( tDiffuse, vUv );
                vec4 rain = texture2D( tRain, vUv );
                gl_FragColor = uFraction * rain + (1.0 - uFraction) * img;
            }
        `, {
            tDiffuse: { value: null },
            tRain: { value: null },
            uFraction: { value: 0.5 }
        });
    }
}