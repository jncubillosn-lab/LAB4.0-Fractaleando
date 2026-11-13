# P1 · 02 — Motor de isotopía ambiental certificada

**Estado de cierre (13 de noviembre de 2026):** motor experimental que preservó la inmersión de 01 durante ciertos movimientos certificados; **02 Compacto NO se resolvió y su desarrollo está detenido**. Este archivo conserva pruebas e hitos **históricos**, no certifica la vista final. Véanse [P1-ET-02.md](P1-ET-02.md) y [ESTADO_02_CONGELADO.md](ESTADO_02_CONGELADO.md).  
**Alcance:** exclusivamente la representación 02, sin cambios de cálculo en 01, 03 ni 04.

## 1. La primera norma es estructural

La entrada es el plano **01 ya completo**, con sus cuadros, posiciones, puertos, rutas y firma topológica. En 02 no existe ninguna operación de `routeEdge` ni reconstrucción de conexiones. **El plano completo es el objeto transformado.**

Cada desplazamiento solo se adopta si existe un certificado de inyectividad y además supera una auditoría independiente de su inmersión geométrica. Se rechazan movimientos parciales, cuadros afectados accidentalmente, vínculos incompletos y discrepancias entre cruces originales y transformados.

## 2. Certificado matemático

Sea `u(p)` un campo de desplazamiento **continuo y afín por triángulos**. Para una deformación `H_t(p)=p+t u(p)` con `t∈[0,1]`, **uno de los certificados suficientes implementados** exige la cota estricta:

```text
Lip(u) ≤ max( ||Du|| en cada triángulo ) < 1
```

Entonces, para dos puntos distintos p y q:

```text
||H_t(p)-H_t(q)|| ≥ (1 - t Lip(u)) ||p-q|| > 0
```

Ningún par de puntos coincide durante el movimiento. Fuera de la región de influencia el campo es cero, por lo que la aplicación es un homeomorfismo del plano para todo `t`. La concatenación finita de pasos certificados conserva esta propiedad.

También se implementaron **cizallamientos monótonos por eje**, certificados cuando la coordenada desplazada es estrictamente creciente durante toda la deformación, aunque la cota global de Lipschitz no sea menor que uno. Los corredores X/Y se comprimen mediante transformaciones monótonas que conservan rígidos los perímetros. **Son condiciones suficientes de algunos movimientos; no resuelven por sí solas el crecimiento radial global.**

La función local de parches se representa en una retícula de 3×3 rectángulos, subdivididos en **18 triángulos**. Los valores del campo son constantes sobre una meseta que contiene íntegramente los cuadros del grupo y su perímetro, incluyendo los stubs de 19 unidades. Las cajas que no pertenecen al grupo deben quedar completamente fuera del soporte. Así, **cada cuadro permanece rectangular y todos sus puertos se trasladan rígidamente**.

## 3. Transformación exacta de los recorridos

No se mueven únicamente los extremos. Cada segmento de cada ruta se corta en todas las fronteras verticales, horizontales y diagonales de la malla que atraviese. La imagen dentro de cada triángulo es afín y, por tanto, el recorrido transformado vuelve a ser una polilínea **exactamente equivalente**, sin una discretización aproximada.

El motor admite trayectorias oblicuas. **No utiliza el validador PCB ortogonal para certificar esas trayectorias**, porque este las rechazaría sin fundamento topológico.

`EmbeddedTopology` comprueba por separado:

- Identidad y totalidad de conceptos y rutas.
- Puertos sobre el perímetro y orden circular de sus vínculos.
- Cruces por cada par de rutas, su cantidad, orientación y secuencia a lo largo de cada recorrido.
- Rectángulos sin solapamientos, rutas sin entrada a cajas, sin solapamiento de segmentos y con extremos conectados.

Los cruces se calculan mediante intersección de **segmentos arbitrarios**, sin suponer horizontalidad o verticalidad.

## 4. Operaciones iniciales implementadas

- `translateWholePlane`: traslada el plano completo para colocar J0 en (0,0), con certificado `Lip=0`.
- `createCertifiedPatch`: construye una deformación ambiental para un cuadro o un subárbol de cuadros. Rechaza automáticamente cota Lipschitz >=1, datos incompletos o regiones de influencia que afectarían a otros cuadros.
- `applyCertifiedPatch`: transforma TODAS las posiciones, TODOS los cuadros, TODAS las rutas y sus puertos en una transacción que no modifica el original.
- `computeCertified02`: parte del registro oficial de 01 y solo acepta pasos que igualen la firma independiente de cruces y mantengan el conjunto completo de enlaces.
- `ambient-02.worker.js`: ejecuta las comprobaciones fuera del hilo de interfaz y permite cancelación al cambiar de vista.

El motor puede mover un **subárbol completo** como cuerpo rígido mientras las conexiones transversales y exteriores quedan deformadas con la misma función global.

## 5. Presentación en 02

El editor permite visualizar esta representación como **«En revisión»**. Dibuja las polilíneas transformadas, incluso sus tramos oblicuos, y los cruces calculados por la auditoría generalizada. No vuelve a pedir rutas al PCB.

Los checkpoints antiguos de 02 no se restauran y la implementación nueva **no se exporta como versión aprobada**, porque todavía no completa los sectores J1, el orden radial ni la reducción final de longitudes.

Los tres modos 01, 03 y 04 conservan sus implementaciones previas. La rama `main` no se ha modificado.

## Resultado de la integración real en navegador

La prueba E2E del PPR abierto en el editor (no solamente el test aislado) confirma:

| Indicador | 01 origen | 02 isotopía |
|---|---:|---:|
| Conceptos | 210 | 210 |
| Conexiones completas | 217 | 217 |
| Cruces | 71 | 71 |
| Diferencias topológicas | 0 | 0 |
| Cuadros solapados | 0 | 0 |
| Rutas inválidas | 0 | 0 |
| Longitud real de rutas | 174985,028 | 174952,690 |

**Ejecución:** cuatro movimientos locales certificados más el recentrado global de J0; reducción de longitud de unas **32,338 unidades** en este primer ensayo, sin reconstruir rutas. Se incluye una prueba de traslación rígida de un subárbol completo, con los demás cuadros intactos.

**Límites:** los sectores y radios siguen sin satisfacer P1-ET-02 en este primer estado. No es la solución final de compactación, sino un **motor de conservación topológica que ha superado las pruebas reales**.

## 6. Pruebas y siguientes condiciones de aceptación

El ensayo usa el ejemplo PPR con **210 conceptos, 217 vínculos y 71 cruces originales**. El test no se conforma con el conteo total: compara identidad de pares, multiplicidades, orientaciones y orden de encuentros, además de auditar todos los cuadros y puertos.

Los primeros movimientos hacen una traslación global y ensayan deformaciones locales o de ramas. Aunque los movimientos geométricos pueden ser todavía pequeños, el objetivo es demostrar **la primera norma de forma independiente del algoritmo de distribución**.

Después de las primeras pruebas **se añadió** `CertifiedMovePlanner.js`, que propuso movimientos certificados para acercar J1, mejorar sectores y ordenar radios. **No logró un resultado que cumpliera las cuatro normas simultáneamente**: una candidata angular aumentó un 35,43 % la longitud de conexiones y conservó escalones radiales incorrectos. El sistema terminó mostrando una compresión de 01 como alternativa provisional, que el usuario rechazó por no ser la vista radial buscada. El planificador no se considera una solución aprobada y queda detenido.

**La garantía de la primera norma es condición de entrada y de cada movimiento, no una reparación posterior.**

## Corrección de la vista preliminar tras inspección visual (12 de noviembre de 2026)

Las capturas comparativas evidenciaron que el intento angular conservaba la topología pero **no compactaba**: las rutas crecieron aproximadamente **35,43 %**, con tres transiciones de radio incumplidas. El motor privilegiaba mejoras de sectores mientras podía empeorar excesivamente el recorrido real. Esa candidata se conserva para diagnóstico, pero **no puede exhibirse como representación compacta**.

Se añadió `CertifiedPreviewFallback.js`, una barrera para la presentación de geometrías incompletas. Desde el checkpoint íntegro de 01, realiza compresiones globales y continuas de corredores en X e Y; solo acepta una etapa si **reducen simultáneamente** el recorrido real y la superficie envolvente, con idénticos 217 vínculos y 71 cruces. Después recentra J0 mediante traslación global certificada, sin mover J0 aisladamente ni deshacer la topología.

La vista E2E del PPR verificó:

| Variable | 01 | Previsualización corregida |
|---|---:|---:|
| Recorrido total | 174985,028 | 156657,646 |
| Superficie envolvente | 34573061,4 | 27699893,45 |
| Vínculos completos | 217 | 217 |
| Cruces preservados | 71 | 71 |
| Diferencias topológicas | — | 0 |
| Reducción del recorrido | — | **10,47 %** |
| Reducción de superficie | — | **19,88 %** |

Esto **no satisface aún la distribución radial ni la pertenencia sectorial exigidas para 02**. La interfaz muestra expresamente `BASE COMPACTADA DE 01 (aún no es 02)` y `EN REVISIÓN`. El sistema nunca interpreta reducción de recorrido como evidencia suficiente de validez total.

El resultado mejora la disciplina de aceptación, pero no se debe confundir con una solución al diseño radial angular. Para completar la vista es necesario producir una inmersión simultáneamente sectorial, radial y de menor longitud mediante transformaciones homeomorfas certificadas. El PR continúa en borrador.

## Nota final de alcance, 13 de noviembre de 2026

**No hay una vista 02 aprobada.** La capacidad de conservar todas las rutas y cruces durante deformaciones del plano es un avance del motor, pero **no** acredita las normas N2, N3 ni N4 de [P1-ET-02](P1-ET-02.md). Las pruebas anteriores (incluidas las tablas de longitud) se mantienen como hitos cronológicos, no como el estado final.

La última alternativa visible registrada en el caso PPR del navegador tenía 217 vínculos y 71 cruces conservados, menor longitud y menor superficie que 01; sin embargo, dejó **80 conceptos fuera de sus sectores y 4 escalones radiales incumplidos**, con el J1 más lejano a unos **1564,83** desde J0 y un J2 a apenas **685,71**. **El usuario rechazó explícitamente el resultado visual**: es una compresión de columnas, no el crecimiento angular desde J0 acordado.

Esta es la conclusión del documento: **motor parcial comprobado; planificador geométrico incompleto; desarrollo detenido; no fusionar en producción**. Consultar [ESTADO_02_CONGELADO.md](ESTADO_02_CONGELADO.md) antes de cualquier eventual reanudación.
