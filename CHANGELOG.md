# Registro de cambios

## 1.2.3 — 15 de noviembre de 2026

- Sustituye el GIF por una tira fija de cuatro viñetas del mismo castor:
  conectando cables, tejiendo, leyendo un manual y comiendo una galleta.
- PNG de 768 × 224 píxeles, un solo fotograma y dos valores de color, sin
  grises ni tramado. Pesa 6.499 bytes y se sirve desde el sitio.
- Amplía la tarjeta de carga para presentar la tira horizontal, adapta su
  contraste al tema y retira el giro y los recursos del indicador anterior.
- Conserva los mensajes de cálculo, la barra y el icono de nodos. Comprueba
  imagen fija, caché, carga del ejemplo y regresión de las tres vistas.

## 1.2.2 — 15 de noviembre de 2026

- Sustituye la ilustración por un GIF externo de dominio público de 32 × 32
  píxeles y 3.208 bytes. Se sirve localmente y conserva alternativa fija para
  movimiento reducido; retira el GIF de tejido y su script de preparación.
- El giro del indicador usa únicamente `transform` en una capa de composición,
  sin temporizadores JavaScript ni cambios del cálculo geométrico.
- Añade el icono de una red de cinco nodos para la pestaña del navegador.
- Comprueba el movimiento durante la carga real de los 210 conceptos del
  ejemplo, además de los controles de imagen, caché y movimiento reducido.

## 1.2.1 — 15 de noviembre de 2026

- Sustituye el SVG de manos por un GIF real de una persona tejiendo: diez
  fotogramas, seis poses diferentes y un ciclo de 1,2 segundos, en dos tonos
  sobre transparencia. El archivo pesa 6.107 bytes y se sirve desde Pages.
- Conserva una imagen PNG fija para movimiento reducido y adapta ambos al tema
  oscuro. Retira la animación CSS anterior del tejido.
- Incluye las imágenes en la identidad de caché del sitio. La prueba de navegador
  compara capturas del GIF durante carga y comprueba que la alternativa fija no
  cambie de imagen, además de conservar la regresión del grafo.

## 1.2.0 — 15 de noviembre de 2026

- Amplía Otras miradas a diecisiete fragmentos: cinco poetas latinoamericanas
  y dos francesas. Conserva el criterio literario y las fuentes, con original
  francés y versión en español identificada como traducción de Fractalear.
- Añade manos tejiendo en pixel art a la barra de carga. La secuencia usa SVG
  integrado y dos animaciones CSS de cuatro posiciones, sin nuevas peticiones,
  bibliotecas o temporizadores JavaScript. Respeta movimiento reducido y tema.
- Comprueba las diecisiete fuentes en vivo y la navegación completa del carrusel;
  verifica movimiento y pausa de la ilustración en navegador.
- Documenta como propuesta la integración de Drive, separando el acceso sin
  cuentas de visitantes de los límites reales de almacenamiento y concurrencia.

## 1.1.1 — 15 de noviembre de 2026

- Sustituye las fuentes de Roberto Juarroz y Georgia Douglas Johnson, que
  devolvían HTTP 403, por páginas accesibles con el poema y la cita correspondiente.
- Comprueba en vivo los diez enlaces y documenta el resultado. Se añade una
  revisión manual que exige una respuesta correcta y la presencia del fragmento;
  no se ejecuta durante la carga de la herramienta ni en las pruebas sin red.

## 1.1.0 — 15 de noviembre de 2026

- Barra de carga centrada, con etapa real e indicador indeterminado durante el
  arranque, cálculo de vistas y exportaciones. Cierre independiente por operación,
  incluida cancelación o fallo, sin modificar el motor geométrico.
- Acciones de archivo en la barra superior; Núcleo y Centrar lectura bajo los
  controles de zoom. Ejemplo PPR se presenta como **Ejemplo**.
- Carrusel local de diez fragmentos poéticos verificados, con autor, fuente,
  original y versión en español cuando corresponde; navegación y pausa.
- Comprobaciones de concurrencia de carga, error, temporizadores del carrusel,
  distribución de controles y presentación a 900 px. Fuentes y decisiones en
  [interfaz 1.1.0](docs/INTERFAZ_1_1_0.md).

## 1.0.0 — 15 de noviembre de 2026

Cierre funcional de Fractalear sobre la base aceptada 0.2.15. El cambio de
versión conserva el motor gráfico y sus decisiones numéricas.

- Inicio y Nuevo con un único J0: **¿Qué quieres fractalear hoy?**. Ejemplo PPR
  disponible desde su botón, con 210 conceptos y 217 vínculos.
- Editor libre, creación de hijos conservando el padre seleccionado, posiciones
  por reloj, conexiones adaptables y selección de relaciones adyacentes.
- Compacto y Espiral como vistas de lectura del mismo grafo, con resultados
  reutilizables y diagnósticos explícitos.
- Texto de tamaño fijo, palabras completas, grosores por jerarquía, tres estilos
  de vínculo y franjas blancas proporcionales en cruces.
- Archivos `p1.graph.v1`, historial e IDs protegidos; exportaciones SVG y PNG 4K
  comprobadas contra el documento y el estado de cálculo.
- Documentación vigente consolidada y guía de mantenimiento. Historial,
  referencias de regresión y respaldo original conservados.
- Compilación limpia de `_site/`, exclusión de cachés de Python y retirada de
  restos de código sin uso. Se corrige el contador del registro de medición
  del ejemplo para informar el incremento total de intentos de ese cálculo.
- Etiqueta de versión creada por GitHub Actions después de comprobar y publicar
  el sitio, conservando intactas las etiquetas existentes.

El cierre no declara resueltos los diagnósticos normativos pendientes de
Compacto y Espiral. Véase [estado y límites de 1.0.0](docs/VERSION_1_0_0.md).

Los cambios anteriores y sus evidencias se conservan en
[los antecedentes](docs/README.md#antecedentes-previos-a-10).
