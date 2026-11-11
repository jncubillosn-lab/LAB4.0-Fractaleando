// Existing PPR demonstration data, independent from the editor and routing.
export function createSeeds({makeNode,anchors}){
function blankSeed(){const nodes=[makeNode('p1','P1',-1,null,108),...anchors.map((id,i)=>makeNode(id,'Rama '+String(i+1).padStart(2,'0'),i,'p1',190))];const edges=anchors.map(id=>({from:'p1',to:id}));return{nodes,edges};}
 function seed(){
 const nodes=[],edges=[];
 function add(id,text,branch,parent,width){nodes.push(makeNode(id,text,branch,parent,width));if(parent)edges.push({from:parent,to:id});}
 // Identidad de almacenamiento: P1. Rotulación original del dibujo: YO.
 add('p1','YO',-1,null,108);
 add('b0','Barreras para las tecnologías rurales',0,'p1',225);
 add('f0','Fabricación de prototipos',1,'p1',210);
 add('t0','Optimización de recursos',2,'p1',220);
 // RAMA 01 — Barreras para las tecnologías rurales.
 add('b1','Tecnologías conocidas',0,'b0',183);
 add('b11','Procesos',0,'b1');add('b12','Equipos',0,'b1');add('b13','Tradición territorial',0,'b1');add('b14','Accesibilidad',0,'b1');
 add('b2','Interconexión',0,'b0');add('b21','Servicios básicos',0,'b2');add('b22','Vías de transporte',0,'b2');
 add('b211','Internet',0,'b21');add('b212','Acueducto',0,'b21');add('b213','Generar capacidad',0,'b21');add('b214','Energía',0,'b21');
 add('b3','Seguridad',0,'b0');add('b31','Zonas de conflicto',0,'b3');add('b32','Narco-crimen',0,'b3');
 add('b4','Recursos',0,'b0');add('b41','Dinero',0,'b4');add('b42','Capacidad técnica',0,'b4');
 add('b5','Legal',0,'b0');add('b51','Seguridad jurídica',0,'b5');add('b52','Uso de espacios',0,'b5');add('b53','Ambiental',0,'b5');
 add('b6','Autopercepción',0,'b0');add('b61','Marginación',0,'b6');add('b62','Capacidad creadora',0,'b6');
 add('b621','Afirmación',0,'b62');add('b622','Negación',0,'b62');add('b623','Tradición territorial',0,'b62');
 add('b6231','Productiva',0,'b623');add('b6232','Generar capacidad',0,'b623');
 // RAMA 02 — Fabricación de prototipos. Los rótulos repetidos son conceptos diferentes.
 add('f1','Funcionalidad',1,'f0');add('f11','Problemas',1,'f1');add('f12','Validación de capacidad',1,'f1');add('f13','Soluciones',1,'f1');
 add('f111','Contextos',1,'f11');add('f112','Herramientas',1,'f11');add('f113','Materiales',1,'f11');add('f114','Técnicas',1,'f11');
 add('f131','Oportunidades',1,'f13');add('f132','Problemas',1,'f13');
 add('f2','Reducir el dolor',1,'f0');add('f21','Brújula moral',1,'f2');add('f22','Expresión de cuidado',1,'f2');add('f23','Vínculo social',1,'f2');add('f24','Relevancia',1,'f2');add('f25','Sentido de vida',1,'f2');
 add('f221','Visibilizar dificultades',1,'f22');add('f222','Dar libertad',1,'f22');
 add('f231','Trabajo',1,'f23');add('f232','Mejora de condiciones',1,'f23');add('f2321','Optimizar',1,'f232');add('f2322','Generar capacidad',1,'f232');
 add('f241','Grupal',1,'f24');add('f242','Individual',1,'f24');add('f251','Intrascendencia',1,'f25');
 add('f3','Armar cosas',1,'f0');add('f31','Sensaciones',1,'f3');add('f32','Proceso de ideación',1,'f3');
 add('f311','Táctil',1,'f31');add('f312','Visual',1,'f31');add('f313','Gusto',1,'f31');
 add('f321','Principios funcionales',1,'f32');add('f322','Proceso de ideación',1,'f32');add('f323','Problema previo',1,'f32');
 add('f4','Idea propia',1,'f0');add('f41','Validación de la mirada',1,'f4');add('f42','Expresión artística',1,'f4');add('f43','Validación personal',1,'f4');add('f44','Orgullo',1,'f4');
 // RAMA 03 — Optimización de recursos. Reconstrucción desde el diagrama global
 // del usuario, con palabras verificables; las conexiones son preliminares cuando
 // la baja resolución impide distinguir con certeza la dirección de una flecha.
 add('t1','Patrones',2,'t0');
 add('t11','Dinámica de contexto',2,'t1');
 add('t111','Análisis',2,'t11');
 add('t1111','Lindes',2,'t111');add('t1112','Bases',2,'t111');
 add('t112','Alteraciones',2,'t11');
 add('t12','Límites',2,'t1');
 add('t121','Regeneración local',2,'t12');
 add('t13','Ritmos',2,'t1');
 add('t131','Multiescala',2,'t13');add('t132','Punto de acceso',2,'t13');
 add('t2','Tipos de modelos',2,'t0');
 add('t21','Ecosistema',2,'t2');add('t22','Rural',2,'t2');add('t23','Ciclo',2,'t2');
 add('t3','Tiempo de evolución',2,'t0');
 add('t31','Biomasa local',2,'t3');add('t32','Reglas',2,'t3');add('t33','Sistemas',2,'t3');
 add('t34','Región',2,'t3');add('t35','Escenarios',2,'t3');add('t36','Procesos',2,'t3');add('t37','Persona',2,'t3');
 add('t4','Especialización',2,'t0');
 add('t41','Individuos',2,'t4');add('t42','Métodos',2,'t4');add('t43','Público',2,'t4');
 add('t5','Redistribución',2,'t0');
 add('t51','Explotación primaria',2,'t5');add('t511','Capacidad de recuperación',2,'t51');
 add('t52','Monitoreo',2,'t5');add('t521','Cálculo',2,'t52');add('t522','Catálogo',2,'t52');
 add('t53','Redes de proveedores',2,'t5');add('t531','Uso',2,'t53');add('t532','Público',2,'t53');
 add('t54','Recursos del entorno',2,'t5');add('t541','Texturas',2,'t54');add('t542','Biomas',2,'t54');
 add('t6','Potencialidad',2,'t0');
 add('t61','Viabilidad de capacidad',2,'t6');add('t611','Optimización',2,'t61');
 add('t62','Polímeros',2,'t6');add('t63','Materiales',2,'t6');add('t64','Gestión',2,'t6');add('t65','Información',2,'t6');

 // AMPLIACIÓN PPR: conceptos interpretados y reagrupados por función, NO una copia del glosario.
 // Se conserva trazabilidad documental por concepto y las conexiones transversales son hipótesis de modelado.
 function addPPR(id,text,branch,parent,source){add(id,text,branch,parent,Math.max(170,Math.min(255,96+text.length*4.2)));nodes[nodes.length-1].source=source;nodes[nodes.length-1].origin="PPR";}
 addPPR("b7","Contexto territorial del estudio",0,"b0","Compilación PPR · Definición 1 y planteamiento del problema · p. 1, 5");
 addPPR("b71","Municipios DNP 3, 4 y 5",0,"b7","Compilación PPR · Definición 1 y planteamiento del problema · p. 1, 5");
 addPPR("b72","Rural y rural disperso",0,"b7","Compilación PPR · Definición 1 y planteamiento del problema · p. 1, 5");
 addPPR("b73","Capacidades existentes",0,"b7","Compilación PPR · Definición 1 y planteamiento del problema · p. 1, 5");
 addPPR("b74","Brechas concretas",0,"b7","Compilación PPR · Definición 1 y planteamiento del problema · p. 1, 5");
 addPPR("b8","Restricciones estructurales",0,"b0","Compilación PPR · Definición 1 y planteamiento del problema · p. 1, 5");
 addPPR("b81","Acceso a conocimientos técnicos",0,"b8","Compilación PPR · Definición 1 y planteamiento del problema · p. 1, 5");
 addPPR("b82","Disponibilidad de repuestos",0,"b8","Compilación PPR · Definición 1 y planteamiento del problema · p. 1, 5");
 addPPR("b83","Infraestructura existente",0,"b8","Compilación PPR · Definición 1 y planteamiento del problema · p. 1, 5");
 addPPR("b84","Operación y mantenimiento",0,"b8","Compilación PPR · Definición 1 y planteamiento del problema · p. 1, 5");
 addPPR("b9","Condiciones habilitantes",0,"b0","Compilación PPR · Definición 1 y planteamiento del problema · p. 1, 5");
 addPPR("b91","Redes de apoyo",0,"b9","Compilación PPR · Definición 1 y planteamiento del problema · p. 1, 5");
 addPPR("b92","Capacidades institucionales",0,"b9","Compilación PPR · Definición 1 y planteamiento del problema · p. 1, 5");
 addPPR("b93","Organización comunitaria",0,"b9","Compilación PPR · Definición 1 y planteamiento del problema · p. 1, 5");
 addPPR("b94","Acceso a insumos",0,"b9","Compilación PPR · Definición 1 y planteamiento del problema · p. 1, 5");
 addPPR("b421","Conocimientos prácticos",0,"b42","Compilación PPR · Definición 2: capacidad técnica situada · p. 5");
 addPPR("b422","Experiencias productivas",0,"b42","Compilación PPR · Definición 2: capacidad técnica situada · p. 5");
 addPPR("b423","Habilidades locales",0,"b42","Compilación PPR · Definición 2: capacidad técnica situada · p. 5");
 addPPR("f5","Medio de producción tecnológica propio",1,"f0","Compilación PPR · Definición 3: medio de producción tecnológica propio · p. 5");
 addPPR("f51","Control local de funciones críticas",1,"f5","Compilación PPR · Definición 3: medio de producción tecnológica propio · p. 5");
 addPPR("f52","Diseñar y fabricar",1,"f5","Compilación PPR · Definición 3: medio de producción tecnológica propio · p. 5");
 addPPR("f53","Modificar y reparar",1,"f5","Compilación PPR · Definición 3: medio de producción tecnológica propio · p. 5");
 addPPR("f54","Documentación y organización",1,"f5","Compilación PPR · Definición 3: medio de producción tecnológica propio · p. 5");
 addPPR("f6","Herramientas de prototipado",1,"f0","Compilación PPR · Definición 4: herramientas de prototipado · p. 6");
 addPPR("f61","Hardware y software",1,"f6","Compilación PPR · Definición 4: herramientas de prototipado · p. 6");
 addPPR("f62","Instrumentos de medición",1,"f6","Compilación PPR · Definición 4: herramientas de prototipado · p. 6");
 addPPR("f63","Manuales y métodos",1,"f6","Compilación PPR · Definición 4: herramientas de prototipado · p. 6");
 addPPR("f64","Sistema mínimo de recursos",1,"f6","Compilación PPR · Definición 4: herramientas de prototipado · p. 6");
 addPPR("f641","Energía y seguridad",1,"f64","Compilación PPR · Definición 4: herramientas de prototipado · p. 6");
 addPPR("f642","Insumos y procedimientos",1,"f64","Compilación PPR · Definición 4: herramientas de prototipado · p. 6");
 addPPR("f7","Prototipado situado",1,"f0","Compilación PPR · Definiciones 5 y 6: prototipado y prototipo funcional · p. 6");
 addPPR("f71","Explorar alternativas",1,"f7","Compilación PPR · Definiciones 5 y 6: prototipado y prototipo funcional · p. 6");
 addPPR("f72","Pruebas y experimentación",1,"f7","Compilación PPR · Definiciones 5 y 6: prototipado y prototipo funcional · p. 6");
 addPPR("f73","Documentar y ajustar",1,"f7","Compilación PPR · Definiciones 5 y 6: prototipado y prototipo funcional · p. 6");
 addPPR("f74","Aprendizaje iterativo",1,"f7","Compilación PPR · Definiciones 5 y 6: prototipado y prototipo funcional · p. 6");
 addPPR("f8","Prototipo funcional",1,"f0","Compilación PPR · Definiciones 5 y 6: prototipado y prototipo funcional · p. 6");
 addPPR("f81","Funciones mínimas comprobables",1,"f8","Compilación PPR · Definiciones 5 y 6: prototipado y prototipo funcional · p. 6");
 addPPR("f82","Prueba en contexto real",1,"f8","Compilación PPR · Definiciones 5 y 6: prototipado y prototipo funcional · p. 6");
 addPPR("f83","Evidencia de utilidad y límites",1,"f8","Compilación PPR · Definiciones 5 y 6: prototipado y prototipo funcional · p. 6");
 addPPR("f84","Seguridad y operación",1,"f8","Compilación PPR · Definiciones 5 y 6: prototipado y prototipo funcional · p. 6");
 addPPR("f9","Validación comunitaria",1,"f0","Compilación PPR · Definición 8: validación comunitaria y apropiación · p. 6–7");
 addPPR("f91","Pertinencia y utilidad local",1,"f9","Compilación PPR · Definición 8: validación comunitaria y apropiación · p. 6–7");
 addPPR("f92","Aceptabilidad",1,"f9","Compilación PPR · Definición 8: validación comunitaria y apropiación · p. 6–7");
 addPPR("f93","Decisión comunitaria sobre ajustes",1,"f9","Compilación PPR · Definición 8: validación comunitaria y apropiación · p. 6–7");
 addPPR("f94","Apropiación tecnológica",1,"f9","Compilación PPR · Definición 8: validación comunitaria y apropiación · p. 6–7");
 addPPR("f10","Asimilación tecnológica",1,"f0","Compilación PPR · Definición 11: asimilación tecnológica · p. 7");
 addPPR("f101","Uso recurrente",1,"f10","Compilación PPR · Definición 11: asimilación tecnológica · p. 7");
 addPPR("f102","Operación sin acompañamiento",1,"f10","Compilación PPR · Definición 11: asimilación tecnológica · p. 7");
 addPPR("f103","Resolución de fallas básicas",1,"f10","Compilación PPR · Definición 11: asimilación tecnológica · p. 7");
 addPPR("f104","Transferencia de conocimiento",1,"f10","Compilación PPR · Definición 11: asimilación tecnológica · p. 7");
 addPPR("f105","Seguimiento a 12 y 24 meses",1,"f10","Compilación PPR · Definición 11: asimilación tecnológica · p. 7");
 addPPR("f15","Autonomía tecnológica comunitaria",1,"f0","Compilación PPR · Definición 13: autonomía tecnológica comunitaria · p. 8");
 addPPR("f151","Decisiones informadas",1,"f15","Compilación PPR · Definición 13: autonomía tecnológica comunitaria · p. 8");
 addPPR("f152","Diagnosticar y mantener",1,"f15","Compilación PPR · Definición 13: autonomía tecnológica comunitaria · p. 8");
 addPPR("f153","Sin dependencia permanente",1,"f15","Compilación PPR · Definición 13: autonomía tecnológica comunitaria · p. 8");
 addPPR("f16","Replicabilidad autónoma",1,"f0","Compilación PPR · Definición 14: replicabilidad autónoma · p. 8");
 addPPR("f161","Adaptación a nuevas necesidades",1,"f16","Compilación PPR · Definición 14: replicabilidad autónoma · p. 8");
 addPPR("f162","Documentación transferible",1,"f16","Compilación PPR · Definición 14: replicabilidad autónoma · p. 8");
 addPPR("f163","Recursos alcanzables localmente",1,"f16","Compilación PPR · Definición 14: replicabilidad autónoma · p. 8");
 addPPR("f17","Método fractal",1,"f0","Compilación PPR · Definición 12: método fractal · p. 7–8");
 addPPR("f171","Territorio, comunidad y necesidad",1,"f17","Compilación PPR · Definición 12: método fractal · p. 7–8");
 addPPR("f172","Sistema y subsistema",1,"f17","Compilación PPR · Definición 12: método fractal · p. 7–8");
 addPPR("f173","Componente, herramienta y acción",1,"f17","Compilación PPR · Definición 12: método fractal · p. 7–8");
 addPPR("t7","Innovación frugal",2,"t0","Compilación PPR · Definición 7: innovación frugal · p. 6");
 addPPR("t71","Problema local como origen",2,"t7","Compilación PPR · Definición 7: innovación frugal · p. 6");
 addPPR("t72","Recursos disponibles",2,"t7","Compilación PPR · Definición 7: innovación frugal · p. 6");
 addPPR("t73","Adaptación y experimentación",2,"t7","Compilación PPR · Definición 7: innovación frugal · p. 6");
 addPPR("t74","Funciones esenciales",2,"t7","Compilación PPR · Definición 7: innovación frugal · p. 6");
 addPPR("t75","Robustez y uso simple",2,"t7","Compilación PPR · Definición 7: innovación frugal · p. 6");
 addPPR("t76","Escalamiento si es pertinente",2,"t7","Compilación PPR · Definición 7: innovación frugal · p. 6");
 addPPR("t8","Selección multicriterio contextual",2,"t0","Compilación PPR · Definición 10: selección multicriterio contextual · p. 7");
 addPPR("t81","Pertinencia territorial",2,"t8","Compilación PPR · Definición 10: selección multicriterio contextual · p. 7");
 addPPR("t82","Desempeño técnico",2,"t8","Compilación PPR · Definición 10: selección multicriterio contextual · p. 7");
 addPPR("t83","Costo total de operación",2,"t8","Compilación PPR · Definición 10: selección multicriterio contextual · p. 7");
 addPPR("t84","Curva de aprendizaje",2,"t8","Compilación PPR · Definición 10: selección multicriterio contextual · p. 7");
 addPPR("t85","Interoperabilidad y adaptación",2,"t8","Compilación PPR · Definición 10: selección multicriterio contextual · p. 7");
 addPPR("t86","Seguridad e impacto ambiental",2,"t8","Compilación PPR · Definición 10: selección multicriterio contextual · p. 7");
 addPPR("t87","Criterios y pesos justificados",2,"t8","Compilación PPR · Definición 10: selección multicriterio contextual · p. 7");
 addPPR("t9","Sostenibilidad operativa",2,"t0","Compilación PPR · Definición 9: reparabilidad, mantenibilidad y sostenibilidad · p. 7");
 addPPR("t91","Reparabilidad",2,"t9","Compilación PPR · Definición 9: reparabilidad, mantenibilidad y sostenibilidad · p. 7");
 addPPR("t911","Diagnóstico comprensible",2,"t91","Compilación PPR · Definición 9: reparabilidad, mantenibilidad y sostenibilidad · p. 7");
 addPPR("t912","Repuestos accesibles",2,"t91","Compilación PPR · Definición 9: reparabilidad, mantenibilidad y sostenibilidad · p. 7");
 addPPR("t92","Mantenimiento preventivo",2,"t9","Compilación PPR · Definición 9: reparabilidad, mantenibilidad y sostenibilidad · p. 7");
 addPPR("t93","Costos recurrentes",2,"t9","Compilación PPR · Definición 9: reparabilidad, mantenibilidad y sostenibilidad · p. 7");
 addPPR("t94","Protocolos y responsables",2,"t9","Compilación PPR · Definición 9: reparabilidad, mantenibilidad y sostenibilidad · p. 7");
 addPPR("t95","Relevo de saberes",2,"t9","Compilación PPR · Definición 9: reparabilidad, mantenibilidad y sostenibilidad · p. 7");
 addPPR("t10","Capacidad técnica situada",2,"t0","Compilación PPR · Definición 2: capacidad técnica situada · p. 5");
 addPPR("t101","Recursos del territorio",2,"t10","Compilación PPR · Definición 2: capacidad técnica situada · p. 5");
 addPPR("t102","Personas y oficios",2,"t10","Compilación PPR · Definición 2: capacidad técnica situada · p. 5");
 addPPR("t103","Condiciones institucionales",2,"t10","Compilación PPR · Definición 2: capacidad técnica situada · p. 5");
 addPPR("t104","Actores que validan",2,"t10","Compilación PPR · Definición 2: capacidad técnica situada · p. 5");
 // Relaciones de lectura transversales: inferidas de las definiciones, diferenciadas del parentesco estructural.
 edges.push({from:"b42",to:"t10",kind:"transversal",rationale:"Definición 2: la capacidad situada integra competencias y condiciones del territorio."});
 edges.push({from:"b9",to:"t8",kind:"transversal",rationale:"Definición 10: la elección considera condiciones habilitantes."});
 edges.push({from:"f6",to:"t8",kind:"transversal",rationale:"Definiciones 4 y 10: las herramientas son el objeto de priorización."});
 edges.push({from:"f8",to:"f9",kind:"transversal",rationale:"Definiciones 6 y 8: el prototipo se valida con quienes lo utilizan."});
 edges.push({from:"f9",to:"f10",kind:"transversal",rationale:"Definiciones 8 y 11: apropiación y asimilación deben evidenciarse en uso."});
 edges.push({from:"f5",to:"f15",kind:"transversal",rationale:"Definiciones 3 y 13: medio propio y control comunitario."});
 edges.push({from:"f16",to:"t76",kind:"transversal",rationale:"Definiciones 7 y 14: réplica y escalamiento solo cuando resultan pertinentes."});
 edges.push({from:"f72",to:"f83",kind:"transversal",rationale:"Definiciones 5 y 6: las pruebas producen evidencia de funcionamiento."});
 return{nodes,edges};
}
return {blankSeed,seed};
}
