# Dependencias del sitio

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
