# 1.2.1 · GIF de tejido

Fecha: 15 de noviembre de 2026. Corrige la ilustración de carga de
[1.2.0](INTERFAZ_1_2_0.md). Conserva los diecisiete fragmentos y la geometría.

La tarjeta muestra ahora una persona sentada que teje. El movimiento pertenece
a un GIF real, no a transformaciones CSS del dibujo: diez fotogramas, seis poses
distintas de manos y agujas, 120 ms por fotograma y repetición continua.
El GIF mide 64 × 80 píxeles, se presenta a 128 × 160 y pesa 6.107 bytes.
Usa negro, blanco y transparencia, sin halos ni sombras.

El archivo se sirve localmente desde `css/images/knitting.gif`. Un `picture`
selecciona `knitting-still.png` cuando el navegador solicita movimiento reducido.
Se conserva la barra con su mensaje real y el cierre por operación. El tema
oscuro invierte ambos tonos; la ilustración queda fuera de las exportaciones.
La construcción copia las imágenes sin alterarlas y añade su versión de caché
a las referencias HTML. No se añade código de animación al motor del grafo.

La prueba de navegador retiene el cálculo pendiente y compara dos capturas
del propio GIF separadas por 350 ms. Deben ser distintas. Con movimiento
reducido, dos capturas deben ser iguales y la imagen seleccionada debe ser PNG.
Se mantiene la comprobación de carga, cancelación y las tres vistas.

## Procedencia y preparación

La hoja de seis poses se generó con la herramienta integrada de imágenes.
El [registro de procedencia](evidencias/TEJIDO_1_2_1.json) conserva el prompt,
la firma del original y los tamaños finales. El original queda conservado en
el directorio de imágenes generadas de la sesión; no se descarga en el sitio.

`scripts/encode-knitting-gif.py` empaqueta la hoja en tres columnas y dos filas:
recorta con un marco común, reduce a una paleta de dos tonos y transparencia,
y escribe el GIF y la alternativa fija. Requiere Pillow únicamente para esta
preparación manual. La aplicación y su construcción no ejecutan ese script.
