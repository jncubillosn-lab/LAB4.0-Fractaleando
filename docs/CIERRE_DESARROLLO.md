# Cierre de desarrollo · Fractalear 1.3.5

Fecha: **16 de noviembre de 2026**. El responsable da por terminado el desarrollo
y descarta toda ruta futura que no forme parte de esta entrega. No hay funciones
planificadas, etapas abiertas ni una lista de trabajo pendiente. El archivo
histórico conserva trazabilidad y no autoriza continuar sus propuestas.

## Documentación en código y ejemplo del programa

Por solicitud posterior del responsable, la entrega 1.3.3 añade comentarios de
funcionamiento en 28 módulos y sustituye el ejemplo público por un fractal del
programa. Se creó con los controles reales del Editor y se exportó como JSON;
contiene 63 conceptos, 64 vínculos y los tres estilos de conexión. Se recorrieron
las tres vistas sin rutas pendientes ni inválidas. Sus avisos topológicos y de
distancia siguen visibles; el ejemplo no se presenta como una validación total.

El nuevo archivo se lee al pulsar Ejemplo y conserva la disposición creada.
El PPR anterior pasa a ser únicamente un dato de regresión en las pruebas.
Las ampliaciones descartadas del archivo histórico siguen descartadas. La
[procedencia del ejemplo](evidencias/EJEMPLO_PROGRAMA_1_3_3.json) registra sus
bytes, estilos y resultados observados en la herramienta.
Los comentarios del servidor explican las mismas reglas ya desplegadas; no
requieren cambiar permisos ni volver a publicar el servicio de Google.

La entrega 1.3.4 amplía ese mismo ejemplo a **200 conceptos y 201 vínculos**,
incluyendo código, integraciones, interfaz y publicación. Conserva las seis
ramas y las relaciones transversales originales. Se preparó a partir de la
exportación del Editor, se completó el contenido en el mismo contrato JSON y
se volvió a abrir en Fractalear para que la aplicación calculase y exportase
su geometría completa. No se cambian los algoritmos ni el servicio de Google.
La [evidencia de la ampliación](evidencias/EJEMPLO_PROGRAMA_1_3_4.json) registra
la revisión de las tres vistas sin presentar los avisos normativos como aprobados.

La entrega 1.3.5 añade, por solicitud expresa, **100 conceptos dedicados a
funciones y métodos existentes**, con nombre y explicación. El ejemplo llega
a 300 conceptos y 301 vínculos. Se conservan las seis ramas y todo el contenido
anterior; las nuevas referencias cubren 30 módulos de datos, geometría,
presentación, tareas, archivos y biblioteca. El [catálogo](evidencias/FUNCIONES_EJEMPLO_1_3_5.json)
identifica sus definiciones y se comprueba en las pruebas de desarrollo.
La [evidencia del ejemplo](evidencias/EJEMPLO_PROGRAMA_1_3_5.json) registra el
documento exportado y sus vistas. La ampliación explica funciones presentes;
no cambia el comportamiento de la aplicación ni recupera desarrollos descartados.

## Alcance entregado

- Editor con un solo núcleo inicial, conceptos y vínculos, posición libre,
  selección, jerarquías, estilos de conexión e historial.
- Lectura del mismo grafo en Compacto y Espiral, profundidad completa inicial,
  encuadre y conservación de las comprobaciones geométricas y topológicas.
- Texto de tamaño fijo con palabras completas, grosores por jerarquía y cruces
  con franjas blancas proporcionales.
- Importación y exportación del documento `p1.graph.v1`, SVG y PNG de 4096
  píxeles en el lado mayor. El identificador interno `04` permanece por
  compatibilidad con los documentos existentes.
- Biblioteca pública opcional en Drive. El visitante escribe solo el nombre;
  únicamente **Sí** en el tercer paso envía el JSON. No hay borrado ni
  sobrescritura para visitantes. La alternativa local conserva el archivo.
- Carga con viñetas fijas del castor, diecisiete citas con inicio aleatorio,
  modos claro y oscuro y cuatro controles de cámara.

La [guía de uso](GUIA_USO.md) describe la operación. Las instrucciones de la
[biblioteca](BIBLIOTECA_DRIVE.md) y de [reproducción](MANTENIMIENTO.md) permiten
operar y conservar la entrega existente; no constituyen un plan de ampliación.

## Limpieza de entrega

Los documentos anteriores se reúnen en `docs/historico/` con un aviso explícito
de cierre. Se corrigen los enlaces internos y las referencias de versión, pruebas
y suites de la documentación vigente. Los borradores experimentales de GitHub
6, 10, 11 y 12 quedan cerrados sin integrar. El flujo de comprobación conserva
las propuestas a `main` y las publicaciones de `main`; se retira el disparador
de la antigua rama de desarrollo.

Se retira el comparador experimental de motores ELK, su comando y su dependencia
de desarrollo. El motor de la aplicación sigue utilizando libavoid. El auxiliar
de trayectorias que solo consumía ese experimento se elimina. El Worker antiguo
de distribución, utilizado únicamente por una prueba, pasa a sus fixtures y
deja de distribuirse como código de la aplicación. Se retiran también las reglas
de estilo de controles de interfaz que ya no existen.

Se conservan las comprobaciones de desarrollo, las referencias de regresión,
los datos de prueba, las licencias y el HTML original inmutable. Las herramientas
de rendimiento y verificación que prueban la entrega actual siguen disponibles
en desarrollo y no se cargan al usar Fractalear. El JSON y el servicio desplegado
de Drive no cambian en este cierre.

## Límites de la entrega

Compacto y Espiral conservan los avisos de revisión cuando detectan diferencias
topológicas o separaciones superiores a la cota ensayada. Una operación puede
agotar sus intentos y dejar una ruta pendiente; los datos conceptuales se
conservan y se informa el resultado. El texto del PNG depende de la escala
necesaria para encajar el grafo completo.

La disponibilidad de GitHub Pages, Google Drive y las fuentes enlazadas de
los poemas depende de sus proveedores. La biblioteca es pública; retirar un
archivo no elimina copias ya descargadas. Para solicitar su retirada, escribir
a **jeducubillosn@gmail.com**. Esos límites no se presentan como solucionados
por cerrar el desarrollo ni se convierten en tareas futuras.

## Comprobación y referencia final

La publicación exige las **111 pruebas Node y las cinco suites de Chrome**.
Incluyen las firmas congeladas de las 217 rutas y del dibujo del caso histórico PPR,
la identidad de archivos, la geometría, los Workers, las exportaciones y el
consentimiento del guardado público. La etiqueta `v1.3.5` se crea desde la
comprobación de la publicación, sin sustituir etiquetas anteriores.

La prueba real de la biblioteca en 1.3.1 guardó y recuperó exactamente **749
bytes** sin sesión de Google y confirmó que solo Sí envía el diagrama. Su
[registro](evidencias/BIBLIOTECA_1_3_1.json) queda incorporado a la entrega.
Los experimentos de motores alternativos y el modelo biológico W–D–T completo
quedan descartados; no se recuperan en la versión final.
