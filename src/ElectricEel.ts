import { Pass } from "three/examples/jsm/postprocessing/Pass";
import { BufferGeometry, Camera, Color, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, WebGLRenderer, WebGLRenderTarget } from "three";

export class ElectricEelPass extends Pass {

    private i = 0;
    private scene: Scene;
    private camera: Camera;
    private screen: Mesh<BufferGeometry, ShaderMaterial>;
    private rainRenderTarget1: WebGLRenderTarget;
    private rainRenderTarget2: WebGLRenderTarget;

    private blendScene: Scene;
    private blendScreen: Mesh<BufferGeometry, ShaderMaterial>;

    constructor(width: number, height: number, cameraNear: number = 0.01, cameraFar: number = 100) {
        super();
        
        this.scene = new Scene();
        this.scene.background = new Color('#000');
        
        this.camera = new OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
        this.camera.position.set(0, 0, -1);
        this.camera.lookAt(0, 0, 0);

        this.screen = new Mesh(new PlaneGeometry(2, 2, 1, 1), new ShaderMaterial({
            uniforms: {
                cameraNear:     { value: cameraNear },
                cameraFar:      { value: cameraFar },
                tDepth:         { value: null },
                tLast:          { value: null },
                uRandom:        { value: 0.42 },
                uDeltaT:        { value: (1000 / 30) },
                uParticleColor: { value: [1, 0, 1] },
                uDeltaX:        { value: 1.0 / width },
                uDeltaY:        { value: 1.0 / height },
                uFadeRate:      { value: 0.99 },
                uSpeedFactor:   { value: 0.0005 },
                uSpawnChance:   { value: 0.001 },
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
                    uniform sampler2D tDepth;
                    uniform sampler2D tLast;
                    uniform float cameraNear;
                    uniform float cameraFar;
                    uniform float uDeltaT;
                    uniform float uDeltaX;
                    uniform float uDeltaY;
                    uniform float uRandom;
                    uniform float uFadeRate;
                    uniform float uSpeedFactor;
                    uniform float uSpawnChance;
                    uniform vec3 uParticleColor;

                    float readDepth( sampler2D depthSampler, vec2 coord ) {
                        float fragCoordZ = texture2D( depthSampler, coord ).x;
                        float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
                        return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
                    }

                    float random (vec2 st) {
                        return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
                    }

                    void main() {

                        float depth      = readDepth( tDepth, vUv );
                        float proximity  = 1.0 - depth;
                        float z          = proximity;

                        float depthUp      = readDepth( tDepth, vUv + vec2(0.0, - uDeltaY) );
                        float proximityUp  = 1.0 - depthUp;
                        float zUp          = proximityUp;

                        float depthRight     = readDepth( tDepth, vUv + vec2(uDeltaX, 0.0) );
                        float proximityRight = 1.0 - depthRight;
                        float zRight         = proximityRight;

                        float depthDown      = readDepth( tDepth, vUv + vec2(0.0, + uDeltaY) );
                        float proximityDown  = 1.0 - depthDown;
                        float zDown          = proximityDown;

                        float depthLeft     = readDepth( tDepth, vUv + vec2(-uDeltaX, 0.0) );
                        float proximityLeft = 1.0 - depthLeft;
                        float zLeft         = proximityLeft;

                        vec2 slope = vec2(
                            -(zRight - zLeft) / (2.0 * uDeltaX),
                            (zUp    - zDown) / (2.0 * uDeltaY)
                        );
                        vec2 direction = slope / length(slope);
                        direction += vec2(0.0, -1);
                        vec2 speed =  (direction * 0.1);

                        vec2 samplePoint = vUv - speed * uDeltaT * uSpeedFactor;
                        samplePoint = mod(samplePoint, 1.0);  // if on edge: sampling from other side of texture
                        vec4 color = texture2D(tLast, samplePoint);

                        // fade out
                        color = color * uFadeRate;

                        // disappear if no movement or if very faded
                        if (length(speed) < 0.001 || color.a < 0.001) {
                            color = vec4(0.0, 0.0, 0.0, 0.0);
                        }

                        // spawn new ones
                        // ... but only if there is any speed here
                        if (length(speed) > 0.001) {
                            float randVal = random(vUv * abs(sin(uRandom)) * 0.01);
                            float distanceToCenter = length(vUv - vec2(0.5, 0.5));
                            if (randVal > (1.0 - uSpawnChance)) {  // spawn
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
            `
        }));

        this.screen.lookAt(this.camera.position);
        this.scene.add(this.screen);

        this.rainRenderTarget1 = new WebGLRenderTarget(width, height);
        this.rainRenderTarget2 = new WebGLRenderTarget(width, height);



        this.blendScene = new Scene();
        this.blendScreen = new Mesh(new PlaneGeometry(2, 2, 1, 1), new ShaderMaterial({
            uniforms: {
                tTex1: { value: null },
                tTex2: { value: null },
                uFrac: { value: 0.5 }
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
                uniform sampler2D tTex1;
                uniform sampler2D tTex2;
                uniform float uFrac;

                void main() {
                    vec4 color1 = texture2D(tTex1, vUv);
                    vec4 color2 = texture2D(tTex2, vUv);
                    gl_FragColor = uFrac * color1 + (1.0 - uFrac) * color2;
                }
            `,
        }));
        this.blendScene.add(this.blendScreen);
        this.blendScreen.position.set(0, 0, 0);
        this.blendScreen.lookAt(this.camera.position);
    }

    setSize(width: number, height: number): void {
        this.screen.material.uniforms.uDeltaX.value = 1.0 / width;
        this.screen.material.uniforms.uDeltaY.value = 1.0 / height;

        this.rainRenderTarget1 = new WebGLRenderTarget(width, height);
        this.rainRenderTarget2 = new WebGLRenderTarget(width, height);
    }

    setParas(rgbcolor: [number, number, number], fadeRate = 0.99, speedFactor = 0.0005, spawnChance = 0.005, mixRate = 0.5) {
        this.screen.material.uniforms.uParticleColor.value  = rgbcolor;
        this.screen.material.uniforms.uFadeRate.value       = fadeRate;
        this.screen.material.uniforms.uSpeedFactor.value    = speedFactor;
        this.screen.material.uniforms.uSpawnChance.value    = spawnChance;
        this.blendScreen.material.uniforms.uFrac.value      = mixRate;
    }
    
    render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget, deltaTime: number, maskActive: boolean) {
        this.i += 1;

        if (!readBuffer.depthTexture) {
            throw new Error(`Electric eel expects input-buffer to have a depth-texture. Consider creating one with "composer.renderTarget1.depthTexture = new DepthTexture(canvas.width, canvas.height);"`);
        }

        const rainInput  = this.i % 2 === 0 ? this.rainRenderTarget1 : this.rainRenderTarget2;
        const rainOutput = this.i % 2 === 0 ? this.rainRenderTarget2 : this.rainRenderTarget1;

        this.screen.material.uniforms.tLast.value    = rainInput.texture;
        this.screen.material.uniforms.tDepth.value   = readBuffer.depthTexture;
        this.screen.material.uniforms.uDeltaT.value  = 1000 * deltaTime;
        this.screen.material.uniforms.uRandom.value  = Math.random();

        renderer.setRenderTarget(rainOutput);
        renderer.render(this.scene, this.camera);

		renderer.setRenderTarget( this.renderToScreen ? null : writeBuffer );
        this.blendScreen.material.uniforms.tTex1.value = readBuffer.texture;
        this.blendScreen.material.uniforms.tTex2.value = rainOutput.texture;
        renderer.render(this.blendScene, this.camera);
    }
}
