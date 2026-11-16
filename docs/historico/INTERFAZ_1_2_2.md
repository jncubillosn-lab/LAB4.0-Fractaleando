> **Archivo histórico · desarrollo cerrado el 16 de noviembre de 2026.**
> Este documento describe su fecha de corte. Las propuestas no incorporadas
> quedaron descartadas y sus pendientes no constituyen un plan de desarrollo.
> El estado final se describe en [Cierre de desarrollo](../CIERRE_DESARROLLO.md).

# 1.2.2 · Indicador pequeño e icono de nodos

Fecha: 15 de noviembre de 2026. Sustituye la ilustración de carga de 1.2.1.

## Indicador

Se utiliza el [GIF Ajax-loader](https://commons.wikimedia.org/wiki/File:Ajax-loader.gif),
de Ajaxload, publicado como dominio público: 32 × 32 píxeles, 12 fotogramas,
un ciclo de 1,2 s y 3.208 bytes. El archivo se copia sin modificar a
`css/images/loading.gif`; no hay diseño generado ni acceso remoto al mostrarlo.
`loading-still.png` contiene su primer fotograma para movimiento reducido.
La procedencia y firma están en `css/images/LICENSE-Ajaxload.txt`.

El indicador se presenta a su tamaño original. Un giro de CSS sobre `transform`
le proporciona movimiento sin depender exclusivamente del repintado del GIF.
La promoción se limita a esa imagen de 32 píxeles. Al ocultar la tarjeta deja
de mostrarse y, con movimiento reducido, se detienen la imagen y la barra.
No se añade ningún bucle de animación JavaScript. Véase la guía de
[animaciones mediante composición](https://web.dev/articles/animations-guide).

La prueba de navegador observa posiciones distintas del indicador durante el
cálculo real de los 210 conceptos y 217 conexiones, sin retener artificialmente
el Worker. Conserva además la comprobación de fotogramas y de la imagen fija.
En el [perfil posterior](../evidencias/CARGA_1_2_2_DESPUES.json) se observaron más
de 300 posiciones distintas durante la carga; Chrome confirmó una animación
acelerada de transformación en la capa de la imagen. Esto comprueba el mecanismo
utilizado en ese navegador, sin atribuirlo a un motor JavaScript nuevo.

## Medición y límites

Se midió la versión anterior en un Chrome aislado, con el GIF de tejido y
sustituyéndolo por una imagen fija. Los resultados se conservan en el
[perfil previo](../evidencias/CARGA_1_2_2_ANTES.json). Fueron 4,86 s y 4,51 s;
el mayor intervalo entre cuadros de la pantalla fue de unos 117 ms en ambos.
La muestra no demuestra que el GIF fuera la causa de la diferencia y no
reprodujo un bloqueo prolongado en ese entorno. El perfil sitúa el trabajo
principal de rutas en el Worker; el hilo de la página conserva breves tareas
de topología y presentación al recibirlo.

Por ello se reduce el indicador y se separa su giro del repintado del GIF,
conservando los algoritmos y sus resultados. Esta corrección no promete una
animación ininterrumpida ante cualquier saturación del equipo o configuración
del navegador. El caso de respaldo sin Worker mantiene el cálculo síncrono
existente; cambiar ese algoritmo requiere una tarea distinta.

## Icono de pestaña

`css/images/favicon.svg` representa una pequeña red de cinco nodos. Se declara
en el encabezado como icono del sitio y adapta el contraste a la apariencia
del navegador. Se incluye en la misma identidad de caché de la publicación.
