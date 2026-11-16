> **Archivo histórico · desarrollo cerrado el 16 de noviembre de 2026.**
> Este documento describe su fecha de corte. Las propuestas no incorporadas
> quedaron descartadas y sus pendientes no constituyen un plan de desarrollo.
> El estado final se describe en [Cierre de desarrollo](../CIERRE_DESARROLLO.md).

# 1.1.0 · Carga, controles y otras miradas

Fecha: 15 de noviembre de 2026. Conserva la [base funcional 1.0.0](VERSION_1_0_0.md)
y su etiqueta intacta. No cambia los algoritmos ni los valores de las vistas.

## Cambios de interfaz

La barra de carga aparece centrada sobre el lienzo durante la preparación
inicial, el cálculo de Compacto/Espiral y la exportación. Muestra la etapa real
recibida del cálculo y una animación indeterminada: no se simulan porcentajes.
Las operaciones tienen identificadores separados; terminar o cancelar una no
oculta el trabajo de otra. Se deja pintar antes de los cálculos síncronos de
respaldo. Con movimiento reducido la animación se detiene, conservando el estado.

Guardar JSON, Abrir JSON, SVG y PNG 4K se agrupan en la barra superior.
Núcleo y Centrar lectura quedan debajo de los controles de zoom. El botón del
ejemplo se llama **Ejemplo**. El encabezado puede distribuirse en dos filas
según el ancho, conservando los controles accesibles.

**Otras miradas** sustituye el bloque Archivo de la barra lateral. Contiene diez
fragmentos de poemas sobre vínculos, encuentro, percepción y el mundo compartido.
Son citas de los autores, no poemas generados. Los textos no españoles conservan
el original y debajo una traducción del fragmento preparada para Fractalear,
identificada como tal. El enlace permite leer el poema y comprobar su contexto.

El carrusel avanza cada 24 segundos. Tiene anterior, siguiente y pausa; deja de
avanzar al señalarlo, enfocarlo con teclado o cambiar de pestaña. Comienza
pausado si el sistema solicita movimiento reducido. Los fragmentos están
incluidos localmente: no hay peticiones a las fuentes durante la edición.

## Fuentes de los diez fragmentos

Los extractos originales son breves, de hasta 25 palabras. Se conservan sus
saltos de verso. Las versiones españolas no se atribuyen al autor como textos
originales ni como traducciones publicadas de terceros.

| Autor | Poema | Idioma | Fuente consultada |
| --- | --- | --- | --- |
| Roberto Juarroz | Poesía vertical, poema 1 | Español | [Poesi.as, texto del poema](https://roble.poesi.as/rj01001.htm). |
| Alice Dunbar-Nelson | Sonnet | Inglés | [Academy of American Poets](https://poets.org/poem/sonnet-0). |
| Helen Hoyt | Ellis Park | Inglés | [Infoplease, fuentes primarias](https://sudoku.infoplease.com/primary-sources/poetry/modern-verse/helen-hoyt-ellis-park). |
| Eugénio de Andrade | Os amantes sem dinheiro | Portugués | [Escritas, texto](https://www.escritas.org/PT/t/2138/os-amantes-sem-dinheiro); [RTP, grabación del autor](https://arquivos.rtp.pt/conteudos/dia-mundial-da-poesia-parte-ii/). |
| Charlotte Mew | I so liked Spring… | Inglés | [Scottish Poetry Library](https://www.scottishpoetrylibrary.org.uk/poem/i-so-liked-spring/). |
| Clarissa Scott Delany | Joy | Inglés | [Academy of American Poets](https://poets.org/poem/joy-0). |
| Amy Lowell | A Decade | Inglés | [Academy of American Poets](https://poets.org/poem/decade/print). |
| Georgia Douglas Johnson | Your World | Inglés | [Beltway Poetry Quarterly, poema y contexto](https://washingtonart.com/beltway/gdjohnson.html). |
| Angelina Weld Grimké | The Black Finger | Inglés | [Academy of American Poets](https://poets.org/poem/black-finger/print). |
| Jessie B. Rittenhouse | Debt | Inglés | [Poetry Explorer](https://www.poetryexplorer.net/poem26.php?pid=10120470). |

## Comprobación

En 1.1.1 se revisaron las diez fuentes mediante solicitudes en vivo, siguiendo
redirecciones y comprobando que cada página contuviera su fragmento. Las fuentes
anteriores de Juarroz (UNAM) y Johnson (Poetry Foundation) devolvían HTTP 403;
se sustituyeron los enlaces conservando los textos. El resultado fechado queda
en [la comprobación de fuentes](../evidencias/FUENTES_POETICAS_1_1_1.json).
Este control describe la disponibilidad en ese momento, no una garantía futura.

La regresión mantiene las firmas existentes del dibujo y de las rutas del
ejemplo. Se verifican estados de carga superpuestos, errores y cancelación,
pausa del carrusel y sus diez fuentes, disposición de botones y ancho de 900 px.
Las cuatro suites de Chrome mantienen la cobertura de edición, las tres vistas,
archivos, exportación 4K y geometría. El indicador y el carrusel son elementos
de interfaz y no se incluyen en SVG ni PNG del diagrama.
