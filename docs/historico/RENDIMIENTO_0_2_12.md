> **Archivo histórico · desarrollo cerrado el 16 de noviembre de 2026.**
> Este documento describe su fecha de corte. Las propuestas no incorporadas
> quedaron descartadas y sus pendientes no constituyen un plan de desarrollo.
> El estado final se describe en [Cierre de desarrollo](../CIERRE_DESARROLLO.md).

# 0.2.12 — Carga y cálculos repetidos

Fecha: 14 de noviembre de 2026. Base funcional:
[corte 0.2.11](CORTE_0_2_11.md), publicado en el commit
[`78a22bb`](https://github.com/jncubillosn-lab/LAB4.0-Fractaleando/tree/78a22bb41737c5d24a8f94f8e1e5f20609959d90).

## Objetivo y alcance

Reducir el trabajo de carga y de geometría conservando el funcionamiento
alcanzado. Se mantienen las tres vistas, el Editor libre, la distribución por
reloj, los parámetros de espiral, la tipografía, los grosores y estilos,
los cruces, el guardado y las exportaciones. Los pendientes normativos de
Compacto y Espiral siguen siendo los registrados en 0.2.11.

## Cuellos de botella identificados

El perfil de CPU del trazado inicial del ejemplo completo concentra trabajo en
`segmentRelation`, `segmentIntersection`, la evaluación de candidatos y la
comprobación de obstáculos. Muchos pares se comparaban mediante el cálculo
exacto aunque sus límites espaciales no podían encontrarse. El recorte contra
rectángulos creaba arreglos temporales en cada comprobación.

En Chrome se contaron **11.110 llamadas a `measureText`** durante la secuencia
de arranque y comprobación inicial de 0.2.11. Las mismas palabras y renglones
se medían repetidamente para ambos pesos, al distribuir, reconciliar y dibujar.

## Cambios aplicados

| Área | Optimización | Conservación del resultado |
| --- | --- | --- |
| Intersecciones en 01 | Descartar primero pares con límites espaciales separados. Los límites se amplían conservadoramente para incluir la tolerancia de extremos y el redondeo numérico. | Los pares restantes pasan por las mismas ecuaciones y tolerancias de aceptación de 0.2.11. |
| Obstáculos en 01 | Recorrer los dos ejes con valores escalares, evitando arreglos temporales por cada rectángulo. | Se conservan las ecuaciones de recorte y sus decisiones. |
| Texto | Reutilizar medidas de palabras y renglones por contexto, tamaño y configuración de Canvas. Cada medida considera los pesos 600 y 700. | El ancho, la altura, los márgenes y los renglones siguen calculándose con la misma lógica. |
| Memoria e invalidación | Máximo de 2.048 medidas por contexto; los textos de más de 512 caracteres se miden sin retenerse. Se renueva la caché al cambiar la configuración o cargar la fuente real. | La edición consulta medidas correspondientes al texto y contexto actuales; no reutiliza medidas de la fuente de respaldo. |

La caché de texto es interna y temporal. El JSON continúa en `p1.graph.v1`;
la compatibilidad de archivos y los puntos de control existentes se mantienen.
Las comprobaciones geométricas rápidas se seleccionan únicamente en el
enrutador de 01. Las vistas derivadas conservan sus funciones numéricas
anteriores, porque sus decisiones de recuperación dependen también del tiempo
de cálculo. La caché de medidas beneficia el dibujo de las tres vistas.

## Medición reproducible del trazado

Se compararon tres procesos nuevos por versión, alternando base y optimización,
con Node **v24.22.1** en Windows y la misma entrada de **210 conceptos y
217 vínculos** de `tests/route-fixture.json`.

| Muestra | Base 0.2.11 | Optimizada |
| --- | ---: | ---: |
| 1 | 5.281 ms | 3.414 ms |
| 2 | 5.182 ms | 3.421 ms |
| 3 | 5.183 ms | 3.367 ms |
| **Mediana** | **5.183 ms** | **3.414 ms** |

La mediana del cálculo de rutas disminuyó **34,1 %**. Las seis ejecuciones
resolvieron los mismos 217 vínculos en 217 intentos. La firma SHA-256 de las
rutas completas, incluidos puntos, puertos y orden, fue idéntica:

```text
16495caf18e8450e49faf724420e4b46df38bc8ae63542399e16f9ff336a9a17
```

Los datos de referencia y navegador se conservan en
[la evidencia de rendimiento](../evidencias/RENDIMIENTO_0_2_12.json).
El tiempo de cálculo no representa por sí solo el tiempo de carga por Internet:
también intervienen la red, el navegador, los recursos y el dibujo.

### Ensayo de navegador

| Medida | Referencia | Optimizada |
| --- | ---: | ---: |
| Llamadas a `measureText` | 11.110 | 1.126 |
| Arranque y comprobación inicial del ensayo | 7.545 ms | 2.978 ms |
| Intentos de trazado inicial | 217 | 217 |
| Firma del dibujo inicial | Idéntica | Idéntica |

Las mediciones de texto disminuyeron **89,9 %**. Los tiempos de navegador son
orientativos: corresponden a ejecuciones distintas de GitHub Actions, con un
servidor estático local, e incluyen la comprobación inicial del ensayo. No
aislan la mejora del equipo del runner ni simulan la conexión del usuario a
Pages. La reducción de **34,1 %** anterior sí procede de la comparación alternada
en la misma máquina.

Para repetir la comparación con una copia del repositorio que contenga la
referencia histórica:

```sh
npm ci
npm run bench:performance -- 78a22bb41737c5d24a8f94f8e1e5f20609959d90 3
```

El comando extrae el código de referencia únicamente en `artifacts/performance/`,
ejecuta ambas versiones en procesos separados y genera `routing-comparison.json`.
La copia de trabajo permanece en su rama. El ensayo falla si las firmas difieren.

## Comprobación del comportamiento

Las pruebas de equivalencia contrastan **12.000 casos de segmentos y obstáculos**
contra una copia congelada de las funciones de 0.2.11, además de extremos
cercanos al límite de tolerancia. La prueba del Worker comprueba la firma
exacta del trazado original. Las pruebas de tipografía verifican reutilización,
edición, cambios de contexto, límite de retención y renovación tras cargar fuentes.

La prueba de Chrome compara también la firma de posiciones, dimensiones,
recorridos y renglones del dibujo inicial con la capturada antes de optimizar:

```text
143ae8e33864b4d0af8b16a5f31bca685e370f3662f90775e05bfb57de4a83b6
```

Las comprobaciones de edición, selección, estilos, jerarquías, importación,
las tres vistas y PNG/SVG continúan en las suites existentes. Los tiempos son
mediciones del ensayo, no umbrales fijos para equipos diferentes.

El código final pasó **75 pruebas Node y las tres suites de Chrome**. En las
derivadas se comprueban integridad, trazabilidad y ausencia de solapes y rutas
pendientes en el ejemplo. Sus decisiones de recuperación están sujetas a
presupuestos temporales preexistentes: los recorridos y los pases pueden variar
entre ejecuciones y equipos. La igualdad exacta de firmas registrada en este
corte corresponde al Editor inicial.

## Costes que permanecen

La primera construcción de Compacto y Espiral sigue calculando distribuciones
y recorridos del grafo completo. El ejemplo continúa necesitando varios pases
de colocación y enrutamiento. Las vistas ya calculadas conservan su recuperación
desde caché; los filtros y la cámara reutilizan sus puntos de control.

La descarga inicial conserva los mismos archivos de fuentes y módulos.
Las auditorías completas todavía comparan múltiples rutas y cuadros. Estos
costes permanecen identificados para una medición posterior; este corte mejora
las comprobaciones repetidas y mantiene la misma solución gráfica.
