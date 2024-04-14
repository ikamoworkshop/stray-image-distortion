uniform float uTime;
uniform vec4 uResolution;
uniform sampler2D uTexture;

varying vec2 vUv;

float PI = 3.1415926533589793238;

void main(){
    vec4 color = texture2D(uTexture, vUv);

    gl_FragColor = color;
}