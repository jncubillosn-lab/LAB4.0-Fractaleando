# P1 · Evaluación de Libavoid para el enrutamiento de 01 · Plano

**Fecha:** 10 de noviembre de 2026  
**Rama de ensayo:** `experiment/p1-routing-libavoid`  
**Programa de producción:** `main` — sin modificaciones  
**Conclusión:** **No adoptar Libavoid como sustituto directo de PcbRouter.**

## Pregunta

¿Podemos obtener rutas más rápidas y geométricamente válidas para P1 sin modificar cuadros, conceptos, puertos, puntos de control ni interfaz?

## Método reproducible

Se ejecutó `node experiments/routing/compare.mjs` en GitHub Actions, instalando únicamente en el entorno de CI `libavoid-js@0.5.0-beta.5`. El ensayo no incorpora paquetes a la web pública. Se utiliza `tests/route-fixture.json`, derivado del ejemplo real PPR: **210 conceptos y 217 vínculos**. Se conservaron las **mismas coordenadas, dimensiones y puertos preasignados** al comparar motores.

Se evaluaron tres variantes externas:

1. **Default:** Libavoid ortogonal con extremos en los puntos de salida de cada puerto.
2. **Strict:** penalizaciones elevadas para cruces y tramos compartidos, separaciones y *nudging*.
3. **Pins:** pines de conexión exclusivos de Libavoid y separación reservada alrededor de los cuadros.

Todas las geometrías producidas se verificaron con **el mismo `GeometryValidator` de P1**, sin excepciones para la biblioteca externa.

## Resultados del ensayo final

| Métrica | PcbRouter | Libavoid default | Libavoid strict | Libavoid pins |
|---|---:|---:|---:|---:|
| Vínculos con polilínea | 217 | 217 | 217 | 217 |
| **Rutas inválidas para P1** | **0** | **53** | **53** | **66** |
| Cruces en rutas admitidas por el validador | 71 | 84 | 86 | 79 |
| Conflictos en tramos paralelos | 0 | 52 | 52 | 54 |
| Rutas con conflictos cerca de cruces/giros | 0 | 50 | 10 | 22 |
| Rutas inválidas incluso sin otras rutas | 0 | 0 | 0 | 17 |
| Longitud total aproximada | 176.378 | 175.964 | 175.967 | 175.930 |
| Tiempo de búsqueda en esa ejecución | 1.367 ms | 137 ms | 101 ms | 119 ms |

**Aclaraciones:** las categorías de conflictos se superponen y no deben sumarse. Los tiempos son los de un único entorno de GitHub Actions, no representan una promesa de rendimiento universal. La longitud de una ruta inválida no justifica aceptarla. El total de cruces externos excluye rutas rechazadas por el validador.

El primer ensayo también identificó **181 conexiones con geometría diferente** respecto del punto de control de referencia, aun sin mover ningún concepto. Introducir el motor directamente como sustitución global comprometería la estabilidad geométrica exigida por P1.

**Evidencia:** [GitHub Actions — comparación final](https://github.com/jncubillosn-lab/LAB4.0-Fractaleando/actions/runs/42961007966).

## Interpretación

- Los recorridos por separado de la variante default y strict no invadían cuadros: sus fallos emergieron al combinar conexiones.
- Las penalizaciones de Libavoid redujeron algunos conflictos próximos a giros, **pero no eliminaron 52 problemas con recorridos paralelos**.
- Añadir pines exclusivos no consiguió garantizar R03 ni R04 tal como las define P1.
- La ejecución WebAssembly fue más rápida, pero la condición principal no es velocidad, sino **cumplimiento geométrico verificable**.
- Este experimento solo mide el grafo inicial. **No reproduce el movimiento manual complejo H04**; por tanto, no demuestra una mejora en los vínculos pendientes de ese caso. Dado que las variantes ya fallan en el caso inicial, no procede integrar su resultado.

## Decisión de arquitectura

**No hacer cambios en `main`.** Conservar el motor actual, la visualización, los puntos de control y el JSON vigentes. No añadir dependencias WASM ni sistema de construcción al sitio publicado.

La posibilidad de integrar Libavoid queda condicionada a obtener **cero rutas inválidas**, conservar rutas anteriores no afectadas, y demostrar mejoras en un caso incremental de arrastre. No se reserva una integración futura por defecto.

## Siguiente candidato técnico para H04

Si se reabre la intervención de enrutamiento, la siguiente comparación debería centrarse en el **motor actual**: detectar obstáculos mediante índice espacial y ensayar *rip-up and reroute* **local y transaccional** sobre un caso H04 reproducible. Esta recomendación no autoriza a implementar funciones nuevas sin demostrarlas contra las pruebas ya existentes.

El programa y las vistas 02–04 están fuera del alcance de este experimento.
