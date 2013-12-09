

function Model( gl, json )
{
  this.vertex_stride = 8; // values per vertex, defaults to 3 pos, 3 normal, 2 tex
  this.csg_mode = "union";

  if ( typeof(json.vertex_stride)!='undefined' )
    this.vertex_stride = json.vertex_stride;
  if ( typeof(json.type)!='undefined' )
    this.csg_mode = json.type;

  this.vertices = new Float32Array(json.vertices.length/3*this.vertex_stride);
  var vptr = 0;
  for ( var i=0; i<json.vertices.length; i++ )
  {
    this.vertices[vptr++] = (json.vertices[i]);
    if ( !((i+1)%3) )
    {
      for ( var j=0; j<5; j++ )
        this.vertices[vptr++] = this.csg_mode=="intersection"?0.5:1;
    }
  }
  this.indices = new Uint16Array(json.indices.length)
  for ( var i=0; i<json.indices.length; i++ )
    this.indices[i] = json.indices[i];

  this.numVertexes = json.indices.length/this.vertex_stride;
  this.vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
  gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

  this.ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

}

Model.prototype.isInited = function()
{
  return this.numVertexes>0;
}

Model.prototype.getCoord = function(index)
{
  if ( !this.isInited() )
    return undefined;
  var pos = [this.vertices[index*this.vertex_stride],this.vertices[index*this.vertex_stride+1],this.vertices[index*this.vertex_stride+2],1];
  return pos;
}

// TODO bind shaders into model, hardcoding vert attribs for now
Model.prototype.draw = function(gl, camera, posLoc, normLoc, texLoc, mvMatrix, vs_basic_matrix, prevModel)
{
  if ( !this.isInited() )
    return;

  if ( this.csg_mode=='intersection' )
  {
    return this.drawIntersect(gl, camera, posLoc, normLoc, texLoc, mvMatrix, vs_basic_matrix, prevModel);
  }
  mvMatrix.makeIdentity();
  mvMatrix.rotate(90, 1,0,0);
  mvMatrix.translate(0, 10 ,0,0);
  mvMatrix.scale(.01,.01,.01);
  mvMatrix.multRight(camera.extrinsic);
  gl.uniformMatrix4fv( vs_basic_matrix, false, new Float32Array(mvMatrix.getAsArray()) );

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.vertexAttribPointer(posLoc,  3, gl.FLOAT, false, 32,  0);
    gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 32, 12);
    gl.vertexAttribPointer(texLoc,  2, gl.FLOAT, false, 32, 24);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
      gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}


Model.prototype.drawIntersect = function(gl, camera, posLoc, normLoc, texLoc, mvMatrix, vs_basic_matrix, prevModel)
{
  if ( prevModel )
    gl.clear( gl.COLOR_BUFFER_BIT );
  gl.depthFunc(gl.GEQUAL);

  mvMatrix.makeIdentity();
  mvMatrix.rotate(90, 1,0,0);
  mvMatrix.scale(.01,.01,.01);
  mvMatrix.multRight(camera.extrinsic);
  gl.uniformMatrix4fv( vs_basic_matrix, false, new Float32Array(mvMatrix.getAsArray()) );

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.vertexAttribPointer(posLoc,  3, gl.FLOAT, false, 32,  0);
    gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 32, 12);
    gl.vertexAttribPointer(texLoc,  2, gl.FLOAT, false, 32, 24);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
      gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gl.depthFunc(gl.LEQUAL);

  if ( prevModel )
  {
//    prevModel.csg_mode='intersection';
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    prevModel.draw(gl, camera, posLoc, normLoc, texLoc, mvMatrix, vs_basic_matrix);
    gl.disable(gl.CULL_FACE);
    prevModel.csg_mode='union';
  }
}


module.exports.Model = Model;
