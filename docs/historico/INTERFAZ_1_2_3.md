> **Archivo histórico · desarrollo cerrado el 16 de noviembre de 2026.**
> Este documento describe su fecha de corte. Las propuestas no incorporadas
> quedaron descartadas y sus pendientes no constituyen un plan de desarrollo.
> El estado final se describe en [Cierre de desarrollo](../CIERRE_DESARROLLO.md).

# 1.2.3 · El castor en cuatro viñetas

Fecha: 15 de noviembre de 2026. Sustituye el indicador animado de 1.2.2.

La carga muestra una tira horizontal fija del mismo castor: une conectores de
cables, teje, consulta un manual con diagramas y come una galleta. La estética
es de consola retro, con contornos de píxeles y dos colores sólidos.

`css/images/beaver-strip.png` mide 768 × 224 píxeles, pesa 6.499 bytes y tiene
un único fotograma. El PNG utiliza un bit por píxel en escala de grises:
solo admite negro y blanco, sin valores intermedios, transparencia ni tramado.
La imagen se generó con la herramienta integrada y se preparó como PNG
monocromo, conservando las cuatro escenas. El [registro de procedencia](../evidencias/CASTOR_1_2_3.json)
conserva el prompt y las firmas del original y del resultado.

La tarjeta alcanza 640 píxeles y se adapta al ancho del lienzo. La tira ocupa
su ancho disponible, mantiene su proporción y usa presentación de píxeles
definidos. En claro se integra con el papel de la interfaz; en oscuro se
invierten los tonos. Se mantiene el icono de nodos de la pestaña.

Se retiran el GIF, la imagen alternativa, su declaración de procedencia y el
giro CSS. La tira no tiene animaciones, temporizadores ni cambios de imagen.
La barra indeterminada y los mensajes de la operación conservan su función;
la preferencia de movimiento reducido continúa deteniendo la barra.

La ilustración queda fuera del SVG del grafo y de sus exportaciones. El motor
geométrico conserva sus valores y referencias. La construcción comprueba
dimensiones, formato de un bit y tamaño, y el navegador comprueba que la tira
permanezca idéntica durante la carga, con y sin movimiento reducido, además de
la carga real del ejemplo y las tres vistas.
