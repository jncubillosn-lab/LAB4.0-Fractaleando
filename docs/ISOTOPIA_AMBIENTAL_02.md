# P1 · 02 — Motor de isotopía ambiental certificada

**Estado:** motor funcional de conservación topológica; **02 Compacto todavía no está aprobado**.  
**Alcance:** exclusivamente la representación 02, sin cambios de cálculo en 01, 03 ni 04.

## 1. La primera norma es estructural

La entrada es el plano **01 ya completo**, con sus cuadros, posiciones, puertos, rutas y firma topológica. En 02 no existe ninguna operación de `routeEdge` ni reconstrucción de conexiones. **El plano completo es el objeto transformado.**

Cada desplazamiento solo se adopta si existe un certificado de inyectividad y además supera una auditoría independiente de su inmersión geométrica. Se rechazan movimientos parciales, cuadros afectados accidentalmente, vínculos incompletos y discrepancias entre cruces originales y transformados.

## 2. Certificado matemático

Sea `u(p)` un campo de desplazamiento **continuo y afín por triángulos**. Para una deformación `H_t(p)=p+t u(p)` con `t∈[0,1]`, imponemos la cota estricta:

```text
Lip(u) ≤ max( ||Du|| en cada triángulo ) < 1
```

Entonces, para dos puntos distintos p y q:

```text
||H_t(p)-H_t(q)|| ≥ (1 - t Lip(u)) ||p-q|| > 0
```

Ningún par de puntos coincide durante el movimiento. Fuera de la región de influencia el campo es cero, por lo que la aplicación es un homeomorfismo del plano para todo `t`. La concatenación finita de pasos certificados conserva esta propiedad.

La función se representa en una retícula local de 3×3 rectángulos, subdivididos en **18 triángulos**. Los valores del campo son constantes sobre una meseta que contiene íntegramente los cuadros del grupo y su perímetro, incluyendo los stubs de 19 unidades. Las cajas que no pertenecen al grupo deben quedar completamente fuera del soporte. Así, **cada cuadro permanece rectangular y todos sus puertos se trasladan rígidamente**.

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

## 6. Pruebas y siguientes condiciones de aceptación

El ensayo usa el ejemplo PPR con **210 conceptos, 217 vínculos y 71 cruces originales**. El test no se conforma con el conteo total: compara identidad de pares, multiplicidades, orientaciones y orden de encuentros, además de auditar todos los cuadros y puertos.

Los primeros movimientos hacen una traslación global y ensayan deformaciones locales o de ramas. Aunque los movimientos geométricos pueden ser todavía pequeños, el objetivo es demostrar **la primera norma de forma independiente del algoritmo de distribución**.

Solo después debe añadirse un planificador de movimientos para que las ramas crezcan angularmente desde J0, cumplan `max r(Jk) < min r(J(k+1))` y minimicen longitud real. Ese planificador no podrá escribir directamente posiciones o rutas: únicamente solicitar operaciones certificadas a este motor.

**La garantía de la primera norma es condición de entrada y de cada movimiento, no una reparación posterior.**
