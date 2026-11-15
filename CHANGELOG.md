# Registro de cambios

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
