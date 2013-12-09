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

<script id="fs-raytrace" type="x-shader/x-fragment">
  #ifdef GL_ES
  precision highp float;
  #endif

  uniform vec3 iResolution;
  uniform float time;
  uniform sampler 2D tex0;

  float iSphere( in vec3 ro, in vec3 rd, in vec4 sph )
  {
    float r = 1.;
    // sphere centered at origin
    vec3 oc = ro - sph.xyz;
    float b = 2.*dot( oc, rd );
    float c = dot( oc, oc ) - sph.w*sph.w;
    float h = b*b - 4.*c;
    if ( h<0. ) return -1.;
    float t = (-b - sqrt(h))/2.;
    return t;
  }
  vec3 nSphere( in vec3 pos, in vec4 sph )
  {
    return ( pos-sph.xyz )/sph.w;
  }

  float iPlane( in vec3 ro, in vec3 rd )
  {
    return -ro.y/rd.y;
  }
  vec3 nPlane( in vec3 pos )
  {
    return vec3( 0., 1., 0. );
  }

  vec4 sph1 = vec4( 0., 1., 0., 1. );
  float intersect( in vec3 ro, in vec3 rd, out float resT )
  {
    resT = 1000.;
    float id = -1.;
    float tsph = iSphere( ro, rd, sph1 );
    float tpla = iPlane( ro, rd );
    if ( tsph>0. )
    {
      id = 1.;
      resT = tsph;
    }
    if ( tpla>0. && tpla<resT )
    {
      id = 2.;
      resT = tpla;
    }
    return id;
  }

  void main(void) {
    vec3 light = normalize( vec3(0.6, .5, -.5) );


    // uv are pix coords
    vec2 uv = (gl_FragCoord.xy-iResolution.xy/2.)/iResolution.xy;

    // generate ray with origin ro and direction rd
    vec3 ro = vec3( 0., 1.0, -4. );
    vec3 rd = normalize( vec3( 1.*2.*uv, 1.) );

    // intersect this with the scene
    float t;
    float id = intersect( ro, rd, t );

    vec3 col = vec3(0.);
    if ( id>0. && id<1.5 )
    {
      vec3 pos = ro + t*rd;
      vec3 nor = nSphere( pos, sph1 );
      float dif = clamp(dot( nor, light ), 0., 1.);
      float ao = .5 + .5*nor.y;
      col = vec3(0.2, 0.6, 0.7)*dif*ao + vec3(.2, .3, .4);
    }
    else if ( id>1.5 )
    {
      vec3 pos = ro + t*rd;
      vec3 nor = nPlane( pos );
      float dif = clamp( dot(nor, light), .0, 1. );
      float amb = smoothstep( .0, 2.*sph1.w, length(pos.xz-sph1.xz) );
      col = vec3(.5, 0.5, 0.3)*dif + amb*vec3(.5, .6, .7);
    }
    col = sqrt(col);
    gl_FragColor = vec4(col, 1.);
  }
</script>
