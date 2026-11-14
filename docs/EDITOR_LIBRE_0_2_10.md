# Editor libre y espiral estable · 0.2.10

## Restauración verificada en GitHub

Se recuperaron directamente los archivos de la versión 0.2.8, commit
[`dc54d9d`](https://github.com/jncubillosn-lab/LAB4.0-Fractaleando/tree/dc54d9d6c5006dbfe6be68f8c2b6510dbc16e723).
No se reconstruyó el motor a partir de su descripción.

Los siguientes archivos coinciden con los blobs originales de GitHub:

| Archivo | Blob original |
| --- | --- |
| `js/geometry/SpiralLayout.js` | `14a7639ff0db4790731af29c50a93fe6c4bced25` |
| `js/geometry/DerivedScene.js` | `1a37ec7fd8324e8e6f248d624becaf9b18df4f26` |
| `js/geometry/AvoidRouter.js` | `d141c73ebcdbec364213179e4e1a5f88ff24c3af` |

También se recuperó el router de esa versión. Su opción adicional de cruces
junto a un giro solo se activa en el Editor; las derivadas usan el comportamiento
original. Se retiran el modelo Raup, sus controles y su persistencia de parámetros.
Los datos de conceptos y vínculos de los JSON anteriores se siguen leyendo.

La espiral vuelve a los valores reales de 0.2.8: giro interno 0,25, apertura
angular 0,85 y T = 0. Se muestran numéricamente, sin presentarlos como W–D–T
biológico. Las cachés del experimento 0.2.9 no se reutilizan como geometría estable.

## Editor y vistas derivadas

01 es un espacio de edición. Mover un concepto conserva su identidad, sus
vínculos y su parentesco, y permite cambiar el orden espacial, las caras de
entrada/salida y los cruces. Se elimina la devolución automática a la posición
anterior por diferencias de la representación topológica.

Al completar una edición con rutas resueltas, el Editor adopta esa disposición
como su referencia actual. Las identidades de los vínculos se conservan.
La comparación estricta sigue siendo el comportamiento predeterminado del
registro; únicamente el Editor usa la opción explícita de edición.
02 y 03 continúan siendo de lectura y verificándose contra la referencia de 01,
con los controles de puertos, cruces, continuidad y geometría de 0.2.8.
Los pendientes normativos existentes permanecen visibles.

El rendimiento depende del punto de control local: se calculan las rutas
incidentes a un cuadro modificado y las que colisionan con su nueva caja.
Los recorridos ajenos se conservan y no se ejecuta otra distribución inicial.
Los puertos se vuelven a elegir en ambos extremos de cada ruta afectada,
en vez de usarlos como anclas. Se mantiene la prevención física de superponer
cuadros y de atravesarlos con conexiones.

Se conservan PNG 4K, tipografía fija, profundidad máxima inicial, identidad
Fractalear, nombres 01 Editor / 02 Compacto / 03 Espiral, selección adyacente,
grosores jerárquicos y colocación flexible de conceptos de 3:30.
