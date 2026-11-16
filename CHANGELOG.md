# Registro de cambios

## 1.3.3 — 16 de noviembre de 2026 · código explicado y ejemplo del programa

- Comentarios de funcionamiento y decisiones en 28 módulos: identidad,
  geometría, presentación, tareas, archivos y biblioteca.
- Nuevo ejemplo de Fractalear, construido con sus controles y exportado a JSON:
  63 conceptos, seis ramas, 64 vínculos y los tres estilos de conexión.
- Lectura del ejemplo bajo demanda, con el mismo contrato de los archivos;
  cancelación y protección frente a una edición más reciente.
- El PPR se conserva como fixture de regresión, sin debilitar las firmas
  históricas del dibujo ni de sus 217 rutas.

## 1.3.2 — 16 de noviembre de 2026 · cierre definitivo de desarrollo

- Se cierra el desarrollo por decisión del responsable. Toda propuesta no
  implementada queda descartada y no constituye una tarea pendiente.
- Documentación vigente separada del archivo histórico; enlaces internos,
  referencias de pruebas y estado real de la biblioteca corregidos.
- Se retiran el comparador experimental ELK, su dependencia y el auxiliar de
  trazado que solo usaba ese experimento. El Worker de prueba antiguo se aloja
  en fixtures y deja de publicarse como código de la aplicación.
- Se conservan el comportamiento, el formato JSON, las referencias geométricas,
  las pruebas de desarrollo, las licencias y el servicio existente de Drive.

## 1.3.1 — 16 de noviembre de 2026

- Guardado público en tres pasos: condiciones y exportación local alternativa,
  nombre y confirmación. Solo «Sí» en el tercer paso envía el archivo.
- «No», cierre y Escape conservan el diagrama sin enviarlo; los reintentos
  mantienen la misma solicitud para evitar copias accidentales.
- Aviso de acceso público, edición de copias, privacidad y solicitud de
  eliminación por correo. Sin enlace al repositorio en el aviso.
- Menú: Guardar, Biblioteca, Exportar JSON, Importar JSON, SVG y PNG.
  Cierre del resultado: «Chao, un abracito a la distancia».

## 1.3.0 — 16 de noviembre de 2026

- Añade un servicio limitado a una carpeta fija, con altas de archivos nuevos,
  listado paginado y apertura. El visitante introduce únicamente el nombre.
- Comparte la serialización y apertura actuales: conserva el JSON exacto.
- Comprueba permisos de carpeta en el servicio y evita duplicados por reintento.
- Activa el servicio autorizado por el propietario, comprobado anónimamente
  desde el origen de Pages: guardar, listar y leer con JSON idéntico.

## 1.2.7 — 15 de noviembre de 2026

- Retira funciones y estados sin consumidores, argumentos obsoletos y
  dependencias redundantes entre dibujo y enrutamiento.
- Elimina el antiguo trazado de cruces con saltos curvos y una rama de
  ordenación inalcanzable; conserva las máscaras blancas y los comparadores.
- Sustituye un estado de error abandonado: los fallos de vistas derivadas
  conservan su aviso tras cambiar la profundidad y se limpian al reintentar.
- Conserva la lectura de archivos antiguos y las referencias geométricas.

## 1.2.6 — 15 de noviembre de 2026

- Retira las tres barras verticales de la imagen de carga.
- Elige al azar la primera cita, conservando la navegación y las pausas.
- Reúne la cámara en cuatro símbolos y retira el botón duplicado de encuadre.
- Registra tiempos reales de validación y publicación para evaluar las esperas.

## 1.2.5 — 15 de noviembre de 2026

- Corrige la elección de imagen de 1.2.4 usando la propuesta que el usuario
  identifica en su captura: pixel art con colas negras y separadores verticales.
- Reutiliza el original, sin regenerarlo. PNG fijo de 768 × 224 píxeles,
  blanco y negro y 4.731 bytes; restaura la presentación de píxeles definidos.
- Conserva la tarjeta de carga y todas las funciones del grafo.

## 1.2.4 — 15 de noviembre de 2026

- Aplica la ilustración minimalista elegida: castor enredado en cables,
  consultando el manual, tomando café y organizando conexiones.
- Conserva una tira fija en blanco y negro de 768 × 224 píxeles, ahora de
  6.329 bytes, con texto alternativo actualizado y contornos suaves.
- Mantiene el motor y las funciones; documenta la procedencia de la imagen
  y conserva las comprobaciones de carga, temas y vistas.

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
  [interfaz 1.1.0](docs/historico/INTERFAZ_1_1_0.md).

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
Compacto y Espiral. Véase [estado y límites de 1.0.0](docs/historico/VERSION_1_0_0.md).

Los cambios anteriores y sus evidencias se conservan en
[los antecedentes](docs/historico/INDICE_Y_ALCANCE_INICIAL.md).
