import { Buffer, GlobalState, Texture } from '../engine';
import { Graph } from '../engine.more';

export async function sleep(sleepTime: number) {
  return new Promise((resolve) => setTimeout(resolve, sleepTime));
}

export const makeTextCanvas = (
  text: string,
  width: number,
  height: number,
  color: string,
  bgColor: string = 'black'
) => {
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.font = `bold ${((height * 5) / 6) | 0}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = color;
  ctx.fillText(text, width / 2, height / 2);
  return ctx.canvas;
};

export function createArrayFrom<T>(v: T, nr: number) {
  const arr: T[] = [];
  for (let n = 0; n < nr; n++) {
    arr.push(v);
  }
  return arr;
}

export function createArrayFromFunction<T>(f: (i: number) => T, nr: number) {
  const arr: T[] = [];
  for (let n = 0; n < nr; n++) {
    arr.push(f(n));
  }
  return arr;
}

export function createRectangleFrom<T>(element: T, rows: number, cols: number) {
  const rect: T[][] = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push(structuredClone(element));
    }
    rect.push(row);
  }
  return rect;
}

export function createRectangleFromFunction<T>(f: (r: number, c: number) => T, rows: number, cols: number) {
  const rect: T[][] = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push(f(r, c));
    }
    rect.push(row);
  }
  return rect;
}

export function rectangleVertices(centerX: number, centerY: number, width: number, height: number) {
  const l = centerX - width / 2;
  const r = centerX + width / 2;
  const t = centerY + height / 2;
  const b = centerY - height / 2;
  const rectVertices = [
    [l, t],
    [l, b],
    [r, b],
    [l, t],
    [r, b],
    [r, t],
  ];
  return rectVertices;
}

export function rectangleUvs() {
  return [
    [0, 0],
    [0, 1],
    [1, 1],
    [0, 0],
    [1, 1],
    [1, 0],
  ];
}

export function displayTextureGraph(gs: GlobalState, texture: Texture, alpha = 1.0, blur = 0.0) {
  const canvas = gs.gl.canvas;
  const rectVertices = rectangleVertices(0, 0, 2, 2);
  const rectBuffer = new Buffer(gs.gl, { data: new Float32Array(rectVertices.flat()), changesOften: false });

  const graph = new Graph(gs, {
    program: {
      vertexSource: `#version 300 es
            in vec2 pos;
            out vec2 uv;
            void main() {
                gl_Position = vec4(pos.xy, 0, 1);
                uv = (pos + 1.0) / 2.0;
                uv.y = 1.0 - uv.y;
            }`,
      fragmentSource: `#version 300 es
            precision highp float;
            in vec2 uv;
            uniform float blur;
            uniform vec2 texSize;
            uniform sampler2D tex;
            out vec4 fragColor;
            void main() {
                vec4 color = texture(tex, uv);

                if (blur > 0.0) {
                  vec2 dX = blur * vec2(1.0 / texSize.x, 0);
                  vec2 dY = blur * vec2(0, 1.0 / texSize.y);
                  color *= 0.4;
                  color += 0.6 / 4.0 * texture(tex, uv + dX);
                  color += 0.6 / 4.0 * texture(tex, uv - dX);
                  color += 0.6 / 4.0 * texture(tex, uv + dY);
                  color += 0.6 / 4.0 * texture(tex, uv - dY);
                }

                fragColor = vec4(color.xyz, ${alpha});
            }`,
    },
    inputs: {
      attributes: {
        pos: { buffer: rectBuffer, config: { normalize: false, nrInstances: 0, type: 'vec2' } },
      },
      uniforms: {
        texSize: { type: 'vec2', value: [texture.width, texture.height] },
        blur: { type: 'float', value: [blur] },
      },
      textures: {
        tex: texture,
      },
    },
    outputs: {},
    settings: {
      drawingMode: 'triangles',
      instanced: false,
      nrVertices: rectVertices.length,
      viewport: [0, 0, canvas.width, canvas.height],
    },
  });
  return graph;
}

export function displayI32TextureGraph(gs: GlobalState, texture: Texture) {
  const rectVertices = rectangleVertices(0, 0, 2, 2);
  const rectBuffer = new Buffer(gs.gl, { data: new Float32Array(rectVertices.flat()), changesOften: false });

  const graph = new Graph(gs, {
    program: {
      vertexSource: `#version 300 es
            in vec2 pos;
            out vec2 uv;
            void main() {
                gl_Position = vec4(pos.xy, 0, 1);
                uv = (pos + 1.0) / 2.0;
            }`,
      fragmentSource: `#version 300 es
            precision highp float;
            in vec2 uv;
            uniform highp isampler2D tex;
            out vec4 fragColor;
            void main() {
                ivec4 tex = texture(tex, uv);
                fragColor = vec4(float(tex.x), float(tex.y), float(tex.z), float(tex.w));
            }`,
    },
    inputs: {
      attributes: {
        pos: { buffer: rectBuffer, config: { normalize: false, nrInstances: 0, type: 'vec2' } },
      },
      uniforms: {},
      textures: {
        tex: texture,
      },
    },
    outputs: {},
    settings: {
      drawingMode: 'triangles',
      instanced: false,
      nrVertices: rectVertices.length,
      viewport: [0, 0, texture.width, texture.height],
    },
  });

  return graph;
}

// https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from https://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
export function hslToRgb(h: number, s: number, l: number) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function hueToRgb(p: number, q: number, t: number) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function animationInterval(ms: number, signal: AbortSignal, callback: (time: number) => void) {
  const start = +document.timeline.currentTime!;

  function frame(time: number) {
    if (signal.aborted) return;
    callback(time);
    scheduleFrame(time);
  }

  function scheduleFrame(time: number) {
    const elapsed = time - start;
    const roundedElapsed = Math.round(elapsed / ms) * ms;
    const targetNext = start + roundedElapsed + ms;
    const delay = targetNext - performance.now();
    setTimeout(() => requestAnimationFrame(frame), delay);
  }

  scheduleFrame(start);
}

/**
 * https://developer.chrome.com/blog/timer-throttling-in-chrome-88#intensive_throttling
 */
export class Looper {
  constructor(private loopTime: number, private callback: (time: number) => void) {}

  public setLoopTime(newTime: number) {
    this.loopTime = newTime;
  }
  public getLoopTime() {
    return this.loopTime;
  }

  private doesLoop = false;
  private lastRenderStart = +document.timeline.currentTime!;
  private loop() {
    const currentTime = +document.timeline.currentTime!;
    const timeLeft = this.loopTime - (currentTime - this.lastRenderStart);

    if (timeLeft < 0) {
      this.lastRenderStart = currentTime;
      this.callback(currentTime);
    }

    if (this.doesLoop) requestAnimationFrame(() => this.loop());
  }

  public startLoop() {
    this.doesLoop = true;
    this.loop();
  }

  public stopLoop() {
    this.doesLoop = false;
  }
}
