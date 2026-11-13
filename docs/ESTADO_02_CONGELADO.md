# P1 · Estado de cierre documental — 02 «Compacto»

**Fecha de corte:** 13 de noviembre de 2026  
**Decisión:** **detener la programación de 02**; conservar los resultados, sus límites y sus pruebas, sin aprobar una distribución que no cumplió el objetivo.  
**Norma vigente:** [P1-ET-02.md](P1-ET-02.md).  
**Situación:** bloqueada/inconclusa, **no fusionada con `main`**.  
**No afecta:** 01 «Plano», 03 «Órbitas», 04 «Espiral», sus funciones o estética.

## 1. Diagnóstico de cierre

Se dispone de un motor experimental que puede deformar **cuadros, puertos y todas las conexiones existentes al mismo tiempo**, conservando la estructura topológica de la inmersión original. Eso es una capacidad técnica, **no es todavía 02**.

El resultado **que el usuario pidió** era otro: J0 central con cada J1 cerca, ramas que crezcan en direcciones oblicuas propias, pertenencia completa a sectores, radios estrictamente progresivos por jerarquía y una composición visiblemente más compacta. Los ensayos entregados **no consiguieron estas condiciones simultáneamente**.

Dos intentos deben distinguirse:

1. **Sectorizar antes de proteger la topología:** generó geometrías angulares prometedoras, pero no pudo conservar completas las 217 rutas ni su firma de 71 cruces. Se descartó el procedimiento.
2. **Proteger la topología pero optimizar una figura deficiente:** conservó las conexiones, pero produjo un diagrama aún columnar, con conectores excesivos, radios intercalados o un área mayor. La alternativa posterior comprimió 01, pero **no lo convirtió en 02** y fue rechazada visualmente.

**El fracaso no debe disimularse bajo un éxito parcial**: una vista con 217 rutas y 71 cruces puede seguir siendo 02 inválida; una compresión del 10 % del recorrido tampoco demuestra crecimiento radial.

## 2. Normas y decisiones confirmadas

| Orden | Obligación | Situación |
| --- | --- | --- |
| N1 | Partir de la **inmersión completa validada de 01**; conservar por construcción nodos, vínculos, puertos, cruces y orden de encuentros | **Demostrada para deformaciones de ensayo**, no para toda la geometría objetivo |
| N2 | J0 central, una zona por J1 y **todo el subárbol** dentro de su sector; cada rama crece desde el núcleo en dirección propia | **Pendiente** |
| N3 | Cada Jk íntegramente dentro del anillo de J(k+1): `max r(Jk) < min r(J(k+1))`, sin igualar radios de hermanos | **Pendiente** |
| N4 | Recorridos reales más cortos que el mismo checkpoint de 01, composición integrada, sin grandes huecos ni lazos | **Pendiente como objetivo conjunto** |

Reglas adicionales confirmadas: J1 tiene cardinalidad variable; no fijar tres ramas ni ángulo de 40°; los hermanos pueden estar a distancias distintas; no reconstruir rutas después de cambiar las posiciones; no usar la separación de columnas como sustituto del crecimiento radial.

**Criterio histórico a conservar:** se propuso limitar la distancia máxima entre cuadros a dos alturas de cuadro. Aún no hay una regla operativa auditada que identifique a qué pares se aplica: **no inventar esa interpretación ni olvidarla**.

## 3. Experimentos documentados (no mezclar bases de medición)

Las cifras provienen de **dos contextos de ejecución diferentes**. Las mediciones antiguas del fixture/ruteo en memoria dieron para 01 alrededor de **176378,37** unidades de recorrido; el test del navegador, con su propio checkpoint, dio **174985,028**. No deben compararse entre sí para calcular ganancias o concluir regresiones. Toda reducción porcentual se calcula exclusivamente contra la base del mismo ensayo.

| Ensayo | Resultados observados | Motivo de rechazo |
| --- | --- | --- |
| Propuesta sectorial inicial — PR #7 | Conservó solo 79/217 rutas y 47/71 cruces (caso de prueba) | **N1 incumplida**; no tenía derecho a optimizar sectores |
| Isotopía separable sectorial — PR #8 | 217/217, 71/71; longitud ≈289259,67 contra 176378,37 de la misma prueba | N4 muy empeorada; distancias desproporcionadas J0–J1 |
| Acercamiento independiente de hijos — PR #9 | Ocho desplazamientos aceptados; ahorro ≈144 unidades, menos de 0,05 % respecto al intento sectorial | Ahorro demasiado pequeño; no corrige el origen del fallo |
| Reubicación radial calculada desde cero — PR #8 | 210 cuadros sin superposición y radios J1≈244; solo **113/217 rutas** logradas después de corregir puertos y separación | **N1 incumplida**: 104 rutas faltantes |
| Motor de isotopía ambiental — PR #11 | 217/217 rutas, 71/71 cruces e identidad topológica verificada; ensayo inicial ≈174985,028 → 174952,690 | N1 viable en esos movimientos, **no cumple todavía N2/N3/N4** |
| Planificador angular por movimientos certificados — PR #11 | 217/217 y 71/71; longitud ≈236987,17 frente a 174985,028 (**+35,43 %**); 1 concepto fuera de sector, 3 escalones radiales incumplidos | Aunque N1 se conserva, **N2/N3/N4 incumplidas** y geometría visual rechazada |
| Alternativa comprimida de 01 — PR #11 | 217/217, 71/71; ≈174985,028 → 156657,646 (**−10,47 %**); superficie 34573061,4 → 27699893,45 (**−19,88 %**) | **No es 02**: 80 conceptos fuera de sector y 4 escalones radiales incumplidos. Usuario también rechazó la representación |

### Última alternativa visible (la «base compactada»)

Se midió un **J1 máximo ≈1564,83** frente a un **J2 mínimo ≈685,71**. La norma exige exactamente lo contrario: todos los J1 deben ser radialmente interiores a todos los J2. No es un error de redondeo ni se puede corregir etiquetando esa figura «Compacto».

Se redujeron algunos corredores vacíos de 01, **pero la estructura sigue pareciendo columnas**; no se resolvieron las ramas alrededor de J0. Esta es la razón del rechazo del usuario, aunque las cifras de compresión y las pruebas técnicas sean correctas.

## 4. Qué se programó y qué se ha comprobado

**Prototipos que sí existen en la rama del PR #11**:

| Archivo | Responsabilidad actual |
| --- | --- |
| `js/geometry/AmbientIsotopy.js` | Deformaciones ambientales afines por triángulos, cota Lipschitz o monotonicidad axial y transformación de todos los segmentos de rutas |
| `js/geometry/EmbeddedTopology.js` | Auditoría independiente de rutas oblicuas: continuidad, puertos y pares/órdenes de cruces |
| `js/geometry/AxisCorridorWarp.js` | Compresión topológicamente controlada de corredores en ejes X/Y |
| `js/geometry/CompactObjectives.js` | Medición de sectores, radios y otras métricas de 02 |
| `js/geometry/CompactSectorOptimizer.js` | Ajuste exploratorio de límites sectoriales |
| `js/geometry/CertifiedMovePlanner.js` | Propuestas de desplazamientos, sometidas al motor certificado y a sus prioridades parciales |
| `js/geometry/CertifiedCompact02.js` | Validación de entrada de 01, invocación del planificador y presentación de resultados |
| `js/geometry/CertifiedPreviewFallback.js` | Sustitución del plan sectorial fallido por una compresión métrica de 01 para la previsualización; **no debe confundirse con la solución de 02** |
| `js/workers/ambient-02.worker.js` | Ejecución experimental de 02 fuera del hilo de interfaz |
| `js/views/DerivedViews.js` | Dibuja las rutas deformadas y avisa si la figura está «En revisión» |
| `tests/ambient-isotopy.test.js`, `tests/views_e2e.py` | Pruebas de integridad, rechazo de movimientos inválidos y visualización en navegador |

**Resultado de pruebas:** el último ensayo de código verificado con éxito antes del cierre documental fue el commit `0886ef54` (GitHub Actions, pruebas unitarias y de navegador). Pasar las pruebas **demuestra que el código cubierto se ejecuta y cumple sus aserciones**, no que la figura aprobó las cuatro normas. No afirmar que las futuras pruebas de CI —si se modifican los documentos— validan un algoritmo geométrico nuevo: **este cierre no introduce código nuevo**.

## 5. Problema técnico sin resolver

El motor certificado existente puede ejecutar traslaciones, cizallamientos y compresiones, pero **el planificador no ha logrado una deformación global útil que rote/despliegue las ramas conservando los corredores de conexión, los sectores, el orden radial y la compacidad a la vez**.

La anterior optimización trató el progreso parcial (menos infracciones de sector/radio) como razón para aceptar una geometría con rutas muchísimo más largas. Después, el fallback exhibió la compresión de 01 en lugar de reconocer que el objetivo seguía sin resolverse.

**No repetir:**

- Diseñar de nuevo posiciones radiales y después pedir al enrutador que reconstruya 217 conexiones.
- Promocionar una figura porque tiene los mismos 71 cruces **sin verificar su identidad, multiplicidad y orden**.
- Calificar como compacta una figura que es visualmente el mismo 01 estrechado.
- Cumplir un anillo empujando los niveles exteriores a distancias excesivas.
- Utilizar pruebas de componentes o porcentajes de compresión como sustituto de la evaluación de las cuatro normas sobre el dibujo final.
- Alterar 01, 03, 04 o la estética para facilitar 02.

## 6. Estado de ramas y publicación

- **`main`:** versión pública estable; no se fusionaron los intentos experimentales de 02.
- **PR #7:** intento inicial descartado/cerrado sin fusionar.
- **PR #8:** experimento sectorial/radial anterior, cerrado sin fusionar.
- **PR #9:** acercamiento independiente de hijos, cerrado sin fusionar; no adoptado como norma.
- **PR #11:** isotopía ambiental y planificador, **abierto en borrador**, NO aprobado para fusión.
- **`preview02`:** rama para observar el experimento; el enlace de vista previa no prueba cumplimiento de 02 ni equivale a un despliegue de producción.

Los archivos `docs/P1-ET-02.md`, `docs/ISOTOPIA_AMBIENTAL_02.md` y este documento pertenecen a la documentación de la rama experimental del PR #11; su existencia allí **no significa que ya formen parte de `main`**.

## 7. Condiciones para una eventual reanudación

**Congelar el trabajo**. No hay una orden de continuar programando. Si posteriormente se decide retomarlo, comenzar con la norma topológica y un test de aceptación global que evalúe simultáneamente:

1. 210/210 conceptos y 217/217 enlaces del caso PPR con los mismos pares y secuencias de 71 cruces originales.
2. Sectores reales: todos los descendientes de cada J1 dentro de su región y J1 próximos a J0.
3. `max r(Jk) < min r(J(k+1))` para todas las transiciones.
4. Recorridos totales de menor longitud que el mismo punto de control 01, junto con una figura realmente integrada y legible.

Si cualquiera falla, el estado de 02 sigue siendo **«No resuelta»**. Se pueden conservar resultados y diagnósticos, **pero no sustituirlos por una disposición distinta ni declarar éxito**.

---

**Conclusión del cierre:** las especificaciones, el historial experimental, las evidencias y el problema no resuelto quedan diferenciados. **No hay una implementación completa de 02.**
