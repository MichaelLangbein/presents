class VariableStore {
  programs: { name: string; val: WebGLProgram }[] = [];
  shaders: { name: string; val: WebGLShader }[] = [];
  buffers: { name: string; val: WebGLBuffer }[] = [];
  textures: { name: string; val: WebGLTexture }[] = [];
  vertexArrs: { name: string; val: WebGLVertexArrayObject }[] = [];
  uniformLocs: { name: string; val: WebGLUniformLocation }[] = [];
  renderBuffers: { name: string; val: WebGLRenderbuffer }[] = [];
  frameBuffers: { name: string; val: WebGLFramebuffer }[] = [];
  transformFeedbacks: { name: string; val: WebGLTransformFeedback }[] = [];

  addProgram(val: WebGLProgram) {
    const name = `program${this.programs.length}`;
    this.programs.push({ name, val });
    return name;
  }

  addShader(val: WebGLShader) {
    const name = `shader${this.shaders.length}`;
    this.shaders.push({ name, val });
    return name;
  }

  addBuffer(val: WebGLBuffer) {
    const name = `buffer${this.buffers.length}`;
    this.buffers.push({ name, val });
    return name;
  }

  addTexture(val: WebGLTexture) {
    const name = `texture${this.textures.length}`;
    this.textures.push({ name, val });
    return name;
  }

  addVertexArr(val: WebGLVertexArrayObject) {
    const name = `vertexArr${this.vertexArrs.length}`;
    this.vertexArrs.push({ name, val });
    return name;
  }

  addUniformLocation(val: WebGLUniformLocation) {
    const name = `uniformLocation${this.uniformLocs.length}`;
    this.uniformLocs.push({ name, val });
    return name;
  }

  addRenderBuffer(val: WebGLRenderbuffer) {
    const name = `renderBuffer${this.renderBuffers.length}`;
    this.renderBuffers.push({ name, val });
    return name;
  }

  addFrameBuffer(val: WebGLFramebuffer) {
    const name = `frameBuffer${this.frameBuffers.length}`;
    this.frameBuffers.push({ name, val });
    return name;
  }

  addTransformFeedback(val: WebGLTransformFeedback) {
    const name = `transformFeedback${this.transformFeedbacks.length}`;
    this.transformFeedbacks.push({ name, val });
    return name;
  }

  getProgramName(given: WebGLProgram) {
    for (const { name, val } of this.programs) {
      if (val === given) return name;
    }
  }

  getShaderName(given: WebGLShader) {
    for (const { name, val } of this.shaders) {
      if (val === given) return name;
    }
  }

  getBufferName(given: WebGLBuffer) {
    for (const { name, val } of this.buffers) {
      if (val === given) return name;
    }
  }

  getTextureName(given: WebGLTexture) {
    for (const { name, val } of this.textures) {
      if (val === given) return name;
    }
  }

  getVertexArrName(given: WebGLVertexArrayObject) {
    for (const { name, val } of this.vertexArrs) {
      if (val === given) return name;
    }
  }

  getUniformLocationName(given: WebGLUniformLocation) {
    for (const { name, val } of this.uniformLocs) {
      if (val === given) return name;
    }
  }

  getRenderbufferName(given: WebGLRenderbuffer) {
    for (const { name, val } of this.renderBuffers) {
      if (val === given) return name;
    }
  }

  getFramebufferName(given: WebGLFramebuffer) {
    for (const { name, val } of this.frameBuffers) {
      if (val === given) return name;
    }
  }

  getTransformFeedbackName(given: WebGLTransformFeedback) {
    for (const { name, val } of this.transformFeedbacks) {
      if (val === given) return name;
    }
  }
}
const variableStore = new VariableStore();

function logArgs(args: any[]) {
  const stringifiedArgs: string[] = [];
  for (const arg of args) {
    if (typeof arg === 'string' || arg instanceof String) {
      stringifiedArgs.push('`' + arg + '`');
    } else if (arg === null) {
      stringifiedArgs.push('null');
    } else if (ArrayBuffer.isView(arg)) {
      // @ts-ignore
      if (arg.BYTES_PER_ELEMENT === 4) {
        stringifiedArgs.push('new Float32Array([' + arg + '])');
      }
      // @ts-ignore
      if (arg.BYTES_PER_ELEMENT === 2) {
        stringifiedArgs.push('new Uint16Array([' + arg + '])');
      }
      // @ts-ignore
      if (arg.BYTES_PER_ELEMENT === 1) {
        stringifiedArgs.push('new Uint8Array([' + arg + '])');
      }
    } else if (Array.isArray(arg)) {
      const stringArg = arg.map((el) => (typeof el === 'string' || el instanceof String ? `"${el}"` : el));
      const stringifiedArr = '[' + stringArg.join(', ') + ']';
      stringifiedArgs.push(stringifiedArr);
    } else if (arg instanceof WebGLProgram) {
      const name = variableStore.getProgramName(arg);
      stringifiedArgs.push(name!);
    } else if (arg instanceof WebGLShader) {
      const name = variableStore.getShaderName(arg);
      stringifiedArgs.push(name!);
    } else if (arg instanceof WebGLBuffer) {
      const name = variableStore.getBufferName(arg);
      stringifiedArgs.push(name!);
    } else if (arg instanceof WebGLTexture) {
      const name = variableStore.getTextureName(arg);
      stringifiedArgs.push(name!);
    } else if (arg instanceof WebGLVertexArrayObject) {
      const name = variableStore.getVertexArrName(arg);
      stringifiedArgs.push(name!);
    } else if (arg instanceof WebGLUniformLocation) {
      const name = variableStore.getUniformLocationName(arg);
      stringifiedArgs.push(name!);
    } else if (arg instanceof WebGLRenderbuffer) {
      const name = variableStore.getRenderbufferName(arg);
      stringifiedArgs.push(name!);
    } else if (arg instanceof WebGLFramebuffer) {
      const name = variableStore.getFramebufferName(arg);
      stringifiedArgs.push(name!);
    } else if (arg instanceof WebGLTransformFeedback) {
      const name = variableStore.getTransformFeedbackName(arg);
      stringifiedArgs.push(name!);
    } else if (arg instanceof HTMLCanvasElement) {
      stringifiedArgs.push(`makeTextCanvas("F", 32, 32, "red")`);
    } else {
      stringifiedArgs.push('' + arg);
    }
  }
  return stringifiedArgs.join(', ');
}

export function logCall(functionName: string, args: any[], result: any) {
  const argsStringified = logArgs(args);

  switch (functionName) {
    case 'createProgram':
      const progName = variableStore.addProgram(result);
      return `const ${progName} = gl.${functionName}(${argsStringified});`;
    case 'createShader':
      const shaderName = variableStore.addShader(result);
      return `const ${shaderName} = gl.${functionName}(${argsStringified});`;
    case 'createBuffer':
      const bufferName = variableStore.addBuffer(result);
      return `const ${bufferName} = gl.${functionName}(${argsStringified});`;
    case 'createTexture':
      const textureName = variableStore.addTexture(result);
      return `const ${textureName} = gl.${functionName}(${argsStringified});`;
    case 'createVertexArray':
      const vertArrName = variableStore.addVertexArr(result);
      return `const ${vertArrName} = gl.${functionName}(${argsStringified});`;
    case 'createRenderbuffer':
      const renderBufferName = variableStore.addRenderBuffer(result);
      return `const ${renderBufferName} = gl.${functionName}(${argsStringified});`;
    case 'createFramebuffer':
      const frameBufferName = variableStore.addFrameBuffer(result);
      return `const ${frameBufferName} = gl.${functionName}(${argsStringified});`;
    case 'createTransformFeedback':
      const tfName = variableStore.addTransformFeedback(result);
      return `const ${tfName} = gl.${functionName}(${argsStringified});`;
    case 'getUniformLocation':
      const unifName = variableStore.addUniformLocation(result);
      return `const ${unifName} = gl.${functionName}(${argsStringified});`;
    // @ts-ignore (deliberate fall-through)
    case 'bindTexture':
      if (argsStringified.includes('null')) return `//  gl.${functionName}(${argsStringified});`;
    default:
      return `gl.${functionName}(${argsStringified});`;
  }
}

export const loggedLines: string[] = [];
export function webglLoggingProxy(gl: WebGL2RenderingContext, instrumentConsoleLog = false) {
  console.warn(
    `This debug proxy is known to interact with spector.js and mozila's makeDebugContext. Deactivate both of them.`
  );

  const log = console.log;

  const glProxy = new Proxy(gl, {
    get(target: WebGL2RenderingContext, key) {
      if (!(key in target)) return undefined;
      const value = (target as any)[key];
      if (typeof value === 'function') {
        return (...args: any[]) => {
          const result = value.apply(target, args);
          const err = gl.getError();
          const line = logCall(value.name, args, result);
          if (err) {
            const errorMessage = `Noticed an error: ${err}, when calling: "${line}"`;
            console.warn(errorMessage);
            loggedLines.push('// ' + errorMessage);
            loggedLines.push(line);
          } else {
            log(line);
            loggedLines.push(line);
          }
          return result;
        };
      } else {
        return value;
      }
    },
  });

  // @ts-ignore
  glProxy.getLog = () => {
    return loggedLines;
  };

  if (instrumentConsoleLog) {
    function instrumentedConsoleLog(args: any[]) {
      for (const arg of args) {
        loggedLines.push('// ' + arg);
      }
      log(args);
    }
    console.log = instrumentedConsoleLog;
  }

  return glProxy;
}

export function getBufferContent(gl: WebGL2RenderingContext, buffer: WebGLBuffer, nrFloats: number) {
  const downloadedData = new Float32Array(nrFloats);
  gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, buffer);
  gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, downloadedData);
  gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);
  return downloadedData;
}

export const getDebugInfo = (gl: WebGL2RenderingContext): object => {
  const baseInfo = {
    renderer: gl.getParameter(gl.RENDERER),
    currentProgram: gl.getParameter(gl.CURRENT_PROGRAM),
    arrayBuffer: gl.getParameter(gl.ARRAY_BUFFER_BINDING),
    elementArrayBuffer: gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING),
    frameBuffer: gl.getParameter(gl.FRAMEBUFFER_BINDING),
    renderBuffer: gl.getParameter(gl.RENDERBUFFER_BINDING),
    texture: gl.getParameter(gl.TEXTURE_BINDING_2D),
    viewPort: gl.getParameter(gl.VIEWPORT),
    transformFeedback: gl.getParameter(gl.TRANSFORM_FEEDBACK),
  };
  const programInfo = {
    infoLog: gl.getProgramInfoLog(baseInfo.currentProgram),
  };
  return {
    baseInfo,
    programInfo,
  };
};

/**
 * (From https://hacks.mozilla.org/2013/04/the-concepts-of-webgl/ and https://stackoverflow.com/questions/56303648/webgl-rendering-buffers:)
 * Ignoring handmade framebuffers, WebGl has two framebuffers that are always in use: the `frontbuffer/displaybuffer` and the `backbuffer/drawingbuffer`.
 * WebGl per default renders to the `drawingbuffer`, aka. the `backbuffer`.
 * There is also the currently displayed buffer, named the `frontbuffer` aka. the `displaybuffer`.
 * the WebGL programmer has no explicit access to the frontbuffer whatsoever.
 *
 * Once you called `clear`, `drawElements` or `drawArrays`, the browser marks the canvas as `needs to be composited`.
 * Assuming `preserveDrawingBuffer == false` (the default): Immediately before compositing, the browser
 *  - swaps the back- and frontbuffer
 *  - clears the new backbuffer.
 * If `preserveDrawingBuffer === true`: Immediately before compositing, the browser
 *  - copies the drawingbuffer to the frontbuffer.
 *
 * As a consequence, if you're going to use canvas.toDataURL or canvas.toBlob or gl.readPixels or any other way of getting data from a WebGL canvas,
 * unless you read it in the same event it will likely have been cleared when you try to read it.
 *
 * In the past, old games always preserved the drawing buffer, so they'd only have to change those pixels that have actually changed. Nowadays preserveDrawingBuffer is false by default.
 *
 * A (almost brutal) workaround to get the canvas to preserve the drawingBuffer can be found here: https://stackoverflow.com/questions/26783586/canvas-todataurl-returns-blank-image
 *
 *
 *
 * glReadPixels returns pixel data from the frame buffer, starting with the pixel whose lower left corner is at location (x, y),
 * into client memory starting at location data. The GL_PACK_ALIGNMENT parameter, set with the glPixelStorei command,
 * affects the processing of the pixel data before it is placed into client memory.
 * glReadPixels returns values from each pixel with lower left corner at x + i y + j for 0 <= i < width and 0 <= j < height .
 * This pixel is said to be the ith pixel in the jth row. Pixels are returned in row order from the lowest to the highest row,
 * left to right in each row.
 * Return values are placed in memory as follows. If format is GL_ALPHA, a single value is returned and the data for the ith pixel
 * in the jth row is placed in location j ⁢ width + i . GL_RGB returns three values and GL_RGBA returns four values for each pixel,
 * with all values corresponding to a single pixel occupying contiguous space in data. Storage parameter GL_PACK_ALIGNMENT,
 * set by glPixelStorei, affects the way that data is written into memory. See glPixelStorei for a description.
 *
 * @TODO: WebGL2 allows to use `drawBuffer` and `readBuffer`, so that we are no longer limited to only the current framebuffer.
 */
export const getCurrentFramebuffersPixels = (canvas: HTMLCanvasElement): ArrayBuffer => {
  const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
  if (!gl) {
    throw new Error('no context');
  }

  const format = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT);
  const type = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE);

  let pixels;
  if (type === gl.UNSIGNED_BYTE) {
    pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
  } else if (
    type === gl.UNSIGNED_SHORT_5_6_5 ||
    type === gl.UNSIGNED_SHORT_4_4_4_4 ||
    type === gl.UNSIGNED_SHORT_5_5_5_1
  ) {
    pixels = new Uint16Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
  } else if (type === gl.FLOAT) {
    pixels = new Float32Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
  } else {
    throw new Error(`Did not understand pixel data type ${type} for format ${format}`);
  }

  // Just like `toDataURL` or `toBlob`, `readPixels` does not access the frontbuffer.
  // It accesses the backbuffer or any other currently active framebuffer.
  gl.readPixels(0, 0, canvas.width, canvas.height, format, type, pixels);

  return pixels;
};
