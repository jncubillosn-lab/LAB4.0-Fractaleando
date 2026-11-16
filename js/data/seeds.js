/**
 * Inicio vacío: un único núcleo, sin ramas ni relaciones inventadas.
 * El ejemplo público es un documento real exportado desde Fractalear y se lee
 * bajo demanda en GraphFiles; no forma parte del arranque del editor.
 */
export function createSeeds({makeNode}){
 return {blankSeed:()=>({nodes:[makeNode('p1','¿Qué quieres fractalear hoy?',-1,null,300)],edges:[]})};
}
