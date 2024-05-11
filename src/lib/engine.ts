/**
 * - Binding:
 *    - Classes mustn't have `isBound`- because:
 *    - buffer1.bind(); buffer2.bind() <- now buffer1 doesn't know its not bound anymore
 *    - that binding should happen on the GlobalState
 *    - similarly, binding buffers to vao should happen on vao, buffer shouldn't have `isBound`
 *    - binding often requires global state, so calling `bind` methods on anything other than GlobalState should be considered unsafe API
 *
 * - Drawing
 *    - drawing requires making sure that the right vao's, textures, framebuffers, feedbacks are bound
 *    - should probably happen through global-state, too
 */

interface Intermediate {}

interface Datum {}

export type GlDrawingMode = 'triangles' | 'points' | 'lines';

export type WebGLUniformType =
  | 'bool'
  | 'bvec2'
  | 'bvec3'
  | 'bvec4'
  | 'bool[]'
  | 'bvec2[]'
  | 'bvec3[]'
  | 'bvec4[]'
  | 'int'
  | 'ivec2'
  | 'ivec3'
  | 'ivec4'
  | 'int[]'
  | 'ivec2[]'
  | 'ivec3[]'
  | 'ivec4[]'
  | 'float'
  | 'vec2'
  | 'vec3'
  | 'vec4'
  | 'float[]'
  | 'vec2[]'
  | 'vec3[]'
  | 'vec4[]'
  | 'mat2'
  | 'mat3'
  | 'mat4';

export type WebGLAttributeType = 'float' | 'vec2' | 'vec3' | 'vec4' | 'mat2' | 'mat3' | 'mat4';

export type TextureType = 'ubyte1' | 'ubyte4' | 'byte32' | 'float1' | 'float4';

const textureConstructionBindPoint = 7;

function sizeOf(gl: WebGL2RenderingContext, type: number): number {
  switch (type) {
    case gl.FLOAT:
      return 4;
    case gl.UNSIGNED_BYTE:
      return 1;
    case gl.BYTE:
    case gl.SHORT:
    case gl.UNSIGNED_SHORT:
    default:
      throw new Error(`Unknown type ${type}`);
  }
}

export function debugInfo(gl: WebGL2RenderingContext) {
  const baseInfo = {
    renderer: gl.getParameter(gl.RENDERER),
    currentProgram: gl.getParameter(gl.CURRENT_PROGRAM),
    arrayBuffer: gl.getParameter(gl.ARRAY_BUFFER_BINDING),
    elementArrayBuffer: gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING),
    frameBuffer: gl.getParameter(gl.FRAMEBUFFER_BINDING),
    renderBuffer: gl.getParameter(gl.RENDERBUFFER_BINDING),
    texture: gl.getParameter(gl.TEXTURE_BINDING_2D),
    viewPort: gl.getParameter(gl.VIEWPORT),
  };
  const programInfo = {
    infoLog: gl.getProgramInfoLog(baseInfo.currentProgram),
  };
  return {
    baseInfo,
    programInfo,
  };
}

export class Program {
  program: WebGLProgram;

  constructor(
    private gl: WebGL2RenderingContext,
    private config: {
      vertexSource: string;
      fragmentSource: string;
      transformFeedbackVaryings?: string[];
    }
  ) {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, config.vertexSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(vertexShader)!);
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, config.fragmentSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(fragmentShader)!);
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    if (config.transformFeedbackVaryings) {
      gl.transformFeedbackVaryings(program, config.transformFeedbackVaryings, gl.SEPARATE_ATTRIBS);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program)!);
    }

    gl.detachShader(program, vertexShader);
    gl.deleteShader(vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(fragmentShader);

    this.program = program;
  }

  getAttributeLocation(attributeName: string) {
    return this.gl.getAttribLocation(this.program, attributeName);
  }

  getUniformLocation(uniformName: string) {
    return this.gl.getUniformLocation(this.program, uniformName);
  }

  /**
   * Contrary to attributes, uniforms don't need to be stored in a buffer. (Note: in WebGL 2.0, however, there *are* uniform buffers!)
   *
   * 'v' is not about the shader, but how you provide data from the js-side.
   * uniform1fv(loc, [3.19]) === uniform1f(loc, 3.19)
   *
   * |js                                      |          shader                  |
   * |----------------------------------------|----------------------------------|
   * |uniform1f(loc, 3.19)                    |  uniform float u_pi;             |
   * |uniform2f(loc, 3.19, 2.72)              |  uniform vec2 u_constants;       |
   * |uniform2fv(loc, [3.19, 2.72])           |  uniform vec2 u_constants;       |
   * |uniform1fv(loc, [1, 2, 3, 4, 5, 6])     |  uniform float u_kernel[6];      |
   * |uniform2fv(loc, [1, 2, 3, 4, 5, 6])     |  uniform vec2 u_observations[3]; |
   * |uniformMatrix3fv(loc, [[...], [...]])   |  uniform mat3 u_matrix;          |
   *
   * A note about `structs`. A shader code like this:
   * ```glsl
   * struct LightInfo {
   *    vec4 Position;
   *    vec3 La;
   * };
   * uniform LightInfo Light;
   * ```
   * ... is accessed like that:
   * ```js
   * const lightPosLoc = gl.getUniformLocation(program, "Light.Position");
   * const lightLaLoc = gl.getUniformLocation(program, "Light.La");
   * gl.uniform4fv(lightPosLoc, [1, 2, 3, 4]);
   * gl.uniform3fv(lightLaLoc, [1, 2, 3]);
   * ```
   *
   */
  setUniformValue(uniformName: string, type: WebGLUniformType, values: number[]) {
    const gl = this.gl;
    const uniformLocation = this.getUniformLocation(uniformName);
    switch (type) {
      case 'bool':
        gl.uniform1i(uniformLocation, values[0]);
        break;
      case 'bvec2':
        gl.uniform2i(uniformLocation, values[0], values[1]);
        break;
      case 'bvec3':
        gl.uniform3i(uniformLocation, values[0], values[1], values[2]);
        break;
      case 'bvec4':
        gl.uniform4i(uniformLocation, values[0], values[1], values[2], values[3]);
        break;
      case 'bool[]':
        gl.uniform1iv(uniformLocation, values);
        break;
      case 'bvec2[]':
        gl.uniform2iv(uniformLocation, values);
        break;
      case 'bvec3[]':
        gl.uniform3iv(uniformLocation, values);
        break;
      case 'bvec4[]':
        gl.uniform4iv(uniformLocation, values);
        break;

      case 'int':
        gl.uniform1i(uniformLocation, values[0]);
        break;
      case 'ivec2':
        gl.uniform2i(uniformLocation, values[0], values[1]);
        break;
      case 'ivec3':
        gl.uniform3i(uniformLocation, values[0], values[1], values[2]);
        break;
      case 'ivec4':
        gl.uniform4i(uniformLocation, values[0], values[1], values[2], values[3]);
        break;
      case 'int[]':
        gl.uniform1iv(uniformLocation, values);
        break;
      case 'ivec2[]':
        gl.uniform2iv(uniformLocation, values);
        break;
      case 'ivec3[]':
        gl.uniform3iv(uniformLocation, values);
        break;
      case 'ivec4[]':
        gl.uniform4iv(uniformLocation, values);
        break;

      case 'float':
        gl.uniform1f(uniformLocation, values[0]);
        break;
      case 'vec2':
        gl.uniform2f(uniformLocation, values[0], values[1]);
        break;
      case 'vec3':
        gl.uniform3f(uniformLocation, values[0], values[1], values[2]);
        break;
      case 'vec4':
        gl.uniform4f(uniformLocation, values[0], values[1], values[2], values[3]);
        break;
      case 'float[]':
        gl.uniform1fv(uniformLocation, values);
        break;
      case 'vec2[]':
        gl.uniform2fv(uniformLocation, values);
        break;
      case 'vec3[]':
        gl.uniform3fv(uniformLocation, values);
        break;
      case 'vec4[]':
        gl.uniform4fv(uniformLocation, values);
        break;

      // In the following *matrix* calls, the 'transpose' parameter must always be false.
      // Quoting the OpenGL ES 2.0 spec:
      // If the transpose parameter to any of the UniformMatrix* commands is
      // not FALSE, an INVALID_VALUE error is generated, and no uniform values are
      // changed.
      case 'mat2':
        gl.uniformMatrix2fv(uniformLocation, false, values);
        break;
      case 'mat3':
        gl.uniformMatrix3fv(uniformLocation, false, values);
        break;
      case 'mat4':
        gl.uniformMatrix4fv(uniformLocation, false, values);
        break;

      default:
        throw Error(`Type ${type} not implemented.`);
    }
  }

  destroy() {
    this.gl.deleteProgram(this.program);
  }
}

export class Buffer implements Datum {
  buffer: WebGLBuffer;
  dataPointType: number;

  constructor(
    private gl: WebGL2RenderingContext,
    private config: { data: Float32Array | Uint16Array | Uint8Array; changesOften: boolean }
  ) {
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, config.data, config.changesOften ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.buffer = buffer;
    if (config.data.BYTES_PER_ELEMENT === 4) {
      this.dataPointType = gl.FLOAT;
    } else if (config.data.BYTES_PER_ELEMENT === 2) {
      this.dataPointType = gl.UNSIGNED_SHORT;
    } else if (config.data.BYTES_PER_ELEMENT === 1) {
      this.dataPointType = gl.UNSIGNED_BYTE;
    } else {
      throw new Error(
        `Buffer data may be Float32Array(gl.FLOAT), UInt16Array(gl.UNSIGNED_SHORT) or UInt8Array(gl.UNSIGNED_BYTE)`
      );
    }
  }

  public updateData(data: Float32Array | Uint16Array | Uint8Array) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, this.config.changesOften ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.config.data = data;
  }

  public destroy() {
    this.gl.deleteBuffer(this.buffer);
  }

  public getBufferContent() {
    const gl = this.gl;
    const nrDataPoints = this.config.data.length;
    let downloadedData;
    if (this.config.data instanceof Float32Array) downloadedData = new Float32Array(nrDataPoints);
    if (this.config.data instanceof Uint16Array) downloadedData = new Uint16Array(nrDataPoints);
    if (this.config.data instanceof Uint8Array) downloadedData = new Uint8Array(nrDataPoints);
    else throw Error(`This should not have happened: this buffer does not seem to have a numeric array as data.`);
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, this.buffer);
    gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, downloadedData);
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);
    return downloadedData;
  }
}

export class Texture implements Datum {
  constructor(
    readonly gl: WebGL2RenderingContext,
    readonly textureType: string,
    readonly texture: WebGLTexture,
    readonly level: number,
    readonly internalformat: number,
    readonly format: number,
    readonly type: number,
    readonly width: number,
    readonly height: number,
    readonly border: number
  ) {}

  protected static getTextureParas(
    gl: WebGL2RenderingContext,
    t: TextureType,
    data: number[]
  ): {
    internalFormat: number;
    format: number;
    type: number;
    binData: any;
    allowsInterpolation: boolean;
    allowsRenderingTo: boolean;
  } {
    /*
     * https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html
     */

    switch (t) {
      case 'ubyte1':
        return {
          internalFormat: gl.LUMINANCE,
          format: gl.LUMINANCE,
          type: gl.UNSIGNED_BYTE,
          binData: new Uint8Array(data),
          allowsInterpolation: true,
          allowsRenderingTo: true,
        };
      case 'ubyte4':
        return {
          internalFormat: gl.RGBA,
          format: gl.RGBA,
          type: gl.UNSIGNED_BYTE,
          binData: new Uint8Array(data),
          allowsInterpolation: true,
          allowsRenderingTo: true,
          // [0-1]^4 = texture(tex, uv)
          // fragColor = vec4([0-1]^4)
        };
      case 'byte32':
        return {
          internalFormat: gl.RGBA32I,
          format: gl.RGBA_INTEGER,
          type: gl.INT,
          binData: new Int32Array(data),
          allowsInterpolation: false,
          allowsRenderingTo: true,
          // [-2_147_483_648, 2_147_483_648]^4 = texture(tex, uv)
          // fragColor = vec4([-2_147_483_648, 2_147_483_648]^4)
          // requires `uniform highp isampler2D tex;`
        };
      case 'float1':
        return {
          internalFormat: gl.R32F,
          format: gl.RED,
          type: gl.FLOAT,
          binData: new Float32Array(data),
          allowsInterpolation: false,
          allowsRenderingTo: false, // except if EXT_color_buffer_float
        };
      case 'float4':
        return {
          internalFormat: gl.RGBA32F,
          format: gl.RGBA,
          type: gl.FLOAT,
          binData: new Float32Array(data),
          allowsInterpolation: false,
          allowsRenderingTo: false, // except if EXT_color_buffer_float
          // [-3.40282347E+38, 3.40282347E+38]^4 = texture(tex, uv)
        };
    }
  }

  public destroy() {
    this.gl.deleteTexture(this.texture);
  }

  public getCurrentPixels(fb: WebGLFramebuffer) {
    // https://stackoverflow.com/questions/13626606/read-pixels-from-a-webgl-texture
    // fb = gl.createFramebuffer();
    // @TODO: WebGL2 allows to use `drawBuffer` and `readBuffer`, so that we are no longer limited to only the current framebuffer.

    const gl = this.gl;
    const format = this.format;
    const type = this.type;

    let pixelArray;
    if (type === gl.UNSIGNED_BYTE) {
      pixelArray = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
    } else if (
      type === gl.UNSIGNED_SHORT_5_6_5 ||
      type === gl.UNSIGNED_SHORT_4_4_4_4 ||
      type === gl.UNSIGNED_SHORT_5_5_5_1
    ) {
      pixelArray = new Uint16Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
    } else if (type === gl.FLOAT) {
      pixelArray = new Float32Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
    } else {
      throw new Error(`Did not understand pixel data type ${type} for format ${format}`);
    }

    // make this the current frame buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // attach the texture to the framebuffer.
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);

    // check if you can read from this type of texture.
    let canRead = gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE;

    if (canRead) {
      // bind the framebuffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

      // read the pixels
      // Just like `toDataURL` or `toBlob`, `readPixels` does not access the front-buffer.
      // It accesses the back-buffer or any other currently active framebuffer.
      gl.readPixels(0, 0, this.width, this.height, format, type, pixelArray);

      // Unbind the framebuffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      return pixelArray;
    }

    return undefined;
  }
}

export class ImageTexture extends Texture {
  constructor(
    gl: WebGL2RenderingContext,
    readonly config: {
      image: HTMLImageElement | HTMLCanvasElement;
      edges?: 'repeat' | 'clamp' | 'mirror';
      interpolate?: 'none' | 'linear';
      mipmaps?: boolean;
    }
  ) {
    if (!config.edges) config.edges = 'clamp';
    if (!config.interpolate) config.interpolate = 'none';
    if (!config.mipmaps) config.mipmaps = false;

    const texture = gl.createTexture(); // analog to createBuffer
    if (!texture) {
      throw new Error('No texture was created');
    }
    gl.activeTexture(gl.TEXTURE0 + textureConstructionBindPoint); // so that we don't overwrite another texture in the next line.
    gl.bindTexture(gl.TEXTURE_2D, texture); // analog to bindBuffer. Binds texture to currently active texture-bindpoint (aka. texture unit).

    const level = 0;
    const internalFormat = gl.RGBA;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;

    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, format, type, config.image); // analog to bufferData

    if (config.mipmaps) gl.generateMipmap(gl.TEXTURE_2D); // mipmaps are mini-versions of the texture.

    if (config.edges === 'clamp') {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); // when accessing texture2D(u_tex, vec2(1.2, 0.3)), this becomes  texture2D(u_tex, vec2(1.0, 0.3))
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); // when accessing texture2D(u_tex, vec2(0.2, 1.3)), this becomes  texture2D(u_tex, vec2(0.2, 1.0))
    } else if (config.edges === 'repeat') {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    }

    if (config.interpolate === 'linear') {
      if (config.mipmaps) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
      else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    } else if (config.interpolate === 'none') {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }

    gl.bindTexture(gl.TEXTURE_2D, null); // unbinding

    let w, h: number;
    if (config.image instanceof HTMLImageElement) {
      w = config.image.naturalWidth;
      h = config.image.naturalHeight;
    } else {
      w = config.image.width;
      h = config.image.height;
    }

    super(gl, 'ubyte4', texture, level, internalFormat, format, type, w, h, 0);
  }

  static async loadImage(url: string): Promise<HTMLImageElement> {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  }
}

export class VideoTexture extends Texture {
  constructor(gl: WebGL2RenderingContext, readonly config: { video: HTMLVideoElement }) {
    const texture = gl.createTexture(); // analog to createBuffer
    if (!texture) {
      throw new Error('No texture was created');
    }
    gl.activeTexture(gl.TEXTURE0 + textureConstructionBindPoint); // so that we don't overwrite another texture in the next line.
    gl.bindTexture(gl.TEXTURE_2D, texture); // analog to bindBuffer. Binds texture to currently active texture-bindpoint (aka. texture unit).

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const level = 0;
    const internalFormat = gl.RGBA;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;

    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, format, type, config.video);

    super(
      gl,
      'ubyte4',
      texture,
      level,
      internalFormat,
      format,
      type,
      config.video.videoWidth,
      config.video.videoHeight,
      0
    );
  }

  update(slot: number) {
    const gl = this.gl;

    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;

    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, this.config.video);
  }

  static async loadVideo(url: string): Promise<HTMLVideoElement> {
    function waitForFrame(video: HTMLVideoElement, resolve: any) {
      const id = setInterval(() => {
        if (video.currentTime > 0.1 && video.videoWidth > 0) {
          clearInterval(id);
          resolve(video);
        }
      });
    }

    return new Promise((resolve, reject) => {
      var video = document.createElement('video');
      video.autoplay = true;
      video.src = url;
      video.volume = 0;
      video.loop = true;
      video.addEventListener('playing', () => waitForFrame(video, resolve));
      video.onerror = reject;
      video.play();
      return video;
    });
  }
}

export type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;

interface TypedArrayData {
  data: TypedArray;
  width: number;
  height: number;
  channels: number;
}

export class DataTexture extends Texture {
  /**
   * ubyte4: js-data expected to go from 0 to 255
   */
  constructor(
    gl: WebGL2RenderingContext,
    private config: {
      data: number[][][] | TypedArrayData;
      t: TextureType;
      edges?: 'clamp' | 'repeat' | 'mirror';
      interpolate?: 'none' | 'linear';
    }
  ) {
    if (!config.edges) config.edges = 'clamp';
    if (!config.interpolate) config.interpolate = 'none';

    const { data, t } = config;

    const texture = gl.createTexture(); // analog to createBuffer
    if (!texture) {
      throw new Error('No texture was created');
    }
    gl.activeTexture(gl.TEXTURE0 + textureConstructionBindPoint); // so that we don't overwrite another texture in the next line.
    gl.bindTexture(gl.TEXTURE_2D, texture); // analog to bindBuffer. Binds texture to currently active texture-bindpoint (aka. texture unit).

    let height = 0;
    let width = 0;
    let channels = 0;
    let flattened: number[] = [];
    if (Array.isArray(data)) {
      height = data.length;
      width = data[0].length;
      channels = data[0][0].length;
      flattened = data.flat().flat();
    } else {
      height = data.height;
      width = data.width;
      channels = data.channels;
      flattened = Array.from(data.data);
    }

    // to be used for data. we want no interpolation of data, so disallow mipmap and interpolation.
    const level = 0;
    const border = 0;
    const paras = Texture.getTextureParas(gl, t, flattened);

    if (channels !== 4) {
      // have WebGL digest data one byte at a time.
      // (Per default tries 4 bytes at a time, which causes errors when our data is not a multiple of 4).
      const alignment = 1; // valid values are 1, 2, 4, and 8.
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);
    }

    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      paras.internalFormat,
      width,
      height,
      border,
      paras.format,
      paras.type,
      paras.binData
    ); // analog to bufferData

    if (config.edges === 'clamp') {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); // when accessing texture2D(u_tex, vec2(1.2, 0.3)), this becomes  texture2D(u_tex, vec2(1.0, 0.3))
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); // when accessing texture2D(u_tex, vec2(0.2, 1.3)), this becomes  texture2D(u_tex, vec2(0.2, 1.0))
    } else if (config.edges === 'repeat') {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    }

    if (config.interpolate === 'linear') {
      if (!paras.allowsInterpolation)
        throw new Error(`Float-data-textures can not be interpolated; chose "none" instead.`);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    } else if (config.interpolate === 'none') {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }

    gl.bindTexture(gl.TEXTURE_2D, null); // unbinding

    super(gl, t, texture, level, paras.internalFormat, paras.format, paras.type, width, height, border);
  }
}

export class EmptyTexture extends Texture {
  constructor(
    gl: WebGL2RenderingContext,
    private config: {
      width: number;
      height: number;
      type: TextureType;
      edges?: 'clamp' | 'repeat' | 'mirror';
      interpolate?: 'none' | 'linear';
    }
  ) {
    const { width, height, type, edges, interpolate } = config;
    if (width <= 0 || height <= 0) {
      throw new Error('Width and height must be positive.');
    }
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error('No texture was created');
    }

    const paras = Texture.getTextureParas(gl, type, []);

    gl.activeTexture(gl.TEXTURE0 + textureConstructionBindPoint); // so that we don't overwrite another texture in the next line.
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, paras.internalFormat, width, height, 0, paras.format, paras.type, null);

    if (edges === 'clamp') {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    } else if (edges === 'repeat') {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    }

    if (interpolate === 'linear') {
      if (!paras.allowsInterpolation)
        throw new Error(`Float-data-textures can not be interpolated; chose "none" instead.`);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    } else if (interpolate === 'none') {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }

    gl.bindTexture(gl.TEXTURE_2D, null);

    super(gl, type, texture, 0, paras.internalFormat, paras.format, paras.type, width, height, 0);
  }
}

export class RenderBuffer implements Datum {
  renderBuffer: WebGLRenderbuffer;

  /**
 | gl.RGBA4 // : 4 red bits, 4 green bits, 4 blue bits 4 alpha bits.
 | gl.RGB565 // : 5 red bits, 6 green bits, 5 blue bits.
 | gl.RGB5_A1 // : 5 red bits, 5 green bits, 5 blue bits, 1 alpha bit.
 | gl.DEPTH_COMPONENT16 // : 16 depth bits.
 | gl.STENCIL_INDEX8 // : 8 stencil bits.
 | gl.DEPTH_STENCIL;
   */
  constructor(
    private gl: WebGL2RenderingContext,
    private config: { width: number; height: number; format: 'depth' | 'rgba' }
  ) {
    const renderBuffer = gl.createRenderbuffer()!;

    let format: number = gl.RGBA4;
    switch (config.format) {
      case 'depth':
        format = gl.DEPTH_COMPONENT16;
        break;
      case 'rgba':
        format = gl.RGBA4;
        break;
    }

    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, format, config.width, config.height);
    this.renderBuffer = renderBuffer;
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  }

  public bind() {
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.renderBuffer);
  }

  public unbind() {
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.renderBuffer);
  }

  public destroy() {
    this.gl.deleteRenderbuffer(this.renderBuffer);
  }
}

export interface VaoBufferConfig {
  location: number;
  type: WebGLAttributeType;
  nrInstances: number;
  normalize: boolean;
}

/**
 * - VBO's (vertex buffers) are only added to the state of the VAO (vertex array) when that VAO is bound
 *    (https://computergraphics.stackexchange.com/questions/10029/when-unsetting-a-vao-should-you-also-unbind-the-associated-vbos)
 */
abstract class AVertexArray implements Intermediate {
  attachedBuffers: { [location: number]: { buffer: Buffer; config: any } } = {};
  indexBuffer?: WebGLBuffer;

  constructor(readonly gl: WebGL2RenderingContext) {}

  /**
   * Requires that buffer is bound to ARRAY_BUFFER!
   * Run this though GlobalState.
   */
  public attachBuffer(buffer: Buffer, config: VaoBufferConfig) {
    const gl = this.gl;

    const byteSize = sizeOf(gl, buffer.dataPointType);
    const attributeLocation = config.location;
    const nrInstances = config.nrInstances;
    const normalize = config.normalize;
    switch (config.type) {
      /**
       * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
       * index: A GLuint specifying the index of the vertex attribute that is to be modified.
       * size: A GLint specifying the number of components per vertex attribute. Must be 1, 2, 3, or 4.
       * type: A GLenum specifying the data type of each component in the array.
       * normalized: A GLboolean specifying whether integer data values should be normalized into a certain range when being cast to a float.
       * stride: A GLsizei specifying the offset in bytes between the beginning of consecutive vertex attributes. Cannot be larger than 255. If stride is 0, the attribute is assumed to be tightly packed, that is, the attributes are not interleaved but each attribute is in a separate block, and the next vertex' attribute follows immediately after the current vertex.
       * offset: A GLintptr specifying an offset in bytes of the first component in the vertex attribute array. Must be a multiple of the byte length of type.
       * nrInstances: how many times should one value be repeated before moving on to the next? If you have 100 instances but only two colors, apply each color to 50 instances.
       */
      case 'float':
        gl.enableVertexAttribArray(attributeLocation);
        gl.vertexAttribPointer(attributeLocation, 1, buffer.dataPointType, normalize, 1 * byteSize, 0);
        if (nrInstances) gl.vertexAttribDivisor(attributeLocation, nrInstances);
        break;
      case 'vec2':
        gl.enableVertexAttribArray(attributeLocation);
        gl.vertexAttribPointer(attributeLocation, 2, buffer.dataPointType, normalize, 2 * byteSize, 0);
        if (nrInstances) gl.vertexAttribDivisor(attributeLocation, nrInstances);
        break;
      case 'vec3':
        gl.enableVertexAttribArray(attributeLocation);
        gl.vertexAttribPointer(attributeLocation, 3, buffer.dataPointType, normalize, 3 * byteSize, 0);
        if (nrInstances) gl.vertexAttribDivisor(attributeLocation, nrInstances);
        break;
      case 'vec4':
        gl.enableVertexAttribArray(attributeLocation);
        gl.vertexAttribPointer(attributeLocation, 4, buffer.dataPointType, normalize, 4 * byteSize, 0);
        if (nrInstances) gl.vertexAttribDivisor(attributeLocation, nrInstances);
        break;
      case 'mat2':
        gl.enableVertexAttribArray(attributeLocation + 0);
        gl.vertexAttribPointer(
          attributeLocation + 0,
          2,
          buffer.dataPointType,
          normalize,
          4 * byteSize,
          0 * 2 * byteSize
        );
        if (nrInstances) gl.vertexAttribDivisor(attributeLocation, nrInstances);
        gl.enableVertexAttribArray(attributeLocation + 1);
        gl.vertexAttribPointer(
          attributeLocation + 1,
          2,
          buffer.dataPointType,
          normalize,
          4 * byteSize,
          1 * 2 * byteSize
        );
        if (nrInstances) gl.vertexAttribDivisor(attributeLocation + 1, nrInstances);
        break;
      case 'mat3':
        gl.enableVertexAttribArray(attributeLocation + 0);
        gl.vertexAttribPointer(
          attributeLocation + 0,
          3,
          buffer.dataPointType,
          normalize,
          9 * byteSize,
          0 * 3 * byteSize
        );
        if (nrInstances) gl.vertexAttribDivisor(attributeLocation, nrInstances);
        gl.enableVertexAttribArray(attributeLocation + 1);
        gl.vertexAttribPointer(
          attributeLocation + 1,
          3,
          buffer.dataPointType,
          normalize,
          9 * byteSize,
          1 * 3 * byteSize
        );
        if (nrInstances) gl.vertexAttribDivisor(attributeLocation + 1, nrInstances);
        gl.enableVertexAttribArray(attributeLocation + 2);
        gl.vertexAttribPointer(
          attributeLocation + 2,
          3,
          buffer.dataPointType,
          normalize,
          9 * byteSize,
          2 * 3 * byteSize
        );
        if (nrInstances) gl.vertexAttribDivisor(attributeLocation + 2, nrInstances);
        break;
      case 'mat4':
        gl.enableVertexAttribArray(attributeLocation + 0);
        gl.vertexAttribPointer(
          attributeLocation + 0,
          4,
          buffer.dataPointType,
          normalize,
          16 * byteSize,
          0 * 4 * byteSize
        ); // col 0
        if (nrInstances) gl.vertexAttribDivisor(attributeLocation, nrInstances);
        gl.enableVertexAttribArray(attributeLocation + 1);
        gl.vertexAttribPointer(
          attributeLocation + 1,
          4,
          buffer.dataPointType,
          normalize,
          16 * byteSize,
          1 * 4 * byteSize
        ); // col 1
        if (nrInstances) gl.vertexAttribDivisor(attributeLocation + 1, nrInstances);
        gl.enableVertexAttribArray(attributeLocation + 2);
        gl.vertexAttribPointer(
          attributeLocation + 2,
          4,
          buffer.dataPointType,
          normalize,
          16 * byteSize,
          2 * 4 * byteSize
        ); // col 2
        if (nrInstances) gl.vertexAttribDivisor(attributeLocation + 2, nrInstances);
        gl.enableVertexAttribArray(attributeLocation + 3);
        gl.vertexAttribPointer(
          attributeLocation + 3,
          4,
          buffer.dataPointType,
          normalize,
          16 * byteSize,
          3 * 4 * byteSize
        ); // col 3
        if (nrInstances) gl.vertexAttribDivisor(attributeLocation + 3, nrInstances);
        break;
    }

    this.attachedBuffers[config.location] = { buffer, config };
  }

  public detachBuffer(buffer: Buffer) {
    for (const [loc, buffData] of Object.entries(this.attachedBuffers)) {
      if (buffData.buffer === buffer) {
        this.gl.disableVertexAttribArray(buffData.config.location);
      }
    }
  }

  /**
   * Assumes that this VertexArray is bound.
   * Better call through GlobalState.
   */
  attachIndexBuffer(index: Uint16Array) {
    const gl = this.gl;
    const indexBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);
    this.indexBuffer = indexBuffer;
  }

  abstract destroy(recursive: boolean): void;
}

export class VertexArray extends AVertexArray {
  vertexArray: WebGLVertexArrayObject;

  constructor(gl: WebGL2RenderingContext, private config: {}) {
    super(gl);
    const va = gl.createVertexArray()!;
    this.vertexArray = va;
  }

  destroy(recursive = false) {
    if (recursive) {
      for (const [loc, bdata] of Object.entries(this.attachedBuffers)) {
        this.detachBuffer(bdata.buffer);
        bdata.buffer.destroy();
      }
      if (this.indexBuffer) {
        this.gl.deleteBuffer(this.indexBuffer);
      }
    }
    this.gl.deleteVertexArray(this.vertexArray);
  }
}

export class DefaultVertexArray extends AVertexArray {
  constructor(gl: WebGL2RenderingContext, private config: {}) {
    super(gl);
  }

  destroy(recursive = false) {
    if (recursive) {
      for (const [loc, bdata] of Object.entries(this.attachedBuffers)) {
        this.detachBuffer(bdata.buffer);
        bdata.buffer.destroy();
      }
      if (this.indexBuffer) {
        this.gl.deleteBuffer(this.indexBuffer);
      }
    }
  }
}

abstract class ATransformFeedback implements Intermediate {
  boundBuffers: Buffer[] = [];

  constructor(protected gl: WebGL2RenderingContext) {}

  abstract bind(): void;
  abstract unbind(): void;

  /** assumes that this tf is bound to global state. use via global state. */
  public attachBuffer(buffer: Buffer, slot?: number) {
    // gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
    const bufferSlot = slot ?? this.boundBuffers.length;
    this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, bufferSlot, buffer.buffer);
    // gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
  }

  /** assumes that this tf is bound to global state. use via global state. */
  public detachBuffer(buffer: Buffer) {
    const bufferSlot = this.boundBuffers.indexOf(buffer);
    this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, bufferSlot, null);
  }

  abstract destroy(recursive: boolean): void;
}

export class TransformFeedback extends ATransformFeedback {
  transformFeedback: WebGLTransformFeedback;

  constructor(gl: WebGL2RenderingContext, private config: {}) {
    super(gl);
    const tf = gl.createTransformFeedback()!;
    this.transformFeedback = tf;
  }

  public bind() {
    this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, this.transformFeedback);
  }

  public unbind() {
    this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, null);
  }

  destroy(recursive = false) {
    if (recursive) {
      for (const buffer of this.boundBuffers) {
        this.detachBuffer(buffer);
        buffer.destroy();
      }
    }
    this.gl.deleteTransformFeedback(this.transformFeedback);
  }
}

export class DefaultTransformFeedback extends ATransformFeedback {
  constructor(gl: WebGL2RenderingContext, private config: {}) {
    super(gl);
  }

  public bind() {
    this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, null);
  }

  public unbind() {
    this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK, null);
  }

  public destroy(recursive = false) {
    if (recursive) {
      for (const buffer of this.boundBuffers) {
        this.detachBuffer(buffer);
        buffer.destroy();
      }
    }
  }
}

export class Framebuffer implements Intermediate {
  frameBuffer: WebGLFramebuffer;
  boundTextures: Texture[] = [];
  boundDepthRenderBuffer?: RenderBuffer;

  constructor(private gl: WebGL2RenderingContext, private config: {}) {
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    this.frameBuffer = fb;
  }

  public bind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
    this.gl.drawBuffers(this.getBufferNames());
  }

  public unbind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  /** assumes that this framebuffer is bound. call through global-state */
  public attachTexture(texture: Texture, location = 0) {
    const gl = this.gl;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + location, gl.TEXTURE_2D, texture.texture, 0);
    this.boundTextures[location] = texture;
  }

  /** assumes that this framebuffer is bound. call through global-state */
  public attachDepthRenderBuffer(renderBuffer: RenderBuffer) {
    const gl = this.gl;
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer.renderBuffer);
    this.boundDepthRenderBuffer = renderBuffer;
  }

  getBufferNames(): Iterable<number> {
    const out: number[] = [];
    for (let i = 0; i < this.boundTextures.length; i++) {
      if (i === 0) out.push(this.gl.COLOR_ATTACHMENT0);
      if (i === 1) out.push(this.gl.COLOR_ATTACHMENT1);
      if (i === 2) out.push(this.gl.COLOR_ATTACHMENT2);
      if (i === 3) out.push(this.gl.COLOR_ATTACHMENT3);
      if (i === 4) out.push(this.gl.COLOR_ATTACHMENT4);
      if (i === 5) out.push(this.gl.COLOR_ATTACHMENT5);
      if (i === 6) out.push(this.gl.COLOR_ATTACHMENT6);
      if (i === 7) out.push(this.gl.COLOR_ATTACHMENT7);
    }
    return out;
  }

  public destroy(recursive = false) {
    if (recursive) {
      for (const texture of this.boundTextures) {
        texture.destroy();
      }
      if (this.boundDepthRenderBuffer) {
        this.boundDepthRenderBuffer.destroy();
      }
    }
    this.gl.deleteFramebuffer(this.frameBuffer);
  }
}

export class GlobalState {
  boundProgram?: Program;
  boundVertexArray: AVertexArray;
  defaultVertexArray: DefaultVertexArray;
  boundBuffer?: Buffer;
  boundTextures: Texture[] = [];
  boundFrameBuffer?: Framebuffer;
  boundTransformFeedback: ATransformFeedback;
  defaultTransformFeedback: DefaultTransformFeedback;

  constructor(
    readonly gl: WebGL2RenderingContext,
    private config: {
      viewport?: [number, number, number, number];
      depthTest?: boolean;
      cullFace?: boolean;
      allowAlpha?: boolean;
      colorBufferFloat?: boolean;
    }
  ) {
    if (config.viewport) gl.viewport(...config.viewport);
    if (config.depthTest) {
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
    }
    if (config.cullFace) gl.enable(gl.CULL_FACE);
    if (config.allowAlpha) {
      gl.enable(gl.BLEND);
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    if (config.colorBufferFloat === undefined || config.colorBufferFloat === true) {
      const ext = gl.getExtension('EXT_color_buffer_float');
      if (!ext)
        console.error(`Could not load extension "EXT_color_buffer_float". Won't be able to render to f32 textures!`);
    }
    this.defaultVertexArray = new DefaultVertexArray(gl, {});
    this.boundVertexArray = this.defaultVertexArray;
    this.defaultTransformFeedback = new DefaultTransformFeedback(gl, {});
    this.boundTransformFeedback = this.defaultTransformFeedback;
  }

  setViewPort(vp: [number, number, number, number]) {
    this.config.viewport = vp;
    this.gl.viewport(...this.config.viewport);
  }

  bindProgram(p: Program, checkFirst = true) {
    if (checkFirst && p === this.boundProgram) return;
    this.gl.useProgram(p.program);
    this.boundProgram = p;
  }

  bindVertexArray(v: VertexArray, checkFirst = true) {
    if (checkFirst && v === this.boundVertexArray) return;
    this.gl.bindVertexArray(v.vertexArray);
    this.boundVertexArray = v;
  }

  unbindVertexArray() {
    if (this.boundVertexArray === this.defaultVertexArray) return;
    this.gl.bindVertexArray(null);
    this.boundVertexArray = this.defaultVertexArray;
  }

  bindBuffer(b: Buffer) {
    if (b === this.boundBuffer) return;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, b.buffer);
    this.boundBuffer = b;
  }

  unbindBuffer() {
    if (this.boundBuffer === undefined) return;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    this.boundBuffer = undefined;
  }

  bindFramebuffer(frameBuffer: Framebuffer) {
    if (this.boundFrameBuffer === frameBuffer) return;
    frameBuffer.bind();
    this.boundFrameBuffer = frameBuffer;
    if (frameBuffer.boundTextures.length > 0)
      this.setViewPort([0, 0, frameBuffer.boundTextures[0].width, frameBuffer.boundTextures[0].height]);
  }

  unbindFramebuffer() {
    if (this.boundFrameBuffer === undefined) return;
    this.boundFrameBuffer.unbind();
    this.boundFrameBuffer = undefined;
    this.setViewPort([0, 0, this.gl.canvas.width, this.gl.canvas.height]);
  }

  bindBufferToDefaultVertexArray(
    buffer: Buffer,
    config: {
      location: number;
      type: WebGLAttributeType;
      nrInstances: number;
      normalize: boolean;
    }
  ) {
    this.unbindVertexArray();
    this.bindBuffer(buffer);
    this.defaultVertexArray.attachBuffer(buffer, config);
    this.unbindBuffer();
  }

  bindBufferToVertexArray(vertexArray: VertexArray, buffer: Buffer, config: VaoBufferConfig) {
    this.bindVertexArray(vertexArray);
    this.bindBuffer(buffer);
    vertexArray.attachBuffer(buffer, config);
    this.unbindBuffer();
    // this.unbindVertexArray(); <--vaos may stay bound
  }

  bindIndexToVertexArray(vertexArray: VertexArray, indexBuffer: Uint16Array) {
    this.bindVertexArray(vertexArray);
    vertexArray.attachIndexBuffer(indexBuffer);
    // this.unbindVertexArray(); <--vaos may stay bound
  }

  bindTextureToFramebuffer(frameBuffer: Framebuffer, texture: Texture, position = 0) {
    this.bindFramebuffer(frameBuffer);
    frameBuffer.attachTexture(texture, position);

    if (texture.type === this.gl.FLOAT && this.config.colorBufferFloat === false)
      console.warn(
        `You're trying to add a float-texture to a framebuffer.
        WebGL cannot render to float-textures - this won't work.
        https://registry.khronos.org/OpenGL/specs/es/3.0/es_spec_3.0.pdf#page=143&zoom=100,168,666`
      );

    if (frameBuffer === this.boundFrameBuffer) this.setViewPort([0, 0, texture.width, texture.height]);
    // this.unbindFramebuffer(); <-- framebuffers may stay bound
  }

  bindDepthToFramebuffer(frameBuffer: Framebuffer, depth: RenderBuffer) {
    this.bindFramebuffer(frameBuffer);
    frameBuffer.attachDepthRenderBuffer(depth);
    // this.unbindFramebuffer(); <-- framebuffers may stay bound
  }

  getUniformLocation(prog: Program, uniformName: string) {
    // this.bindProgram(prog);
    const location = prog.getUniformLocation(uniformName);
    return location;
  }

  setUniformValue(program: Program, uniformName: string, type: WebGLUniformType, values: number[]) {
    this.bindProgram(program);
    program.setUniformValue(uniformName, type, values);
  }

  bindTextureToSlot(texture: Texture, slot?: number) {
    const gl = this.gl;
    const t = texture.texture;
    const bindPoint = slot ?? this.boundTextures.length;
    if (bindPoint > gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS)) {
      throw new Error(
        `There are only ${gl.getParameter(
          gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS
        )} texture bind points, but you tried to bind to point nr. ${bindPoint}.`
      );
    }
    if (bindPoint === textureConstructionBindPoint) {
      console.error(`You are about to bind to the dedicated texture-construction bind point (nr. ${textureConstructionBindPoint}).
                            If after this call another texture is built, your shader will now use that new texture instead of this one!
                            Consider using another bind point.`);
    }
    gl.activeTexture(gl.TEXTURE0 + bindPoint); // pick active texture-slot. analog to enableVertexAttribArray
    gl.bindTexture(gl.TEXTURE_2D, t); // analog to bindBuffer. Binds texture to currently active texture-bindpoint (aka. texture unit).

    this.boundTextures[bindPoint] = texture;
    return bindPoint;
  }

  bindTexUniformToSlot(program: Program, uniformName: string, slot: number) {
    this.bindProgram(program);
    const uniformLocation = program.getUniformLocation(uniformName);
    this.gl.uniform1i(uniformLocation, slot); // tell program where to find texture-uniform. analog to vertexAttribPointer
  }

  updateVideoTexture(videoTex: VideoTexture) {
    for (let i = 0; i < this.boundTextures.length; i++) {
      const tex = this.boundTextures[i];
      if (tex === videoTex) {
        videoTex.update(i);
      }
    }
  }

  bindTextureToUniform(program: Program, uniformName: string, texture: Texture, slot?: number) {
    const bindPoint = this.bindTextureToSlot(texture, slot);
    this.bindTexUniformToSlot(program, uniformName, bindPoint);
  }

  bindTransformFeedback(tf: TransformFeedback) {
    if (this.boundTransformFeedback === tf) return;
    this.boundTransformFeedback = tf;
    tf.bind();
  }

  unbindTransformFeedback() {
    if (this.boundTransformFeedback === this.defaultTransformFeedback) return;
    this.boundTransformFeedback.unbind();
    this.boundTransformFeedback === this.defaultTransformFeedback;
  }

  bindBufferToTransformFeedback(tf: TransformFeedback, buffer: Buffer, slot?: number) {
    this.bindTransformFeedback(tf);
    this.boundTransformFeedback?.attachBuffer(buffer, slot);
  }

  clearScreen(clearColor: [number, number, number, number], framebuffer?: Framebuffer) {
    if (framebuffer) this.bindFramebuffer(framebuffer);
    else this.unbindFramebuffer();
    this.gl.clearColor(...clearColor);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  drawArrays(program: Program, vao: VertexArray | null, drawingMode: GlDrawingMode, nrVertices: number) {
    this.bindProgram(program);
    if (vao) this.bindVertexArray(vao);
    else this.unbindVertexArray();
    this.unbindFramebuffer();

    const theDrawingMode = getDrawingMode(this.gl, drawingMode);
    this.gl.drawArrays(theDrawingMode, 0, nrVertices);
  }

  drawArraysInstanced(
    program: Program,
    vao: VertexArray | null,
    drawingMode: GlDrawingMode,
    nrVerticesPerInstance: number,
    nrInstances: number
  ) {
    this.bindProgram(program);
    if (vao) this.bindVertexArray(vao);
    else this.unbindVertexArray();

    const theDrawingMode = getDrawingMode(this.gl, drawingMode);
    this.gl.drawArraysInstanced(theDrawingMode, 0, nrVerticesPerInstance, nrInstances);
  }

  drawArraysToFramebuffer(
    program: Program,
    vao: VertexArray | null,
    drawingMode: GlDrawingMode,
    nrVertices: number,
    framebuffer: Framebuffer | null
  ) {
    if (framebuffer) this.bindFramebuffer(framebuffer);
    else this.unbindFramebuffer();
    this.bindProgram(program);
    if (vao) this.bindVertexArray(vao);
    else this.unbindVertexArray();

    const theDrawingMode = getDrawingMode(this.gl, drawingMode);
    this.gl.drawArrays(theDrawingMode, 0, nrVertices);
  }

  drawArraysInstancedToFramebuffer(
    program: Program,
    vao: VertexArray | null,
    drawingMode: GlDrawingMode,
    nrVerticesPerInstance: number,
    nrInstances: number,
    framebuffer: Framebuffer | null
  ) {
    if (framebuffer) this.bindFramebuffer(framebuffer);
    else this.unbindFramebuffer();
    this.bindProgram(program);
    if (vao) this.bindVertexArray(vao);
    else this.unbindVertexArray();

    const theDrawingMode = getDrawingMode(this.gl, drawingMode);
    this.gl.drawArraysInstanced(theDrawingMode, 0, nrVerticesPerInstance, nrInstances);
  }

  drawArraysToTransformFeedback(
    program: Program,
    vao: VertexArray | null,
    drawingMode: GlDrawingMode,
    nrVertices: number,
    tf: TransformFeedback,
    runFragmentShader: boolean
  ) {
    const gl = this.gl;

    const theDrawingMode = getDrawingMode(this.gl, drawingMode);
    this.bindProgram(program);
    if (!runFragmentShader) gl.enable(gl.RASTERIZER_DISCARD);
    this.bindTransformFeedback(tf);
    gl.beginTransformFeedback(theDrawingMode);
    if (vao) this.bindVertexArray(vao);
    else this.unbindVertexArray();
    this.unbindFramebuffer();

    this.gl.drawArrays(theDrawingMode, 0, nrVertices);

    gl.endTransformFeedback();
    this.unbindTransformFeedback();
    if (!runFragmentShader) gl.disable(gl.RASTERIZER_DISCARD);
  }

  drawArraysToFramebufferAndTransformFeedback(
    program: Program,
    vao: VertexArray | null,
    drawingMode: GlDrawingMode,
    nrVertices: number,
    tf: TransformFeedback,
    framebuffer: Framebuffer | null
  ) {
    const gl = this.gl;
    if (framebuffer) this.bindFramebuffer(framebuffer);
    else this.unbindFramebuffer();

    const theDrawingMode = getDrawingMode(this.gl, drawingMode);
    this.bindProgram(program);
    this.bindTransformFeedback(tf);
    gl.beginTransformFeedback(theDrawingMode);
    if (vao) this.bindVertexArray(vao);
    else this.unbindVertexArray();

    // cant call this.drawArrays, because that would deactivate the framebuffer
    this.gl.drawArrays(theDrawingMode, 0, nrVertices);

    gl.endTransformFeedback();
    this.unbindTransformFeedback();
  }

  drawElements(
    program: Program,
    vao: VertexArray,
    drawingMode: GlDrawingMode,
    nrElements: number,
    framebuffer?: Framebuffer
  ) {
    this.bindProgram(program);
    this.bindVertexArray(vao);
    if (!vao.indexBuffer) throw new Error(`VertexArray has no index buffer attached. Cannot draw elements`);
    if (framebuffer) this.bindFramebuffer(framebuffer);
    else this.unbindFramebuffer();
    let theDrawingMode = getDrawingMode(this.gl, drawingMode);
    this.gl.drawElements(theDrawingMode, nrElements, this.gl.UNSIGNED_SHORT, 0);
  }

  destroy(recursive = false) {
    this.boundTransformFeedback.destroy(recursive);
    if (this.boundFrameBuffer) this.boundFrameBuffer?.destroy(recursive);
    for (const texture of this.boundTextures) {
      texture.destroy();
    }
    if (this.boundBuffer) this.boundBuffer.destroy();
    this.boundVertexArray.destroy(recursive);
    if (this.boundProgram) this.boundProgram.destroy();
  }
}

export function getDrawingMode(gl: WebGL2RenderingContext, dm: GlDrawingMode) {
  switch (dm) {
    case 'triangles':
      return gl.TRIANGLES;
    case 'lines':
      return gl.LINES;
    case 'points':
      return gl.POINTS;
  }
}
