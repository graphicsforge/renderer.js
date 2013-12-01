<script id="vs-basic" type="x-shader/x-vertex"> 
  attribute vec3 aPos;
  attribute vec3 aNorm;
  attribute vec2 aTexCoord;

  uniform mat4 mvMatrix;
  uniform mat4 prMatrix;

  varying vec2 vTexCoord;
  varying float i;
  const vec4 dirUp = vec4(0., 0., 1., 0.);
  const vec4 dirCam = vec4(-.5, -.5, 0., 0.);

  void main(void) {
    vTexCoord = aTexCoord;
    gl_Position = prMatrix * mvMatrix * vec4(aPos, 1.);
    vec4 rotNorm = mvMatrix * vec4(aNorm, .0);
    float iUp = dot(vec4(aNorm, 0.), dirUp);
    float iCam = dot(vec4(aNorm, 0.), dirCam);
    i = max( max( iUp, iCam*iCam*iCam*7. ), .25 );
  }
</script> 
 
<script id="fs-basic" type="x-shader/x-fragment"> 
  #ifdef GL_ES
  precision highp float;
  #endif
  uniform sampler2D uTexSamp;
  uniform float alpha;

  varying vec2 vTexCoord;
  varying float i;

  void main(void) {
     vec4 c = texture2D(uTexSamp, vTexCoord);
     gl_FragColor = vec4(i*c.rgb, 1);
  }
</script> 

