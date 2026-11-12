# P1 — EXP-02-A · Espaciado independiente entre padres e hijos

**Proyecto:** LAB4.0-Fractaleando  
**Fecha:** 11 de noviembre de 2026  
**Estado:** experimento, **NO es una norma**.  
**Alcance:** exclusivamente 02 · Compacto, subordinado a P1-ET-02.

## Hipótesis

Un nivel jerárquico no necesita una distancia fija al anterior. Los términos hijos de un mismo padre pueden adoptar separaciones diferentes y acercarse individualmente cuando liberan espacio sin violar reglas superiores. Una distancia innecesaria entre conceptos conectados puede aumentar recorridos y dispersión sin contribuir a la legibilidad.

No se propone un nuevo radio, escalón, ancho uniforme o separación obligatoria entre Jn y Jn+1.

## Distancias existentes

En el motor de 02 no existe una distancia mínima normativa **entre jerarquías**. El mecanismo de isotopías separables preexistente utiliza un margen técnico de **36 unidades alrededor de los cuadros** para determinar qué corredores globales pueden comprimirse; esto **no** fija la distancia entre un padre y cada hijo.

Las rutas continúan sujetas a sus puertos y al control DRC, incluidos stubs, ausencia de solapamientos y protección de cuadros ajenos.

Se mide la distancia libre entre bordes de los rectángulos padre/hijo, no solo la distancia entre centros:

- `dx = max(0, abs(xh-xp) - (anchoH+anchoP)/2)`
- `dy = max(0, abs(yh-yp) - (altoH+altoP)/2)`
- `distancia = hypot(dx,dy)`

El informe `childSpacingReport` agrupa medianas, mínimos y máximos por profundidad de parentesco explícito, sin cambiar el nivel conceptual ni inventar vínculos.

## Implementación del ensayo

Archivo: `js/geometry/AdaptiveChildSpacing.js`.

1. Partir exclusivamente del punto de control sectorial cuya topología y geometría ya fueron certificadas contra 01.
2. Proponer movimientos cortos de **un solo hijo por vez**, preferentemente hacia su padre; los hermanos no se desplazan automáticamente.
3. Deslizar los últimos/primeros codos de sus propias conexiones, manteniendo los demás recorridos.
4. Antes de aprobar, descartar desplazamientos cuyo rectángulo barrido invade cualquier otro cuadro o cuyos segmentos móviles barridos pueden entrar en contacto con rutas ajenas. Esto protege también los instantes intermedios, no solamente la posición final.
5. Evaluar adicionalmente los estados intermedios al 25 %, 50 % y 75 % del desplazamiento, mediante el mismo DRC y el registro topológico de 01.
6. Exigir pertenencia a la zona J1 y **reducción de longitud real de TODOS los recorridos**, no solo acercamiento del centro hijo-padre.
7. Solo después de todas las verificaciones se acepta un desplazamiento como punto de control experimental.

La prueba incluye una alternativa de deformación continua de campo local, pero se rechaza cuando agrega longitud a los recorridos. No basta con una mejora aparente de posiciones.

## Comparación empírica: caso PPR completo

Se utilizó el mismo grafo de 210 conceptos, 217 vínculos, 3 términos J1 y **71 cruces de 01**, con su registro topológico original.

| Indicador | Resultado |
|---|---:|
| Candidata sectorial previa: longitud real | 289259,67 |
| Candidata tras el experimento | 289115,67 |
| Movimientos de hijos aceptados | 8 |
| Ahorro efectivo | **144** unidades |
| Ahorro frente a la candidata | **≈0,0498 %** |
| Cruces tras el experimento | **71 de 71** |
| Diferencias de topología | **0** |
| Rutas representadas | **217 de 217** |
| Cuadros superpuestos | **0** |
| Rutas inválidas | **0** |
| Longitud original de 01 | 176378,37 |

La norma 01 y la asignación por zonas de la norma 02 permanecieron verificadas; **no se aprobó la norma 03**, pues la longitud sigue siendo mayor que en 01.

### Diagnóstico de escalones grandes

Distancia libre mediana de bordes, según jerarquía de **parentesco**:

| Relación | 01 original | 02 sectorial antes del experimento |
|---|---:|---:|
| J0 → J1 | 1649,47 | **16556,32** |
| J1 → J2 | 2815,92 | 2767,84 |
| J2 → J3 | 188,25 | 170,40 |
| J3 → J4 | 267,61 | 220,85 |
| J4 → J5 | 164,40 | 139,50 |

El salto dominante no es una distancia mínima impuesta entre todas las jerarquías: **la transformación previa separa demasiado las ramas J1 de J0 al producir los sectores**. Ocho desplazamientos locales de 18 unidades cada uno no compensan este problema estructural.

## Decisión provisional

**Hipótesis parcialmente apoyada:** acercar hijos de forma independiente es geométricamente posible y reduce recorridos sin alterar la topología. Sin embargo, el ahorro medido es muy pequeño y no consigue la compactación del conjunto.

**No adoptar EXP-02-A como nueva norma todavía.** Mantenerlo aislado como candidato de optimización secundaria y explorar primero una reorganización de **ramas y subárboles completos** que reduzca el escalón J0–J1 sin reconstruir ni alterar la topología de 01. Cualquier nueva propuesta sigue obligada a pasar la misma verificación.

Este documento no modifica P1-ET-02 y no autoriza cambios en 01, 03 ni 04.
