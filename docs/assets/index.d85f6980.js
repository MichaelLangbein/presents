var P=Object.defineProperty;var B=(a,e,t)=>e in a?P(a,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[e]=t;var d=(a,e,t)=>(B(a,typeof e!="symbol"?e+"":e,t),t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))r(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const n of i.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&r(n)}).observe(document,{childList:!0,subtree:!0});function t(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerpolicy&&(i.referrerPolicy=s.referrerpolicy),s.crossorigin==="use-credentials"?i.credentials="include":s.crossorigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(s){if(s.ep)return;s.ep=!0;const i=t(s);fetch(s.href,i)}})();const y=7;function D(a,e){switch(e){case a.FLOAT:return 4;case a.UNSIGNED_BYTE:return 1;case a.BYTE:case a.SHORT:case a.UNSIGNED_SHORT:default:throw new Error(`Unknown type ${e}`)}}class E{constructor(e,t){d(this,"program");this.gl=e,this.config=t;const r=e.createShader(e.VERTEX_SHADER);if(e.shaderSource(r,t.vertexSource),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS))throw new Error(e.getShaderInfoLog(r));const s=e.createShader(e.FRAGMENT_SHADER);if(e.shaderSource(s,t.fragmentSource),e.compileShader(s),!e.getShaderParameter(s,e.COMPILE_STATUS))throw new Error(e.getShaderInfoLog(s));const i=e.createProgram();if(e.attachShader(i,r),e.attachShader(i,s),t.transformFeedbackVaryings&&e.transformFeedbackVaryings(i,t.transformFeedbackVaryings,e.SEPARATE_ATTRIBS),e.linkProgram(i),!e.getProgramParameter(i,e.LINK_STATUS))throw new Error(e.getProgramInfoLog(i));e.detachShader(i,r),e.deleteShader(r),e.detachShader(i,s),e.deleteShader(s),this.program=i}getAttributeLocation(e){return this.gl.getAttribLocation(this.program,e)}getUniformLocation(e){return this.gl.getUniformLocation(this.program,e)}setUniformValue(e,t,r){const s=this.gl,i=this.getUniformLocation(e);switch(t){case"bool":s.uniform1i(i,r[0]);break;case"bvec2":s.uniform2i(i,r[0],r[1]);break;case"bvec3":s.uniform3i(i,r[0],r[1],r[2]);break;case"bvec4":s.uniform4i(i,r[0],r[1],r[2],r[3]);break;case"bool[]":s.uniform1iv(i,r);break;case"bvec2[]":s.uniform2iv(i,r);break;case"bvec3[]":s.uniform3iv(i,r);break;case"bvec4[]":s.uniform4iv(i,r);break;case"int":s.uniform1i(i,r[0]);break;case"ivec2":s.uniform2i(i,r[0],r[1]);break;case"ivec3":s.uniform3i(i,r[0],r[1],r[2]);break;case"ivec4":s.uniform4i(i,r[0],r[1],r[2],r[3]);break;case"int[]":s.uniform1iv(i,r);break;case"ivec2[]":s.uniform2iv(i,r);break;case"ivec3[]":s.uniform3iv(i,r);break;case"ivec4[]":s.uniform4iv(i,r);break;case"float":s.uniform1f(i,r[0]);break;case"vec2":s.uniform2f(i,r[0],r[1]);break;case"vec3":s.uniform3f(i,r[0],r[1],r[2]);break;case"vec4":s.uniform4f(i,r[0],r[1],r[2],r[3]);break;case"float[]":s.uniform1fv(i,r);break;case"vec2[]":s.uniform2fv(i,r);break;case"vec3[]":s.uniform3fv(i,r);break;case"vec4[]":s.uniform4fv(i,r);break;case"mat2":s.uniformMatrix2fv(i,!1,r);break;case"mat3":s.uniformMatrix3fv(i,!1,r);break;case"mat4":s.uniformMatrix4fv(i,!1,r);break;default:throw Error(`Type ${t} not implemented.`)}}destroy(){this.gl.deleteProgram(this.program)}}class p{constructor(e,t){d(this,"buffer");d(this,"dataPointType");this.gl=e,this.config=t;const r=e.createBuffer();if(e.bindBuffer(e.ARRAY_BUFFER,r),e.bufferData(e.ARRAY_BUFFER,t.data,t.changesOften?e.DYNAMIC_DRAW:e.STATIC_DRAW),e.bindBuffer(e.ARRAY_BUFFER,null),this.buffer=r,t.data.BYTES_PER_ELEMENT===4)this.dataPointType=e.FLOAT;else if(t.data.BYTES_PER_ELEMENT===2)this.dataPointType=e.UNSIGNED_SHORT;else if(t.data.BYTES_PER_ELEMENT===1)this.dataPointType=e.UNSIGNED_BYTE;else throw new Error("Buffer data may be Float32Array(gl.FLOAT), UInt16Array(gl.UNSIGNED_SHORT) or UInt8Array(gl.UNSIGNED_BYTE)")}updateData(e){const t=this.gl;t.bindBuffer(t.ARRAY_BUFFER,this.buffer),t.bufferData(t.ARRAY_BUFFER,e,this.config.changesOften?t.DYNAMIC_DRAW:t.STATIC_DRAW),t.bindBuffer(t.ARRAY_BUFFER,null),this.config.data=e}destroy(){this.gl.deleteBuffer(this.buffer)}getBufferContent(){const e=this.gl,t=this.config.data.length;let r;if(this.config.data instanceof Float32Array&&(r=new Float32Array(t)),this.config.data instanceof Uint16Array&&(r=new Uint16Array(t)),this.config.data instanceof Uint8Array)r=new Uint8Array(t);else throw Error("This should not have happened: this buffer does not seem to have a numeric array as data.");return e.bindBuffer(e.TRANSFORM_FEEDBACK_BUFFER,this.buffer),e.getBufferSubData(e.TRANSFORM_FEEDBACK_BUFFER,0,r),e.bindBuffer(e.TRANSFORM_FEEDBACK_BUFFER,null),r}}class v{constructor(e,t,r,s,i,n,o,f,u,h){this.gl=e,this.textureType=t,this.texture=r,this.level=s,this.internalformat=i,this.format=n,this.type=o,this.width=f,this.height=u,this.border=h}static getTextureParas(e,t,r){switch(t){case"ubyte1":return{internalFormat:e.LUMINANCE,format:e.LUMINANCE,type:e.UNSIGNED_BYTE,binData:new Uint8Array(r),allowsInterpolation:!0,allowsRenderingTo:!0};case"ubyte4":return{internalFormat:e.RGBA,format:e.RGBA,type:e.UNSIGNED_BYTE,binData:new Uint8Array(r),allowsInterpolation:!0,allowsRenderingTo:!0};case"byte32":return{internalFormat:e.RGBA32I,format:e.RGBA_INTEGER,type:e.INT,binData:new Int32Array(r),allowsInterpolation:!1,allowsRenderingTo:!0};case"float1":return{internalFormat:e.R32F,format:e.RED,type:e.FLOAT,binData:new Float32Array(r),allowsInterpolation:!1,allowsRenderingTo:!1};case"float4":return{internalFormat:e.RGBA32F,format:e.RGBA,type:e.FLOAT,binData:new Float32Array(r),allowsInterpolation:!1,allowsRenderingTo:!1}}}destroy(){this.gl.deleteTexture(this.texture)}getCurrentPixels(e){const t=this.gl,r=this.format,s=this.type;let i;if(s===t.UNSIGNED_BYTE)i=new Uint8Array(t.drawingBufferWidth*t.drawingBufferHeight*4);else if(s===t.UNSIGNED_SHORT_5_6_5||s===t.UNSIGNED_SHORT_4_4_4_4||s===t.UNSIGNED_SHORT_5_5_5_1)i=new Uint16Array(t.drawingBufferWidth*t.drawingBufferHeight*4);else if(s===t.FLOAT)i=new Float32Array(t.drawingBufferWidth*t.drawingBufferHeight*4);else throw new Error(`Did not understand pixel data type ${s} for format ${r}`);if(t.bindFramebuffer(t.FRAMEBUFFER,e),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,this.texture,0),t.checkFramebufferStatus(t.FRAMEBUFFER)==t.FRAMEBUFFER_COMPLETE)return t.bindFramebuffer(t.FRAMEBUFFER,e),t.readPixels(0,0,this.width,this.height,r,s,i),t.bindFramebuffer(t.FRAMEBUFFER,null),i}}class S extends v{constructor(e,t){const r=e.createTexture();if(!r)throw new Error("No texture was created");e.activeTexture(e.TEXTURE0+y),e.bindTexture(e.TEXTURE_2D,r),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST);const s=0,i=e.RGBA,n=e.RGBA,o=e.UNSIGNED_BYTE;e.texImage2D(e.TEXTURE_2D,s,i,n,o,t.video),super(e,"ubyte4",r,s,i,n,o,t.video.videoWidth,t.video.videoHeight,0),this.config=t}update(e){const t=this.gl;t.activeTexture(t.TEXTURE0+e),t.bindTexture(t.TEXTURE_2D,this.texture);const r=0,s=t.RGBA,i=t.RGBA,n=t.UNSIGNED_BYTE;t.texImage2D(t.TEXTURE_2D,r,s,i,n,this.config.video)}static async loadVideo(e){function t(r,s){const i=setInterval(()=>{r.currentTime>.1&&r.videoWidth>0&&(clearInterval(i),s(r))})}return new Promise((r,s)=>{var i=document.createElement("video");return i.autoplay=!0,i.src=e,i.volume=0,i.loop=!0,i.addEventListener("playing",()=>t(i,r)),i.onerror=s,i.play(),i})}}class F extends v{constructor(e,t){const{width:r,height:s,type:i,edges:n,interpolate:o}=t;if(r<=0||s<=0)throw new Error("Width and height must be positive.");const f=e.createTexture();if(!f)throw new Error("No texture was created");const u=v.getTextureParas(e,i,[]);if(e.activeTexture(e.TEXTURE0+y),e.bindTexture(e.TEXTURE_2D,f),e.texImage2D(e.TEXTURE_2D,0,u.internalFormat,r,s,0,u.format,u.type,null),n==="clamp"?(e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)):n==="repeat"?(e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.REPEAT),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.REPEAT)):(e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.MIRRORED_REPEAT),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.MIRRORED_REPEAT)),o==="linear"){if(!u.allowsInterpolation)throw new Error('Float-data-textures can not be interpolated; chose "none" instead.');e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR)}else o==="none"&&(e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST));e.bindTexture(e.TEXTURE_2D,null),super(e,i,f,0,u.internalFormat,u.format,u.type,r,s,0),this.config=t}}class g{constructor(e){d(this,"attachedBuffers",{});d(this,"indexBuffer");this.gl=e}attachBuffer(e,t){const r=this.gl,s=D(r,e.dataPointType),i=t.location,n=t.nrInstances,o=t.normalize;switch(t.type){case"float":r.enableVertexAttribArray(i),r.vertexAttribPointer(i,1,e.dataPointType,o,1*s,0),n&&r.vertexAttribDivisor(i,n);break;case"vec2":r.enableVertexAttribArray(i),r.vertexAttribPointer(i,2,e.dataPointType,o,2*s,0),n&&r.vertexAttribDivisor(i,n);break;case"vec3":r.enableVertexAttribArray(i),r.vertexAttribPointer(i,3,e.dataPointType,o,3*s,0),n&&r.vertexAttribDivisor(i,n);break;case"vec4":r.enableVertexAttribArray(i),r.vertexAttribPointer(i,4,e.dataPointType,o,4*s,0),n&&r.vertexAttribDivisor(i,n);break;case"mat2":r.enableVertexAttribArray(i+0),r.vertexAttribPointer(i+0,2,e.dataPointType,o,4*s,0*2*s),n&&r.vertexAttribDivisor(i,n),r.enableVertexAttribArray(i+1),r.vertexAttribPointer(i+1,2,e.dataPointType,o,4*s,1*2*s),n&&r.vertexAttribDivisor(i+1,n);break;case"mat3":r.enableVertexAttribArray(i+0),r.vertexAttribPointer(i+0,3,e.dataPointType,o,9*s,0*3*s),n&&r.vertexAttribDivisor(i,n),r.enableVertexAttribArray(i+1),r.vertexAttribPointer(i+1,3,e.dataPointType,o,9*s,1*3*s),n&&r.vertexAttribDivisor(i+1,n),r.enableVertexAttribArray(i+2),r.vertexAttribPointer(i+2,3,e.dataPointType,o,9*s,2*3*s),n&&r.vertexAttribDivisor(i+2,n);break;case"mat4":r.enableVertexAttribArray(i+0),r.vertexAttribPointer(i+0,4,e.dataPointType,o,16*s,0*4*s),n&&r.vertexAttribDivisor(i,n),r.enableVertexAttribArray(i+1),r.vertexAttribPointer(i+1,4,e.dataPointType,o,16*s,1*4*s),n&&r.vertexAttribDivisor(i+1,n),r.enableVertexAttribArray(i+2),r.vertexAttribPointer(i+2,4,e.dataPointType,o,16*s,2*4*s),n&&r.vertexAttribDivisor(i+2,n),r.enableVertexAttribArray(i+3),r.vertexAttribPointer(i+3,4,e.dataPointType,o,16*s,3*4*s),n&&r.vertexAttribDivisor(i+3,n);break}this.attachedBuffers[t.location]={buffer:e,config:t}}detachBuffer(e){for(const[t,r]of Object.entries(this.attachedBuffers))r.buffer===e&&this.gl.disableVertexAttribArray(r.config.location)}attachIndexBuffer(e){const t=this.gl,r=t.createBuffer();t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,r),t.bufferData(t.ELEMENT_ARRAY_BUFFER,e,t.STATIC_DRAW),this.indexBuffer=r}}class U extends g{constructor(t,r){super(t);d(this,"vertexArray");this.config=r;const s=t.createVertexArray();this.vertexArray=s}destroy(t=!1){if(t){for(const[r,s]of Object.entries(this.attachedBuffers))this.detachBuffer(s.buffer),s.buffer.destroy();this.indexBuffer&&this.gl.deleteBuffer(this.indexBuffer)}this.gl.deleteVertexArray(this.vertexArray)}}class N extends g{constructor(e,t){super(e),this.config=t}destroy(e=!1){if(e){for(const[t,r]of Object.entries(this.attachedBuffers))this.detachBuffer(r.buffer),r.buffer.destroy();this.indexBuffer&&this.gl.deleteBuffer(this.indexBuffer)}}}class w{constructor(e){d(this,"boundBuffers",[]);this.gl=e}attachBuffer(e,t){const r=t!=null?t:this.boundBuffers.length;this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER,r,e.buffer)}detachBuffer(e){const t=this.boundBuffers.indexOf(e);this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER,t,null)}}class I extends w{constructor(t,r){super(t);d(this,"transformFeedback");this.config=r;const s=t.createTransformFeedback();this.transformFeedback=s}bind(){this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK,this.transformFeedback)}unbind(){this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK,null)}destroy(t=!1){if(t)for(const r of this.boundBuffers)this.detachBuffer(r),r.destroy();this.gl.deleteTransformFeedback(this.transformFeedback)}}class V extends w{constructor(e,t){super(e),this.config=t}bind(){this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK,null)}unbind(){this.gl.bindTransformFeedback(this.gl.TRANSFORM_FEEDBACK,null)}destroy(e=!1){if(e)for(const t of this.boundBuffers)this.detachBuffer(t),t.destroy()}}class R{constructor(e,t){d(this,"frameBuffer");d(this,"boundTextures",[]);d(this,"boundDepthRenderBuffer");this.gl=e,this.config=t;const r=e.createFramebuffer();e.bindFramebuffer(e.FRAMEBUFFER,r),this.frameBuffer=r}bind(){this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,this.frameBuffer),this.gl.drawBuffers(this.getBufferNames())}unbind(){this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,null)}attachTexture(e,t=0){const r=this.gl;r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+t,r.TEXTURE_2D,e.texture,0),this.boundTextures[t]=e}attachDepthRenderBuffer(e){const t=this.gl;t.framebufferRenderbuffer(t.FRAMEBUFFER,t.DEPTH_ATTACHMENT,t.RENDERBUFFER,e.renderBuffer),this.boundDepthRenderBuffer=e}getBufferNames(){const e=[];for(let t=0;t<this.boundTextures.length;t++)t===0&&e.push(this.gl.COLOR_ATTACHMENT0),t===1&&e.push(this.gl.COLOR_ATTACHMENT1),t===2&&e.push(this.gl.COLOR_ATTACHMENT2),t===3&&e.push(this.gl.COLOR_ATTACHMENT3),t===4&&e.push(this.gl.COLOR_ATTACHMENT4),t===5&&e.push(this.gl.COLOR_ATTACHMENT5),t===6&&e.push(this.gl.COLOR_ATTACHMENT6),t===7&&e.push(this.gl.COLOR_ATTACHMENT7);return e}destroy(e=!1){if(e){for(const t of this.boundTextures)t.destroy();this.boundDepthRenderBuffer&&this.boundDepthRenderBuffer.destroy()}this.gl.deleteFramebuffer(this.frameBuffer)}}class k{constructor(e,t){d(this,"boundProgram");d(this,"boundVertexArray");d(this,"defaultVertexArray");d(this,"boundBuffer");d(this,"boundTextures",[]);d(this,"boundFrameBuffer");d(this,"boundTransformFeedback");d(this,"defaultTransformFeedback");this.gl=e,this.config=t,t.viewport&&e.viewport(...t.viewport),t.depthTest&&(e.enable(e.DEPTH_TEST),e.depthFunc(e.LEQUAL)),t.cullFace&&e.enable(e.CULL_FACE),t.allowAlpha&&(e.enable(e.BLEND),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA)),(t.colorBufferFloat===void 0||t.colorBufferFloat===!0)&&(e.getExtension("EXT_color_buffer_float")||console.error(`Could not load extension "EXT_color_buffer_float". Won't be able to render to f32 textures!`)),this.defaultVertexArray=new N(e,{}),this.boundVertexArray=this.defaultVertexArray,this.defaultTransformFeedback=new V(e,{}),this.boundTransformFeedback=this.defaultTransformFeedback}setViewPort(e){this.config.viewport=e,this.gl.viewport(...this.config.viewport)}bindProgram(e,t=!0){t&&e===this.boundProgram||(this.gl.useProgram(e.program),this.boundProgram=e)}bindVertexArray(e,t=!0){t&&e===this.boundVertexArray||(this.gl.bindVertexArray(e.vertexArray),this.boundVertexArray=e)}unbindVertexArray(){this.boundVertexArray!==this.defaultVertexArray&&(this.gl.bindVertexArray(null),this.boundVertexArray=this.defaultVertexArray)}bindBuffer(e){e!==this.boundBuffer&&(this.gl.bindBuffer(this.gl.ARRAY_BUFFER,e.buffer),this.boundBuffer=e)}unbindBuffer(){this.boundBuffer!==void 0&&(this.gl.bindBuffer(this.gl.ARRAY_BUFFER,null),this.boundBuffer=void 0)}bindFramebuffer(e){this.boundFrameBuffer!==e&&(e.bind(),this.boundFrameBuffer=e,e.boundTextures.length>0&&this.setViewPort([0,0,e.boundTextures[0].width,e.boundTextures[0].height]))}unbindFramebuffer(){this.boundFrameBuffer!==void 0&&(this.boundFrameBuffer.unbind(),this.boundFrameBuffer=void 0,this.setViewPort([0,0,this.gl.canvas.width,this.gl.canvas.height]))}bindBufferToDefaultVertexArray(e,t){this.unbindVertexArray(),this.bindBuffer(e),this.defaultVertexArray.attachBuffer(e,t),this.unbindBuffer()}bindBufferToVertexArray(e,t,r){this.bindVertexArray(e),this.bindBuffer(t),e.attachBuffer(t,r),this.unbindBuffer()}bindIndexToVertexArray(e,t){this.bindVertexArray(e),e.attachIndexBuffer(t)}bindTextureToFramebuffer(e,t,r=0){this.bindFramebuffer(e),e.attachTexture(t,r),t.type===this.gl.FLOAT&&this.config.colorBufferFloat===!1&&console.warn(`You're trying to add a float-texture to a framebuffer.
        WebGL cannot render to float-textures - this won't work.
        https://registry.khronos.org/OpenGL/specs/es/3.0/es_spec_3.0.pdf#page=143&zoom=100,168,666`),e===this.boundFrameBuffer&&this.setViewPort([0,0,t.width,t.height])}bindDepthToFramebuffer(e,t){this.bindFramebuffer(e),e.attachDepthRenderBuffer(t)}getUniformLocation(e,t){return e.getUniformLocation(t)}setUniformValue(e,t,r,s){this.bindProgram(e),e.setUniformValue(t,r,s)}bindTextureToSlot(e,t){const r=this.gl,s=e.texture,i=t!=null?t:this.boundTextures.length;if(i>r.getParameter(r.MAX_COMBINED_TEXTURE_IMAGE_UNITS))throw new Error(`There are only ${r.getParameter(r.MAX_COMBINED_TEXTURE_IMAGE_UNITS)} texture bind points, but you tried to bind to point nr. ${i}.`);return i===y&&console.error(`You are about to bind to the dedicated texture-construction bind point (nr. ${y}).
                            If after this call another texture is built, your shader will now use that new texture instead of this one!
                            Consider using another bind point.`),r.activeTexture(r.TEXTURE0+i),r.bindTexture(r.TEXTURE_2D,s),this.boundTextures[i]=e,i}bindTexUniformToSlot(e,t,r){this.bindProgram(e);const s=e.getUniformLocation(t);this.gl.uniform1i(s,r)}updateVideoTexture(e){for(let t=0;t<this.boundTextures.length;t++)this.boundTextures[t]===e&&e.update(t)}bindTextureToUniform(e,t,r,s){const i=this.bindTextureToSlot(r,s);this.bindTexUniformToSlot(e,t,i)}bindTransformFeedback(e){this.boundTransformFeedback!==e&&(this.boundTransformFeedback=e,e.bind())}unbindTransformFeedback(){this.boundTransformFeedback!==this.defaultTransformFeedback&&(this.boundTransformFeedback.unbind(),this.boundTransformFeedback,this.defaultTransformFeedback)}bindBufferToTransformFeedback(e,t,r){var s;this.bindTransformFeedback(e),(s=this.boundTransformFeedback)==null||s.attachBuffer(t,r)}clearScreen(e,t){t?this.bindFramebuffer(t):this.unbindFramebuffer(),this.gl.clearColor(...e),this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT)}drawArrays(e,t,r,s){this.bindProgram(e),t?this.bindVertexArray(t):this.unbindVertexArray(),this.unbindFramebuffer();const i=c(this.gl,r);this.gl.drawArrays(i,0,s)}drawArraysInstanced(e,t,r,s,i){this.bindProgram(e),t?this.bindVertexArray(t):this.unbindVertexArray();const n=c(this.gl,r);this.gl.drawArraysInstanced(n,0,s,i)}drawArraysToFramebuffer(e,t,r,s,i){i?this.bindFramebuffer(i):this.unbindFramebuffer(),this.bindProgram(e),t?this.bindVertexArray(t):this.unbindVertexArray();const n=c(this.gl,r);this.gl.drawArrays(n,0,s)}drawArraysInstancedToFramebuffer(e,t,r,s,i,n){n?this.bindFramebuffer(n):this.unbindFramebuffer(),this.bindProgram(e),t?this.bindVertexArray(t):this.unbindVertexArray();const o=c(this.gl,r);this.gl.drawArraysInstanced(o,0,s,i)}drawArraysToTransformFeedback(e,t,r,s,i,n){const o=this.gl,f=c(this.gl,r);this.bindProgram(e),n||o.enable(o.RASTERIZER_DISCARD),this.bindTransformFeedback(i),o.beginTransformFeedback(f),t?this.bindVertexArray(t):this.unbindVertexArray(),this.unbindFramebuffer(),this.gl.drawArrays(f,0,s),o.endTransformFeedback(),this.unbindTransformFeedback(),n||o.disable(o.RASTERIZER_DISCARD)}drawArraysToFramebufferAndTransformFeedback(e,t,r,s,i,n){const o=this.gl;n?this.bindFramebuffer(n):this.unbindFramebuffer();const f=c(this.gl,r);this.bindProgram(e),this.bindTransformFeedback(i),o.beginTransformFeedback(f),t?this.bindVertexArray(t):this.unbindVertexArray(),this.gl.drawArrays(f,0,s),o.endTransformFeedback(),this.unbindTransformFeedback()}drawElements(e,t,r,s,i){if(this.bindProgram(e),this.bindVertexArray(t),!t.indexBuffer)throw new Error("VertexArray has no index buffer attached. Cannot draw elements");i?this.bindFramebuffer(i):this.unbindFramebuffer();let n=c(this.gl,r);this.gl.drawElements(n,s,this.gl.UNSIGNED_SHORT,0)}destroy(e=!1){var t;this.boundTransformFeedback.destroy(e),this.boundFrameBuffer&&((t=this.boundFrameBuffer)==null||t.destroy(e));for(const r of this.boundTextures)r.destroy();this.boundBuffer&&this.boundBuffer.destroy(),this.boundVertexArray.destroy(e),this.boundProgram&&this.boundProgram.destroy()}}function c(a,e){switch(e){case"triangles":return a.TRIANGLES;case"lines":return a.LINES;case"points":return a.POINTS}}function O(a){var r,s;const e=a.program.vertexSource,t=a.program.fragmentSource;for(const[i,n]of Object.entries(a.inputs.attributes)){const o=`in ${n.config.type} ${i};`;!e.includes(o)&&!t.includes(o)&&console.error(`Neither vertex nor fragment shader contain the string: ${o}`)}for(const[i,n]of Object.entries(a.inputs.uniforms)){const o=`uniform ${n.type} ${i};`;!e.includes(o)&&!t.includes(o)&&console.error(`Neither vertex nor fragment shader contain the string: ${o}`)}for(const[i,n]of Object.entries(a.inputs.textures)){const o=`uniform sampler2D ${i};`;!e.includes(o)&&!t.includes(o)&&console.error(`Neither vertex nor fragment shader contain the string: ${o}`)}for(const[i,n]of Object.entries((s=(r=a.outputs.transformFeedback)==null?void 0:r.data)!=null?s:{})){const o=` ${i};`;e.includes(o)||console.error(`Vertex source doesn't contain the string ${o}`)}}class A{constructor(e,t){d(this,"program");d(this,"vao");d(this,"fb");d(this,"tf");d(this,"unboundFramebuffer");var r,s;this.gs=e,this.config=t,t.program instanceof E?this.program=t.program:(O(t),this.program=new E(e.gl,{...t.program,transformFeedbackVaryings:Object.keys((s=(r=t.outputs.transformFeedback)==null?void 0:r.data)!=null?s:[])})),this.vao=new U(e.gl,{});for(const[i,n]of Object.entries(t.inputs.attributes)){const o=this.program.getAttributeLocation(i);this.gs.bindBufferToVertexArray(this.vao,n.buffer,{...n.config,location:o})}if(t.inputs.index&&this.gs.bindIndexToVertexArray(this.vao,t.inputs.index),this.config.outputs.frameBuffer){const i=this.config.outputs.frameBuffer;this.fb=new R(e.gl,{});let n=0;for(const o of i.textures)e.bindTextureToFramebuffer(this.fb,o,n),n+=1;i.depth&&e.bindDepthToFramebuffer(this.fb,i.depth),this.fb.bind()}if(this.config.outputs.transformFeedback){this.tf=new I(e.gl,{});let i=0;for(const[n,o]of Object.entries(this.config.outputs.transformFeedback.data))e.bindBufferToTransformFeedback(this.tf,o,i),i+=1}}activate(){this.gs.bindProgram(this.program),this.gs.bindVertexArray(this.vao);let e=0;for(const[t,r]of Object.entries(this.config.inputs.textures))this.gs.bindTextureToSlot(r,e),this.gs.bindTexUniformToSlot(this.program,t,e),e+=1;for(const[t,r]of Object.entries(this.config.inputs.uniforms))this.gs.setUniformValue(this.program,t,r.type,r.value);this.fb?this.gs.bindFramebuffer(this.fb):this.gs.unbindFramebuffer(),this.tf?this.gs.bindTransformFeedback(this.tf):this.gs.unbindTransformFeedback(),this.gs.setViewPort(this.config.settings.viewport)}updateUniform(e,t){const r=this.config.inputs.uniforms[e].type;this.config.inputs.uniforms[e].value=t,this.gs.setUniformValue(this.program,e,r,t)}updateTexture(e,t){let r=0;for(const[s,i]of Object.entries(this.config.inputs.textures))if(s===e){this.gs.bindTextureToUniform(this.program,e,i,r);break}else r+=1;this.config.inputs.textures[e]=t}updateViewport(e){this.gs.setViewPort(e),this.config.settings.viewport=e}updateFramebuffer(e){if(this.config.outputs.frameBuffer=e,e===void 0)this.gs.unbindFramebuffer(),this.unboundFramebuffer=this.fb,this.fb=void 0;else{const t=e;this.fb||(this.fb=this.unboundFramebuffer),this.fb||(console.warn("having to create new fb - is this on purpose?"),this.fb=new R(this.gs.gl,{}));let r=0;for(const s of t.textures)this.gs.bindTextureToFramebuffer(this.fb,s,r),r+=1;t.depth&&this.gs.bindDepthToFramebuffer(this.fb,t.depth)}}draw(e){var s,i,n;e&&this.gs.clearScreen(e,(s=this.fb)!=null?s:void 0);const t=this.gs.gl,r=this.config.settings;this.activate(),this.tf&&(this.gs.gl.beginTransformFeedback(c(t,r.drawingMode)),((i=this.config.outputs.transformFeedback)==null?void 0:i.runFragmentShader)===!1&&t.enable(t.RASTERIZER_DISCARD)),this.config.inputs.index?this.fb?this.gs.drawElements(this.program,this.vao,r.drawingMode,this.config.inputs.index.length,this.fb):this.gs.drawElements(this.program,this.vao,r.drawingMode,this.config.inputs.index.length):this.fb?r.instanced?this.gs.drawArraysInstancedToFramebuffer(this.program,this.vao,r.drawingMode,r.nrVertices,r.instanced,this.fb):this.gs.drawArraysToFramebuffer(this.program,this.vao,r.drawingMode,r.nrVertices,this.fb):r.instanced?this.gs.drawArraysInstanced(this.program,this.vao,r.drawingMode,r.nrVertices,r.instanced):this.gs.drawArrays(this.program,this.vao,r.drawingMode,r.nrVertices),this.tf&&(t.endTransformFeedback(),((n=this.config.outputs.transformFeedback)==null?void 0:n.runFragmentShader)===!1&&t.disable(t.RASTERIZER_DISCARD))}destroy(e=!1){this.tf&&this.tf.destroy(e),this.fb&&this.fb.destroy(e),this.vao.destroy(e),this.program.destroy()}}function M(a,e){const t=[];for(let r=0;r<e;r++)t.push(a);return t}function L(a,e){const t=[];for(let r=0;r<e;r++)t.push(a(r));return t}function C(a,e,t,r){const s=a-t/2,i=a+t/2,n=e+r/2,o=e-r/2;return[[s,n],[s,o],[i,o],[s,n],[i,o],[i,n]]}class X{constructor(e,t){d(this,"movement1");d(this,"movement2");d(this,"gs");d(this,"videoTexture");d(this,"posTexture1");d(this,"posTexture2");d(this,"i",0);const r=e.canvas;r.style.setProperty("background","black");const s=new k(e,{allowAlpha:!0}),i=t.nrParticles,n=new S(e,{video:t.sdfVideo}),o=L(()=>[(Math.random()*2-1)*.8,(Math.random()*2-1)*.8,0,0],i),f=new p(e,{data:new Float32Array(o.flat()),changesOften:!0}),u=new p(e,{data:new Float32Array(o.flat()),changesOften:!0}),h=M([255,255,255,255],i),x=new p(e,{data:new Float32Array(h.flat()),changesOften:!0}),m=new p(e,{data:new Float32Array(h.flat()),changesOften:!0}),b=new F(e,{width:r.width,height:r.height,type:"float4",interpolate:"none",edges:"clamp"}),T=new F(e,{width:r.width,height:r.height,type:"float4",interpolate:"none",edges:"clamp"}),l=new A(s,{program:{vertexSource:`#version 300 es
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
              }`,fragmentSource:`#version 300 es
              precision highp float;
              in vec4 color;
              out vec4 fragColor;
              void main() {
                  fragColor = color;
              }`},inputs:{attributes:{offset:{buffer:f,config:{normalize:!1,nrInstances:0,type:"vec4"}},colorOld:{buffer:x,config:{normalize:!1,nrInstances:0,type:"vec4"}}},uniforms:{t:{type:"float",value:[0]},lastPosTexSize:{type:"vec2",value:[b.width,b.height]},sdfTextureSize:{type:"vec2",value:[n.width,n.height]},pointerPos:{type:"vec3",value:[0,0,0]}},textures:{sdfTexture:n,lastPosTex:b}},outputs:{transformFeedback:{data:{offsetNew:u,colorNew:m},runFragmentShader:!0},frameBuffer:{textures:[T]}},settings:{drawingMode:"points",instanced:!1,nrVertices:i,viewport:[0,0,r.width,r.height]}}),_=new A(s,{...l.config,program:l.program,inputs:{...l.config.inputs,attributes:{...l.config.inputs.attributes,offset:{buffer:u,config:{normalize:!1,nrInstances:0,type:"vec4"}},colorOld:{buffer:m,config:{normalize:!1,nrInstances:0,type:"vec4"}}},textures:{...l.config.inputs.textures,lastPosTex:T}},outputs:{...l.config.outputs,transformFeedback:{data:{offsetNew:f,colorNew:x},runFragmentShader:!0},frameBuffer:{textures:[b]}}});this.gs=s,this.videoTexture=n,this.movement1=l,this.movement2=_,this.posTexture1=b,this.posTexture2=T}step(e){this.gs.updateVideoTexture(this.videoTexture),this.i%2===0?(this.movement1.updateUniform("t",[this.i]),this.movement1.updateUniform("pointerPos",e.pointerPos),this.movement1.draw([0,0,0,0])):(this.movement2.updateUniform("t",[this.i]),this.movement2.updateUniform("pointerPos",e.pointerPos),this.movement2.draw([0,0,0,0])),this.i++}destroy(e){this.movement2.destroy(e),this.movement1.destroy(e)}}async function G(a){a.width=1e3,a.height=700;const e=a.getContext("webgl2"),t=await S.loadVideo("https://michaellangbein.github.io/presents/estelle.mp4");t.playbackRate=.85;const r=new X(e,{sdfVideo:t,nrParticles:2e4}),s=C(0,0,2,2),i=new p(e,{data:new Float32Array(s.flat()),changesOften:!1}),n=r.videoTexture,o=new A(r.gs,{program:{vertexSource:`#version 300 es
                in vec2 pos;
                out vec2 uv;
                void main() {
                    gl_Position = vec4(pos.xy, 0, 1);
                    uv = (pos + 1.) / 2.;
                    uv.y = 1. - uv.y;
                }`,fragmentSource:`#version 300 es
                precision mediump float;
                in vec2 uv;
                uniform sampler2D vid;
                uniform sampler2D mov;
                out vec4 fragColor;
                void main() {
                    vec4 vColor = texture(vid, uv);
                    vec4 mColor = texture(mov, uv);

                    fragColor =  0.1 * vColor + 0.9 * mColor;;
                }`},inputs:{attributes:{pos:{buffer:i,config:{normalize:!1,nrInstances:0,type:"vec2"}}},textures:{vid:n,mov:r.posTexture1},uniforms:{}},outputs:{},settings:{drawingMode:"triangles",instanced:!1,nrVertices:s.length,viewport:[0,0,a.width,a.height]}});let f=0,u=0,h=0;a.addEventListener("mousemove",m=>{f=(m.x/a.width-.5)*2,u=(m.y/a.height-.5)*2});function x(){const m=new Date().getTime();r.step({pointerPos:[f,u,h]}),h=0,o.draw();const T=30-(new Date().getTime()-m);setTimeout(x,T)}x()}const z=document.getElementById("canvas");G(z);
