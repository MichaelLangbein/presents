import { AmbientLight, BufferGeometry, Color, CustomBlending, DirectionalLight, Material, MaxEquation, Mesh, PlaneGeometry, ShaderMaterial, SrcAlphaSaturateFactor, SrcColorFactor, Vector2 } from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
// @ts-ignore
import { RenderPixelatedPass } from 'three/examples/jsm/postprocessing/RenderPixelatedPass.js';
import { SoundMgmt } from "../utils/Sound";
import { Stage } from "./Stage";
import { hsl } from "d3-color";

export class PixelStage extends Stage {

    light: DirectionalLight;
    background: Mesh<PlaneGeometry, ShaderMaterial>;
    
    constructor(private player: SoundMgmt, canvas: HTMLCanvasElement, model: Mesh<BufferGeometry, Material>, urls: string[]) {
        
        super(canvas, model, urls);

        this.scene.add(new AmbientLight());
        this.light = new DirectionalLight();
        this.scene.add(this.light);

        const background = new Mesh(new PlaneGeometry(100, 100, 1, 1),  new ShaderMaterial({
            uniforms: {
              uTime: { value: Math.random() },
              uColor: { value: [1, 1, 1]}
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
                    uniform vec3 uColor;
      
                    float fractalNoise(vec2 p, float t) {
                      float noise = 0.6 * snoise( 5.0 * p * t)
                                  + 0.3 * snoise(15.0 * p * t)
                                  + 0.1 * snoise(60.0 * p * t);
                      return noise;
                    }
      
                    void main() {
                      float r = fractalNoise(vUv, sin(uTime) * snoise(vUv));
                      gl_FragColor = vec4(uColor.x * r, uColor.y * r, uColor.z * r, 0.1);
                    }
      
          `,
          }));
          background.material.blending = CustomBlending;
          background.material.blendEquation = MaxEquation;
          background.material.blendSrc = SrcAlphaSaturateFactor;
          background.material.blendDst = SrcColorFactor;
          this.camera.add(background);
          background.translateZ(-30);
          this.scene.add(this.camera);
          this.background = background;

        this.composer.addPass(new UnrealBloomPass(new Vector2(2, 2), 2.0, 2, 0.5));
        this.composer.addPass(new RenderPixelatedPass(6, this.scene, this.camera));
    }

    loop(onLoop?: ((i: number) => void) | undefined): void {
        super.loop((i) => {

            const t = i * (30 / 1000);
            const color = hsl(i % 360, 1, 0.5).rgb();
            const amplitude = this.player.getCurrentAmplitude();
            this.background.material.uniforms.uTime.value = t;
            this.background.material.uniforms.uColor.value = [color.r / 256, color.g / 256, color.b / 256];
            const radius = 5.0;
            const speed = 2.0;
            const theta = ((i * speed) % 360) * 2.0 * Math.PI / 360.0;
            const x = radius * Math.cos(theta);
            const z = radius * Math.sin(theta);
            this.light.position.set(x, 0, z);
            this.light.lookAt(this.model.position);
            this.light.color.set(new Color(color.formatHex()));
            this.light.intensity = amplitude;
            this.model.rotateY(0.001);
        });
    }
}