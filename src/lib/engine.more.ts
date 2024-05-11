import {
    Buffer, Framebuffer, getDrawingMode, GlDrawingMode, GlobalState, Program, RenderBuffer, Texture,
    TransformFeedback, VaoBufferConfig, VertexArray, WebGLUniformType
} from "./engine";


export interface GraphConfig {
  program:
    | {
        vertexSource: string;
        fragmentSource: string;
      }
    | Program;
  inputs: {
    uniforms: { [uniformName: string]: { value: number[]; type: WebGLUniformType } };
    /** order of textures equals order in texture-array */
    textures: { [texUniformName: string]: Texture };
    /** each graph keeps all its attrs in its own vao */
    attributes: { [attributeName: string]: { buffer: Buffer; config: Omit<VaoBufferConfig, 'location'> } };
    index?: Uint16Array;
  };
  outputs: {
    transformFeedback?: { data: { [outputAttrName: string]: Buffer }; runFragmentShader: boolean };
    frameBuffer?: { textures: Texture[]; depth?: RenderBuffer };
  };
  settings: {
    drawingMode: GlDrawingMode;
    viewport: number[];
    instanced: false | number;
    nrVertices: number;
  };
}

function validateAllVariablesPresent(config: GraphConfig) {
  const vertexSource: string = (config.program as any).vertexSource;
  const fragmentSource: string = (config.program as any).fragmentSource;

  for (const [attrName, attrData] of Object.entries(config.inputs.attributes)) {
    const attrString = `in ${attrData.config.type} ${attrName};`;
    if (!vertexSource.includes(attrString) && !fragmentSource.includes(attrString))
      console.error(`Neither vertex nor fragment shader contain the string: ${attrString}`);
  }

  for (const [uniName, uniData] of Object.entries(config.inputs.uniforms)) {
    const uniString = `uniform ${uniData.type} ${uniName};`;
    if (!vertexSource.includes(uniString) && !fragmentSource.includes(uniString))
      console.error(`Neither vertex nor fragment shader contain the string: ${uniString}`);
  }

  for (const [texName, _] of Object.entries(config.inputs.textures)) {
    const texString = `uniform sampler2D ${texName};`;
    if (!vertexSource.includes(texString) && !fragmentSource.includes(texString))
      console.error(`Neither vertex nor fragment shader contain the string: ${texString}`);
  }

  for (const [tfName, tfData] of Object.entries(config.outputs.transformFeedback?.data ?? {})) {
    const outString = ` ${tfName};`;
    if (!vertexSource.includes(outString)) console.error(`Vertex source doesn't contain the string ${outString}`);
  }

  // @TODO: do the same thing in the other direction: make sure that all shader variables are in config
}

export class Graph {
  readonly program: Program;
  readonly vao: VertexArray;
  protected fb?: Framebuffer;
  protected tf?: TransformFeedback;

  constructor(readonly gs: GlobalState, readonly config: GraphConfig) {
    if (config.program instanceof Program) {
      this.program = config.program;
    } else {
      validateAllVariablesPresent(config);
      this.program = new Program(gs.gl, {
        ...config.program,
        transformFeedbackVaryings: Object.keys(config.outputs.transformFeedback?.data ?? []),
      });
    }

    this.vao = new VertexArray(gs.gl, {});
    for (const [attrName, attrData] of Object.entries(config.inputs.attributes)) {
      const location = this.program.getAttributeLocation(attrName);
      this.gs.bindBufferToVertexArray(this.vao, attrData.buffer, { ...attrData.config, location });
    }

    if (config.inputs.index) {
      this.gs.bindIndexToVertexArray(this.vao, config.inputs.index);
    }

    if (this.config.outputs.frameBuffer) {
      const fbc = this.config.outputs.frameBuffer;
      this.fb = new Framebuffer(gs.gl, {});
      let slot = 0;
      for (const texture of fbc.textures) {
        gs.bindTextureToFramebuffer(this.fb, texture, slot);
        slot += 1;
      }
      if (fbc.depth) gs.bindDepthToFramebuffer(this.fb, fbc.depth);
      this.fb.bind();
    }

    if (this.config.outputs.transformFeedback) {
      this.tf = new TransformFeedback(gs.gl, {});
      let slot = 0;
      for (const [_, buffer] of Object.entries(this.config.outputs.transformFeedback.data)) {
        gs.bindBufferToTransformFeedback(this.tf, buffer, slot);
        slot += 1;
      }
    }
  }

  activate() {
    this.gs.bindProgram(this.program);

    // attributes
    this.gs.bindVertexArray(this.vao);

    // textures
    let slot = 0;
    for (const [texUniName, texture] of Object.entries(this.config.inputs.textures)) {
      this.gs.bindTextureToSlot(texture, slot);
      this.gs.bindTexUniformToSlot(this.program, texUniName, slot);
      slot += 1;
    }

    // uniforms
    for (const [uniformName, uniformData] of Object.entries(this.config.inputs.uniforms)) {
      this.gs.setUniformValue(this.program, uniformName, uniformData.type, uniformData.value);
    }

    // framebuffer
    if (this.fb) this.gs.bindFramebuffer(this.fb);
    else this.gs.unbindFramebuffer();

    // transform feedback
    if (this.tf) this.gs.bindTransformFeedback(this.tf);
    else this.gs.unbindTransformFeedback();

    // settings
    this.gs.setViewPort(this.config.settings.viewport as [number, number, number, number]);
  }

  updateUniform(uniformName: string, data: number[]) {
    const type = this.config.inputs.uniforms[uniformName].type;
    this.config.inputs.uniforms[uniformName].value = data;
    this.gs.setUniformValue(this.program, uniformName, type, data);
  }

  updateTexture(textureUniformName: string, texture: Texture) {
    let slot = 0;
    for (const [texUniName, texture] of Object.entries(this.config.inputs.textures)) {
      if (texUniName === textureUniformName) {
        this.gs.bindTextureToUniform(this.program, textureUniformName, texture, slot);
        break;
      } else {
        slot += 1;
      }
    }
    this.config.inputs.textures[textureUniformName] = texture;
  }

  updateViewport(viewport: [number, number, number, number]) {
    this.gs.setViewPort(viewport);
    this.config.settings.viewport = viewport;
  }

  private unboundFramebuffer?: Framebuffer;
  updateFramebuffer(framebufferConfig: GraphConfig['outputs']['frameBuffer'] | undefined) {
    this.config.outputs.frameBuffer = framebufferConfig;
    if (framebufferConfig === undefined) {
      this.gs.unbindFramebuffer();
      this.unboundFramebuffer = this.fb;
      this.fb = undefined;
    } else {
      const fbc = framebufferConfig;
      if (!this.fb) this.fb = this.unboundFramebuffer;
      if (!this.fb) {
        console.warn('having to create new fb - is this on purpose?');
        this.fb = new Framebuffer(this.gs.gl, {});
      }
      let slot = 0;
      for (const texture of fbc.textures) {
        this.gs.bindTextureToFramebuffer(this.fb, texture, slot);
        slot += 1;
      }
      if (fbc.depth) this.gs.bindDepthToFramebuffer(this.fb!, fbc.depth);
    }
  }

  draw(clearColor?: [number, number, number, number]) {
    if (clearColor) {
      this.gs.clearScreen(clearColor, this.fb ?? undefined);
    }

    const gl = this.gs.gl;
    const settings = this.config.settings;

    this.activate();

    if (this.tf) {
      this.gs.gl.beginTransformFeedback(getDrawingMode(gl, settings.drawingMode));
      if (this.config.outputs.transformFeedback?.runFragmentShader === false) gl.enable(gl.RASTERIZER_DISCARD);
    }

    if (this.config.inputs.index) {
      if (this.fb) {
        this.gs.drawElements(this.program, this.vao, settings.drawingMode, this.config.inputs.index.length, this.fb);
      } else {
        this.gs.drawElements(this.program, this.vao, settings.drawingMode, this.config.inputs.index.length);
      }
    } else {
      if (this.fb) {
        if (settings.instanced) {
          this.gs.drawArraysInstancedToFramebuffer(
            this.program,
            this.vao,
            settings.drawingMode,
            settings.nrVertices,
            settings.instanced,
            this.fb
          );
        } else {
          this.gs.drawArraysToFramebuffer(this.program, this.vao, settings.drawingMode, settings.nrVertices, this.fb);
        }
      } else {
        if (settings.instanced) {
          this.gs.drawArraysInstanced(
            this.program,
            this.vao,
            settings.drawingMode,
            settings.nrVertices,
            settings.instanced as number
          );
        } else {
          this.gs.drawArrays(this.program, this.vao, settings.drawingMode, settings.nrVertices);
        }
      }
    }

    if (this.tf) {
      gl.endTransformFeedback();
      if (this.config.outputs.transformFeedback?.runFragmentShader === false) gl.disable(gl.RASTERIZER_DISCARD);
    }
  }

  destroy(recursive = false) {
    if (this.tf) this.tf.destroy(recursive);
    if (this.fb) this.fb.destroy(recursive);
    this.vao.destroy(recursive);
    this.program.destroy();
  }
}
