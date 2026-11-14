# Dependencias del sitio

Los conceptos y los títulos de las vistas utilizan **Rajdhani**, pesos 600 y
700, de Indian Type Foundry (copyright 2014), bajo SIL Open Font License 1.1.
Se incluyen los TTF originales, sin modificar, de
https://github.com/google/fonts/tree/main/ofl/rajdhani.
Sus identificadores de blob Git son
`d43750bd05c130d36c8e7fbeb06ecd7c5d3c3b17` (SemiBold) y
`47af15713b45605a5d98241b8211a3409f522b34` (Bold).
La licencia completa acompaña a las fuentes en `css/fonts/OFL-Rajdhani.txt`.
Se sirven desde el propio sitio y se incrustan con su licencia en los SVG
exportados para conservar la apariencia al abrirlos de forma independiente.

El motor de conexiones utiliza **libavoid-js 0.5.0-beta.5**, de Vladyslav
Hnatiuk y los autores de libavoid/Adaptagrams, bajo LGPL-2.1-or-later.
Código fuente, autores y licencia: https://github.com/Aksem/libavoid-js
y https://www.adaptagrams.org/.

La versión exacta y su integridad están fijadas en package-lock.json.
La compilación copia sin modificar el módulo JavaScript y el binario WASM
del paquete; se distribuyen como archivos separados en js/vendor/.
La licencia se publica junto a ellos en js/vendor/LICENSE-libavoid.txt.
El binario no se incrusta en el JavaScript y puede sustituirse conservando
la interfaz. No se necesita un CDN ni un servicio externo para calcular.

Para preparar el sitio: `npm ci` y `npm run build`. Servir `_site/` por HTTP.
La licencia de esta dependencia no establece una licencia para el resto
del código del proyecto.
