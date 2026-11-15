# 1.2.0 · Tejer y otras miradas

Fecha: 15 de noviembre de 2026. Amplía la [interfaz 1.1](INTERFAZ_1_1_0.md)
sobre la misma [base funcional](VERSION_1_0_0.md).

## Siete fragmentos nuevos

El carrusel conserva sus diez fragmentos anteriores y añade los siguientes.
Son poemas sobre percepción, vínculos, memoria, tiempo y ausencia, sin convertir
la experiencia literaria en consejos de autoayuda o consignas de optimismo.
Cada cita conserva hasta 25 palabras y el enlace permite leer su contexto.
Las dos versiones españolas del francés se prepararon para Fractalear y se
identifican como tales; no se atribuyen como traducciones publicadas del autor.

| Autora | País | Poema | Fuente del fragmento |
| --- | --- | --- | --- |
| Olga Orozco | Argentina | Con esta boca, en este mundo | [En la otra puerta](https://enlaotrapuerta.com.ar/textos/367/con-esta-boca-en-este-mundo-de-con-esta-boca-en-este-mundo/) |
| Blanca Varela | Perú | Casa de cuervos | [Ciudad Seva](https://ciudadseva.com/texto/casa-de-cuervos/) |
| Meira Delmar | Colombia | Retornos | [Revista Palimpsesto](https://www.revistapalimpsesto.com/meira-delmar-poemas/) |
| Dulce María Loynaz | Cuba | Tiempo, sección 4 | [Ciudad Seva](https://ciudadseva.com/texto/tiempo/) |
| Idea Vilariño | Uruguay | Escribo, pienso, leo | [Ciudad Seva](https://ciudadseva.com/texto/escribo-pienso-leo/) |
| Anna de Noailles | Francia | L’Empreinte | [Wikisource, edición de 1901](https://fr.wikisource.org/wiki/Le_C%C5%93ur_innombrable/L%E2%80%99Empreinte) |
| Catherine Pozzi | Francia | Ave | [Wikisource, edición de 1935](https://fr.wikisource.org/wiki/Po%C3%A8mes_(Pozzi)/Ave) |

Se mantiene la navegación, la pausa y el avance a los 24 segundos, sin consultas
remotas durante el uso. El [informe de las diecisiete fuentes](evidencias/FUENTES_POETICAS_1_2_0.json)
registra respuestas en vivo y presencia de los fragmentos, siguiendo el control
manual descrito en [mantenimiento](MANTENIMIENTO.md). Describe su disponibilidad
en esa fecha, no una garantía de disponibilidad futura.

## Animación de tejido

La tarjeta de carga incorpora una ilustración original de dos manos, agujas,
ovillo y tejido. Es un SVG integrado de dos tonos con trazos de píxeles y cuatro
posiciones animadas por CSS. Se buscó una animación reutilizable existente sin
encontrar una opción adecuada para la forma, el peso y el uso del proyecto.

La solución no añade descargas, dependencias ni ciclos JavaScript. Está fuera
del SVG del grafo y no aparece en las exportaciones. Al ocultar la tarjeta se
oculta también la animación; con movimiento reducido se muestra una pose fija.
Conserva la barra indeterminada y sus mensajes reales, sin simular porcentajes.
Los colores se adaptan al tema claro u oscuro.

Se verifica en Chrome que cambie de pose y se detenga con movimiento reducido,
además de recorrer los diecisiete fragmentos y conservar la regresión del grafo.

## Almacenamiento futuro

La [propuesta de Drive](PROPUESTA_DRIVE.md) queda documentada para una etapa
posterior. Esta versión no publica un servicio de nube ni incorpora credenciales.
