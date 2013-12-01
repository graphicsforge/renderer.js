

function Model( gl, url, callback, progresscallback )
{
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  this.numFaces = 0;
  this.gl = gl;

  var self = this;
  xhr.onprogress = function(event) {
    if ( event.lengthComputable && typeof(progresscallback)=='function' )
      progresscallback(event.loaded / event.total)
  };
  xhr.onreadystatechange=function() {
    if (xhr.readyState==4) {
      if ( xhr.status==200 ) {
        var json = JSON.parse(xhr.responseText);
        self.vertexes = new Float32Array(json.vertexes.length);
        for ( var i=0; i<json.vertexes.length; i++ )
          self.vertexes[i] = json.vertexes[i];
        self.indexes = new Uint16Array(json.indexes.length)
        for ( var i=0; i<json.indexes.length; i++ )
          self.indexes[i] = json.indexes[i];

        self.numFaces = json.indexes.length;
        self.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, self.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, self.vertexes, gl.STATIC_DRAW);

        self.ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, self.indexes, gl.STATIC_DRAW);

        if ( typeof(callback)=='function')
          callback(self);
      }
      if ( xhr.status==500 )
        console.error( 'Model() load error:'+xhr.responseText );
    }
  }
  xhr.send();
}

Model.prototype.isInited = function()
{
  return this.numFaces>0;
}

Model.prototype.getCoord = function(index)
{
  if ( !this.isInited() )
    return undefined;
  var pos = [this.vertexes[index*8],this.vertexes[index*8+1],this.vertexes[index*8+2],1];
  return pos;
}

Model.prototype.draw = function(gl, posLoc, normLoc, texLoc)
{
  if ( !this.isInited() )
    return;
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.vertexAttribPointer(posLoc,  3, gl.FLOAT, false, 32,  0);
    gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 32, 12);
    gl.vertexAttribPointer(texLoc,  2, gl.FLOAT, false, 32, 24);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
      gl.drawElements(gl.TRIANGLES, this.numFaces, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}







module.exports.Model = Model;
