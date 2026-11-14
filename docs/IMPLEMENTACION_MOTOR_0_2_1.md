# Motor gráfico 0.2.1

Esta implementación aplica las correcciones verificadas de la ronda propositiva. Conserva SVG, la interfaz y el grafo conceptual. Incluye la base radial del trabajo previo, manteniendo su estado experimental; no declara resuelto el radial completo ni cambia la referencia 01.

## Qué comprobar en la página

1. Abrir 01 y pulsar «Todas las capas»: el PPR conserva sus 210 conceptos y 217 vínculos.
2. Seleccionar 02: si el radial no satisface las comprobaciones, se conserva 01 y se muestran sus fallos concretos.
3. Seleccionar 04: se muestran sus recorridos y el informe comparado con 01. Los pendientes y cambios topológicos se señalan; la vista no se autoaprueba.
4. Exportar: el JSON conserva el grafo completo; las imágenes derivadas conservan el aviso de revisión. Las cachés incompatibles no se exportan como comprobadas.

El identificador del documento HTML es `p1-motor-validacion-0.2.1`.

## Correcciones aplicadas

- Salida y llegada por la cara correcta, sin atravesar los cuadros de los extremos.
- Intersecciones calculadas con las mismas primitivas en el enrutador y el registro; simplificación sin acumular desviaciones inválidas.
- Referencia topológica 01 compartida, comparación circular de puertos y libertad para cambiar de cara.
- Orden de las ramas principales tomado de los puertos reales de 01.
- Elección de caras del radial compacto a partir del espacio físico entre cajas.
- Presupuesto que cubre búsqueda inicial, A* y reintentos; al agotarse conserva todas las conexiones como resueltas o pendientes explícitas.
- Cachés vinculadas al grafo y su referencia; contadores y avisos coherentes con lo representado.

La comparación ELK permanece como banco de desarrollo reproducible mediante `npm ci` y `npm run bench:layouts`. No se activa como motor de producción: el resultado ensayado por capas introduce cruces que la referencia actual no admite.

## Estado de aceptación

La base cuenta con 42 pruebas unitarias y las suites de navegador `pages_e2e.py`, `views_e2e.py` y `topology_guard_e2e.py`. Incluyen aceptación de casos compatibles y rechazo de candidatos incorrectos; pasar esas pruebas no convierte el PPR radial en un caso resuelto.

Siguen pendientes la colocación y el trazado radial completos, la comprobación integral de curvas y grosores, y las definiciones D1–D4 de las [normas jerarquizadas](NORMAS_JERARQUIZADAS_P1.md). La [ronda propositiva](PROPUESTA_MOTOR_GRAFICO.md) conserva las mediciones y el orden de trabajo propuesto.
