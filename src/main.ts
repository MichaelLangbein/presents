import { Buffer, EmptyTexture, GlobalState, VideoTexture } from './lib/engine';
import { Graph } from './lib/engine.more';
import { createArrayFrom, createArrayFromFunction, rectangleVertices } from './lib/utils/utils';

class SdfParticleVideo {
  movement1: Graph;
  movement2: Graph;
  gs: GlobalState;
  videoTexture: VideoTexture;
  posTexture1: EmptyTexture;
  posTexture2: EmptyTexture;
  constructor(gl: WebGL2RenderingContext, config: { sdfVideo: HTMLVideoElement; nrParticles: number }) {
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.setProperty('background', 'black');

    const gs = new GlobalState(gl, { allowAlpha: true });

    const nrParticles = config.nrParticles;

    /*****************************************************************************************
     * Data
     *****************************************************************************************/

    const sdfTexture = new VideoTexture(gl, {
      video: config.sdfVideo,
    });

    const offsetVals = createArrayFromFunction(
      () => [(Math.random() * 2 - 1) * 0.8, (Math.random() * 2 - 1) * 0.8, 0, 0],
      nrParticles
    );
    const offsetBuffer1 = new Buffer(gl, { data: new Float32Array(offsetVals.flat()), changesOften: true });
    const offsetBuffer2 = new Buffer(gl, { data: new Float32Array(offsetVals.flat()), changesOften: true });

    const colors = createArrayFrom([255, 255, 255, 255], nrParticles);
    const colorBuffer1 = new Buffer(gl, { data: new Float32Array(colors.flat()), changesOften: true });
    const colorBuffer2 = new Buffer(gl, { data: new Float32Array(colors.flat()), changesOften: true });

    const posTexture1 = new EmptyTexture(gl, {
      width: canvas.width,
      height: canvas.height,
      type: 'float4',
      interpolate: 'none',
      edges: 'clamp',
    });
    const posTexture2 = new EmptyTexture(gl, {
      width: canvas.width,
      height: canvas.height,
      type: 'float4',
      interpolate: 'none',
      edges: 'clamp',
    });

    /*****************************************************************************************
     * Graphs
     *****************************************************************************************/

    const movement1 = new Graph(gs, {
      program: {
        vertexSource: `#version 300 es
              in vec4 offset;
              in vec4 colorOld;
              uniform float t;
              uniform vec3 pointerPos;
              uniform vec2 lastPosTexSize;
              uniform vec2 sdfTextureSize;
              uniform sampler2D lastPosTex;
              uniform sampler2D sdfTexture;
              out vec4 offsetNew;
              out vec4 colorNew;
              out vec4 color;
  
              float particleSize = 7.0;
              vec2 dxdyPos() {
                  return vec2(particleSize / lastPosTexSize.x, particleSize / lastPosTexSize.y);
              }
              vec2 dxdySdf() {
                return vec2(1.0 / sdfTextureSize.x, 1.0 / sdfTextureSize.y);
              }
  
              vec4 sampleQuadrant(vec2 uv, vec2 dPrimary, vec2 dSecondary, sampler2D tex, int level) {
                  vec4 data = vec4(0);
  
                  if (level > -2) {
                    data += 0.13 * texture(tex, uv + 0.1 * dPrimary + 0.0 * dSecondary);
                  }
                  if (level > -1) {
                    data += 0.13 * texture(tex, uv + 0.1 * dPrimary + 0.1 * dSecondary);
                    data += 0.13 * texture(tex, uv + 0.1 * dPrimary - 0.1 * dSecondary);
                    data += 0.25 * texture(tex, uv + 0.3 * dPrimary + 0.0 * dSecondary);
                  }
                  if (level > 0) {
                    data += 0.25 * texture(tex, uv + 0.3 * dPrimary + 0.3 * dSecondary);
                    data += 0.25 * texture(tex, uv + 0.3 * dPrimary - 0.3 * dSecondary);
                    data += 0.50 * texture(tex, uv + 0.5 * dPrimary + 0.0 * dSecondary);
                    data += 0.50 * texture(tex, uv + 0.5 * dPrimary + 0.5 * dSecondary);
                    data += 0.50 * texture(tex, uv + 0.5 * dPrimary - 0.5 * dSecondary);
                  }
                  if (level > 1) {
                    data += 1.00 * texture(tex, uv + 1.0 * dPrimary + 0.0 * dSecondary);
                    data += 0.72 * texture(tex, uv + 1.0 * dPrimary + 1.0 * dSecondary);
                    data += 0.72 * texture(tex, uv + 1.0 * dPrimary - 1.0 * dSecondary);
                  }
                  if (level > 2) {
                    data += 0.50 * texture(tex, uv + 2.0 * dPrimary + 0.0 * dSecondary);
                    data += 0.30 * texture(tex, uv + 2.0 * dPrimary + 1.0 * dSecondary);
                    data += 0.30 * texture(tex, uv + 2.0 * dPrimary - 1.0 * dSecondary);
                    data += 0.10 * texture(tex, uv + 2.0 * dPrimary + 2.0 * dSecondary);
                    data += 0.10 * texture(tex, uv + 2.0 * dPrimary - 2.0 * dSecondary);
                  }
                  if (level > 3) {
                    data += 0.25 * texture(tex, uv + 3.0 * dPrimary + 0.0 * dSecondary);
                  }
                  return data;
              }
  
              vec4 sampleRight(vec2 uv, vec2 dxdy, sampler2D tex, int level) {
                  float dx = dxdy.x;
                  float dy = dxdy.y;
                  vec2 dPrimary   = vec2(dx, 0.0);
                  vec2 dSecondary = vec2(0.0, dy);
                  return sampleQuadrant(uv, dPrimary, dSecondary, tex, level);
              }
  
              vec4 sampleLeft(vec2 uv, vec2 dxdy, sampler2D tex, int level) {
                  float dx = dxdy.x;
                  float dy = dxdy.y;
                  vec2 dPrimary   = vec2(-dx, 0.0);
                  vec2 dSecondary = vec2( 0.0, dy);
                  return sampleQuadrant(uv, dPrimary, dSecondary, tex, level);
              }
  
              vec4 sampleTop(vec2 uv, vec2 dxdy, sampler2D tex, int level) {
                  float dx = dxdy.x;
                  float dy = dxdy.y;
                  vec2 dPrimary   = vec2(0.0, dy);
                  vec2 dSecondary = vec2(dx, 0.0);
                  return sampleQuadrant(uv, dPrimary, dSecondary, tex, level);
              }
  
              vec4 sampleBottom(vec2 uv, vec2 dxdy, sampler2D tex, int level) {
                  float dx = dxdy.x;
                  float dy = dxdy.y;
                  vec2 dPrimary   = vec2(0.0, -dy);
                  vec2 dSecondary = vec2(dx, 0.0);
                  return sampleQuadrant(uv, dPrimary, dSecondary, tex, level);
              }

              float rand(vec2 n) { 
                return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
              }
              
              float noise(vec2 p){
                vec2 ip = floor(p);
                vec2 u = fract(p);
                u = u*u*(3.0-2.0*u);
                
                float res = mix(
                  mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
                  mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
                return res*res;
              }
  
              void main() {
  
                  vec2 pos = offset.xy;
                  vec2 speed = offset.zw;
                  vec2 uv = (pos + 1.0) / 2.0;
  
                  vec2 uvSdf = vec2(uv.x, uv.y);
                  float dxSdf = dxdySdf().x;
                  float dySdf = dxdySdf().y;


                  float redness = 0.;
                  float redness_px = 0.;
                  float redness_mx = 0.;
                  float redness_py = 0.;
                  float redness_my = 0.;
                  if (gl_VertexID % 6 == 0) {
                    redness    = texture(sdfTexture, uvSdf).x;
                    redness_px = sampleRight (uvSdf, dxdySdf(), sdfTexture, 3).x;
                    redness_mx = sampleLeft  (uvSdf, dxdySdf(), sdfTexture, 3).x;
                    redness_py = sampleTop   (uvSdf, dxdySdf(), sdfTexture, 3).x;
                    redness_my = sampleBottom(uvSdf, dxdySdf(), sdfTexture, 3).x;
                  } else if (gl_VertexID % 6 == 1) {
                    redness    = texture(sdfTexture, uvSdf).y;
                    redness_px = sampleRight (uvSdf, dxdySdf(), sdfTexture, 3).y;
                    redness_mx = sampleLeft  (uvSdf, dxdySdf(), sdfTexture, 3).y;
                    redness_py = sampleTop   (uvSdf, dxdySdf(), sdfTexture, 3).y;
                    redness_my = sampleBottom(uvSdf, dxdySdf(), sdfTexture, 3).y;
                  } else if (gl_VertexID % 6 == 2) {
                    redness    = texture(sdfTexture, uvSdf).z;
                    redness_px = sampleRight (uvSdf, dxdySdf(), sdfTexture, 3).z;
                    redness_mx = sampleLeft  (uvSdf, dxdySdf(), sdfTexture, 3).z;
                    redness_py = sampleTop   (uvSdf, dxdySdf(), sdfTexture, 3).z;
                    redness_my = sampleBottom(uvSdf, dxdySdf(), sdfTexture, 3).z;
                  } 
                  else if (gl_VertexID % 6 == 3) {
                    redness    = 1. - texture(sdfTexture, uvSdf).x;
                    redness_px = 1. - sampleRight (uvSdf, dxdySdf(), sdfTexture, 3).x;
                    redness_mx = 1. - sampleLeft  (uvSdf, dxdySdf(), sdfTexture, 3).x;
                    redness_py = 1. - sampleTop   (uvSdf, dxdySdf(), sdfTexture, 3).x;
                    redness_my = 1. - sampleBottom(uvSdf, dxdySdf(), sdfTexture, 3).x;
                  } else if (gl_VertexID % 6 == 4) {
                    redness    = 1. - texture(sdfTexture, uvSdf).y;
                    redness_px = 1. - sampleRight (uvSdf, dxdySdf(), sdfTexture, 3).y;
                    redness_mx = 1. - sampleLeft  (uvSdf, dxdySdf(), sdfTexture, 3).y;
                    redness_py = 1. - sampleTop   (uvSdf, dxdySdf(), sdfTexture, 3).y;
                    redness_my = 1. - sampleBottom(uvSdf, dxdySdf(), sdfTexture, 3).y;
                  } else if (gl_VertexID % 6 == 5) {
                    redness    = 1. - texture(sdfTexture, uvSdf).z;
                    redness_px = 1. - sampleRight (uvSdf, dxdySdf(), sdfTexture, 3).z;
                    redness_mx = 1. - sampleLeft  (uvSdf, dxdySdf(), sdfTexture, 3).z;
                    redness_py = 1. - sampleTop   (uvSdf, dxdySdf(), sdfTexture, 3).z;
                    redness_my = 1. - sampleBottom(uvSdf, dxdySdf(), sdfTexture, 3).z;
                  }
      
                  float dRednessDx = (redness_px - redness_mx) / (2.0 * dxSdf);
                  float dRednessDy = (redness_py - redness_my) / (2.0 * dySdf);
                  vec2 textAttractionForce = vec2(dRednessDx, dRednessDy);
  
  
  
                  float dxPos = dxdyPos().x;
                  float dyPos = dxdyPos().y;
                  vec4 presenceRight  = sampleRight (uv, dxdyPos(), lastPosTex, 4);
                  vec4 presenceLeft   = sampleLeft  (uv, dxdyPos(), lastPosTex, 4);
                  vec4 presenceTop    = sampleTop   (uv, dxdyPos(), lastPosTex, 4);
                  vec4 presenceBottom = sampleBottom(uv, dxdyPos(), lastPosTex, 4);
                  float pr = presenceRight.x * presenceRight.w;
                  float pl = presenceLeft.x * presenceLeft.w;
                  float pt = presenceTop.x * presenceTop.w;
                  float pb = presenceBottom.x * presenceBottom.w;
                  float dpdx = (pr - pl) / (2.0 * dxPos);
                  float dpdy = (pt - pb) / (2.0 * dyPos);
                  vec2 particleRepulsionForce = -0.0001 * vec2(dpdx, dpdy);
  
  
  
                  vec2 mouseRepulsionForce = vec2(0);
                  if (pointerPos.z > 0.5) {
                    vec2 mousePos = pointerPos.xy;
                    vec2 mouseDir = mousePos - pos;
                    float mouseDist = length(mouseDir);
                    if (mouseDist < 0.7) {
                      float mouseProx = (0.7 - mouseDist) / 0.7;
                      mouseRepulsionForce = -1.0 * (mouseProx * mouseProx) * mouseDir;
                    }
                  }
  
                  
                  float momentum = 0.5;
                  float repulsion = 10.0;
                  float attraction = 0.02;
                  float overall = 0.005;
  
                  vec2 newSpeed = (momentum   / (momentum + repulsion + attraction)) * speed 
                                + (repulsion  / (momentum + repulsion + attraction)) * particleRepulsionForce 
                                + (attraction / (momentum + repulsion + attraction)) * textAttractionForce
                                + 20.0 * mouseRepulsionForce;
                  vec2 newPos = pos + overall * newSpeed;
  
  
                  if (newPos.x < -1.0) {
                    newPos.x = 1.0 - (-1.0 - newPos.x);
                  }
                  if (newPos.x > 1.0) {
                    newPos.x = -1.0 + (1.0 - newPos.x);
                  }
                  if (newPos.y < -1.0) {
                    newPos.y = 1.0 - (-1.0 - newPos.y);
                  }
                  if (newPos.y > 1.0) {
                    newPos.y = -1.0 + (1.0 - newPos.y);
                  }

                  // random repositioning
                  // float r = noise(newPos.xy * vec2(sin(t * 13243546.0), cos(t * 97867564.0)));
                  // if (r > 0.9) {
                  //   newPos.x = noise(newSpeed.xy * sin(t * 12345678.0)) * 2. - 0.5;
                  //   newPos.y = noise(newSpeed.yx * sin(t * 87654321.0)) * 2. - 0.5;
                  // }
  
                  gl_Position = vec4(newPos, 0, 1);
                  gl_PointSize = particleSize;
                  offsetNew = vec4(newPos, newSpeed);

                  vec4 videoColor = texture(sdfTexture, uvSdf);
                  vec4 targetColor = videoColor * vec4(0.8, 1.0, 1.6, 1.0);
                  float frac = 0.1;
                  vec4 newColor = frac * targetColor + (1. - frac) * colorOld;
                  newColor.w = 1.0;


                  colorNew = newColor;
                  color = newColor;
              }`,
        fragmentSource: `#version 300 es
              precision highp float;
              in vec4 color;
              out vec4 fragColor;
              void main() {
                  fragColor = color;
              }`,
      },
      inputs: {
        attributes: {
          offset: { buffer: offsetBuffer1, config: { normalize: false, nrInstances: 0, type: 'vec4' } },
          colorOld: { buffer: colorBuffer1, config: { normalize: false, nrInstances: 0, type: 'vec4' } },
        },
        uniforms: {
          t: { type: 'float', value: [0] },
          lastPosTexSize: { type: 'vec2', value: [posTexture1.width, posTexture1.height] },
          sdfTextureSize: { type: 'vec2', value: [sdfTexture.width, sdfTexture.height] },
          pointerPos: { type: 'vec3', value: [0, 0, 0] },
        },
        textures: {
          sdfTexture,
          lastPosTex: posTexture1,
        },
      },
      outputs: {
        transformFeedback: { data: { offsetNew: offsetBuffer2, colorNew: colorBuffer2 }, runFragmentShader: true },
        frameBuffer: { textures: [posTexture2] },
      },
      settings: {
        drawingMode: 'points',
        instanced: false,
        nrVertices: nrParticles,
        viewport: [0, 0, canvas.width, canvas.height],
      },
    });

    const movement2 = new Graph(gs, {
      ...movement1.config,
      program: movement1.program,
      inputs: {
        ...movement1.config.inputs,
        attributes: {
          ...movement1.config.inputs.attributes,
          offset: { buffer: offsetBuffer2, config: { normalize: false, nrInstances: 0, type: 'vec4' } },
          colorOld: { buffer: colorBuffer2, config: { normalize: false, nrInstances: 0, type: 'vec4' } },
        },
        textures: {
          ...movement1.config.inputs.textures,
          lastPosTex: posTexture2,
        },
      },
      outputs: {
        ...movement1.config.outputs,
        transformFeedback: { data: { offsetNew: offsetBuffer1, colorNew: colorBuffer1 }, runFragmentShader: true },
        frameBuffer: { textures: [posTexture1] },
      },
    });

    /*****************************************************************************************
     * Keeping state
     *****************************************************************************************/

    this.gs = gs;
    this.videoTexture = sdfTexture;
    this.movement1 = movement1;
    this.movement2 = movement2;
    this.posTexture1 = posTexture1;
    this.posTexture2 = posTexture2;
  }

  private i = 0;
  step(data: { pointerPos: [number, number, number] }): void {
    this.gs.updateVideoTexture(this.videoTexture);

    if (this.i % 2 === 0) {
      this.movement1.updateUniform('t', [this.i]);
      this.movement1.updateUniform('pointerPos', data.pointerPos);
      this.movement1.draw([0, 0, 0, 0]);
    } else {
      this.movement2.updateUniform('t', [this.i]);
      this.movement2.updateUniform('pointerPos', data.pointerPos);
      this.movement2.draw([0, 0, 0, 0]);
    }
    this.i++;
  }

  destroy(recursive: boolean): void {
    this.movement2.destroy(recursive);
    this.movement1.destroy(recursive);
  }
}

async function estelle(canvas: HTMLCanvasElement) {
  canvas.width = 1000;
  canvas.height = 700;
  const gl = canvas.getContext('webgl2')!;

  const video = await VideoTexture.loadVideo('https://michaellangbein.github.io/presents/estelle.mp4');
  video.playbackRate = 0.85;
  const spv = new SdfParticleVideo(gl, { sdfVideo: video, nrParticles: 20000 });

  const rectVerts = rectangleVertices(0, 0, 2, 2);
  const rectBuffer = new Buffer(gl, { data: new Float32Array(rectVerts.flat()), changesOften: false });
  const videoTexture = spv.videoTexture;
  const graph = new Graph(spv.gs, {
    program: {
      vertexSource: `#version 300 es
                in vec2 pos;
                out vec2 uv;
                void main() {
                    gl_Position = vec4(pos.xy, 0, 1);
                    uv = (pos + 1.) / 2.;
                    uv.y = 1. - uv.y;
                }`,
      fragmentSource: `#version 300 es
                precision mediump float;
                in vec2 uv;
                uniform sampler2D vid;
                uniform sampler2D mov;
                out vec4 fragColor;
                void main() {
                    vec4 vColor = texture(vid, uv);
                    vec4 mColor = texture(mov, uv);

                    fragColor =  0.1 * vColor + 0.9 * mColor;;
                }`,
    },
    inputs: {
      attributes: {
        pos: { buffer: rectBuffer, config: { normalize: false, nrInstances: 0, type: 'vec2' } },
      },
      textures: {
        vid: videoTexture,
        mov: spv.posTexture1,
      },
      uniforms: {},
    },
    outputs: {},
    settings: {
      drawingMode: 'triangles',
      instanced: false,
      nrVertices: rectVerts.length,
      viewport: [0, 0, canvas.width, canvas.height],
    },
  });

  let mouseX = 0;
  let mouseY = 0;
  let doesMove = 0;
  canvas.addEventListener('mousemove', (evt) => {
    mouseX = (evt.x / canvas.width - 0.5) * 2;
    mouseY = (evt.y / canvas.height - 0.5) * 2;
    // doesMove = 1.0;
  });

  function loop() {
    const startTime = new Date().getTime();

    spv.step({ pointerPos: [mouseX, mouseY, doesMove] });
    doesMove = 0;
    graph.draw();

    const endTime = new Date().getTime();
    const timeLeft = 30 - (endTime - startTime);
    setTimeout(loop, timeLeft);
  }
  loop();
}

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
estelle(canvas);
