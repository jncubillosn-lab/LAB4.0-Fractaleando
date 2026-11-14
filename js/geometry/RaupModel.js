// Raup coiling, circular aperture of fixed shape S, in the equatorial plane.
// W grows lengths per revolution; D = inner/outer aperture radius; T is axial
// translation. See Araki & Noshita (2023), Evolution 77(8), equation 1.
// This is a graph sampling of the generating surface, not a shell mesh.
export const RAUP_DEFAULTS=Object.freeze({W:8192,D:.2,T:0});
export function validateRaup({W,D,T}){
 if(!Number.isFinite(W)||W<=1||!Number.isFinite(D)||D<0||D>=1||!Number.isFinite(T))
  throw Error('La espiral requiere W > 1, 0 ≤ D < 1 y T finito.');
}
export function raupPoint({theta,phi=0,scale=1,phase=0,...parameters}){
 const {W,D,T}={...RAUP_DEFAULTS,...parameters};validateRaup({W,D,T});
 const growth=W**(theta/(2*Math.PI)),c=(1+D)/(1-D),a=theta+phase;
 const radial=scale*growth*(c+Math.cos(phi)),tangent=scale*growth*Math.sin(phi);
 // Translate the initial aperture's axial origin to zero; rates are unchanged.
 return {x:radial*Math.cos(a)-tangent*Math.sin(a),y:radial*Math.sin(a)+tangent*Math.cos(a),
  z:scale*2*T/(1-D)*(growth-1),growth};
}
export const raupCaption=parameters=>['W','D','T'].map(k=>k+' = '+Number(parameters[k].toFixed(4))).join(' · ');
