# P1 — Radial acotado 02 y Espiral 04

**Actualización documental del 13 de noviembre de 2026:** los valores H mínima global, 14 px de margen y orden vertical convertido en angular son decisiones del intento, no normas definitivas. Las aclaraciones posteriores se recogen en [normas v0.1](NORMAS_JERARQUIZADAS_P1.md). GitHub Actions completó correctamente la [ejecución 145](https://github.com/jncubillosn-lab/LAB4.0-Fractaleando/actions/runs/43355519745); esto no resuelve el PPR, cuya prueba verifica el rechazo. Véase la [memoria completa](MEMORIA_PROYECTO_P1.md).

**Estado del reintento, 12 de noviembre de 2026: experimental. El caso PPR completo sigue sin resolver.**

02 Compactación y 03 Órbitas se sustituyen por 02 Radial acotado. 01 conserva su geometría y edición; 04 no cambia de alcance.

## Contrato de 02

- Se utilizan todos los nodos y vínculos originales, incluidos los transversales. No se cambian identificadores, padres ni ramas.
- J0 está en (0, 0). Los hijos directos de J0 determinan el número de sectores.
- Los descendientes permanecen dentro del sector de su rama y avanzan radialmente respecto de su padre. No se imponen circunferencias uniformes por nivel.
- La separación euclidiana mínima entre los bordes de cada par vinculado es como máximo 2H. H es la menor altura medida de los cuadros: 53 px en PPR, cota 106 px. La longitud de la ruta no se confunde con esta distancia.
- Cuadros sin solapes, con 14 px de margen para trazado; orden angular de hermanos obtenido de 01.
- El auditor vuelve a medir posiciones, distancias, sectores, orden y origen. Las coordenadas de las métricas de 01 no pueden sustituir las posiciones calculadas.

La búsqueda es finita y determinista. Prueba distribuciones iniciales y orientación alternativa; algunos intentos proyectan además el orden de hermanos. No aumenta la cota para aprobar. El estado `not-found` significa que el algoritmo no encontró solución, **no demuestra imposibilidad matemática**.

## Resultado comprobado y límite pendiente

La prueba de árbol binario de 46 cuadros cumple las restricciones geométricas. El ejemplo PPR de 210 cuadros y 217 vínculos conserva sus datos, pero todavía incumple restricciones. La prueba de rechazo verifica protección del plano original; no constituye una prueba de aceptación del caso completo.

Una distribución rechazada no se dibuja ni se exporta como validada: se mantiene 01 y se informan los incumplimientos. La búsqueda se ejecuta en un Worker para que el usuario pueda cambiar de vista mientras calcula. Cambiar de vista termina el Worker y descarta resultados obsoletos.

Para aprobar una distribución se exigen además todas las rutas, puertos válidos, ausencia de intersecciones con cuadros ajenos y control topológico. No basta con aprobar posiciones. La identidad conceptual se contrasta con 01; el registro geométrico de cruces y puertos es propio de cada representación. No se afirma conservar automáticamente los mismos cruces de 01 al cambiar su geometría.

## Archivos y verificación

- `js/geometry/RadialLayout.js`: distribución y auditor independiente.
- `js/geometry/ViewLayouts.js`: selección de motor; 03 ya no se admite.
- `js/workers/radial-layout.worker.js`: cálculo fuera de la interfaz.
- `js/views/DerivedViews.js`: caché, rechazo, enrutamiento y recuperación.
- `tests/views.test.js`: aceptación geométrica pequeña, conservación de datos PPR, rechazo, auditor y Worker.
- `tests/views_e2e.py`: prueba prevista de rechazo PPR, rutas pequeñas, 04 y persistencia.

Ejecutar `npm test`. Para navegador, ejecutar las tres pruebas Python de `.github/workflows/tests.yml` con Chrome. En el entorno del reintento Chromium no pudo iniciar por una restricción de sockets; no se declara aprobada la prueba E2E local.

## Pendiente para integrar

Resolver el caso completo y verificarlo en navegador. Mantener esta implementación en una rama de trabajo hasta entonces. No sustituir una prueba de aceptación por el hecho de que el rechazo funcione.
