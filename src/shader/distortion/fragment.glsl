uniform float uTime;
uniform vec4 uResolution;

varying vec2 vUv;

float PI = 3.1415926533589793238;

float sdSphere(vec3 p, float r){
    return length(p) - r;
}

float map(vec3 p){
    return sdSphere(p, .5);
}

void main(){
    vec2 newUv = (vUv - vec2(.5)) * uResolution.zw + vec2(.5);

    vec3 camPos = vec3(0.0, 0.0, 2.0);
    vec3 ray = normalize(vec3(vUv, -1.0));

    gl_FragColor = vec4(newUv, 0.0, 1.0);
}