# Reproducción y operación de Fractalear 1.3.5

[Estado final](CIERRE_DESARROLLO.md) · [Guía de uso](GUIA_USO.md) ·
[Registro de cambios](../CHANGELOG.md).

El desarrollo está cerrado. Estas instrucciones reproducen la entrega existente
y documentan su operación, sin abrir una ruta de ampliaciones.

## Preparar y ejecutar

El flujo de publicación utiliza Node.js 22, npm, Python 3.12, Playwright 1.56.0
y Chrome. Las dependencias JavaScript están fijadas en `package-lock.json`.

```sh
npm ci
npm test
npm run build
python -m http.server 8000 --directory _site
```

Abrir `http://localhost:8000`. El sitio debe servirse por HTTP para cargar
módulos y Workers. El motor utiliza la versión de libavoid fijada en el archivo
de dependencias. El experimento de ELK quedó retirado del cierre.

La construcción elimina únicamente el resultado generado `_site/`, después de
leer las entradas necesarias. No debe usarse esa carpeta para guardar trabajos,
documentos o fuentes. `node_modules/`, `_site/`, `artifacts/` y cachés de Python
son resultados locales excluidos del repositorio.

## Comprobar la entrega

`npm test` ejecuta las 111 pruebas Node en secuencia. También construye el sitio,
verifica imports y versiones de caché y comprueba que no se publique un archivo
residual de la construcción anterior.

Las cinco suites Chrome se ejecutan sobre `_site` en
[GitHub Actions](../.github/workflows/tests.yml):

| Suite | Cobertura |
| --- | --- |
| `tests/pages_e2e.py` | Inicio, Nuevo, caso PPR de regresión, creación, vínculos, estilos, archivos y exportación. |
| `tests/views_e2e.py` | Las tres vistas del caso histórico y del nuevo ejemplo, fuente, márgenes, cruces, selección, WASM local y exportaciones. |
| `tests/topology_guard_e2e.py` | Edición libre en 01, protección en lectura, importación, cancelación y alternativa al Worker. |
| `tests/library_e2e.py` | Solo Sí en el tercer paso envía; exportar, No y Escape no envían; reintento con la misma solicitud, JSON idéntico y apertura desde catálogo. |
| `tests/integrity_e2e.py` | Exportación durante carga, importar/deshacer/crear, geometría pendiente, duplicados e IDs especiales. |

Para ejecutarlas localmente se necesita Chrome y Playwright 1.56.0. Establecer
`P1_SITE_ROOT` en `_site` y ejecutar cada archivo con Python, como en el flujo.
Los resultados del navegador se conservan como artefactos de Actions.

Para revisar las diecisiete fuentes del carrusel, ejecutar manualmente con acceso a red:

```sh
npm run check:poetry-links
```

El resultado incluye fecha, estado HTTP, URL final y presencia del fragmento en
el texto de cada página. Termina con error si alguna fuente no abre o no contiene
la cita. Una página con HTTP 200 pero vacía o con un bloqueo tampoco se acepta.
El control no forma parte del arranque, de `npm test` ni del despliegue: los sitios
externos pueden tener caídas temporales. Revisar las fuentes fallidas antes de
sustituir un enlace y actualizar también la tabla documental del carrusel.

El ejemplo público está en `js/data/examples/fractalear.json` y se abre por el
lector compartido de archivos. El caso PPR de 210 conceptos permanece como
`tests/fixtures/ppr-document.json`: las pruebas lo importan desde archivo y
conservan sus firmas de regresión. No es un segundo ejemplo oculto del producto.
`tests/program-example.test.js` cubre el contenido, su lectura diferida y la
cancelación o sustitución de una descarga pendiente.

## Límites entre módulos

Mantener modelo e identidad en `core/`, cálculos numéricos en `geometry/`,
validación de archivos en `io/` y presentación/descargas en `ui/`.
`app.js` coordina los eventos; los Workers reciben datos, no elementos del DOM.
El registro topológico describe y comprueba relaciones; no debe fijar las
posiciones o caras del Editor como condición de edición.

`ui/LoadingIndicator` asigna a cada operación su propio cierre de carga. La
cancelación o respuesta tardía de una operación no puede ocultar otra.
`ui/PoetryCarousel` controla exclusivamente el espacio de lectura de citas;
sus datos y fuentes viven en `data/PoetryQuotes`. No consulta el grafo ni carga
contenido remoto durante el uso.

Los índices de documento se crean sobre los datos actuales. Si una operación
muta nodos o padres, no debe dejar una caché de jerarquía obsoleta. Para registros
indexados por IDs de usuario se usan Map o propiedades propias seguras.

Conservar el esquema `p1.graph.v1`, el modo interno `04` y las referencias
congeladas de regresión salvo una migración deliberada. `SCENE_VERSION` identifica
el algoritmo geométrico, no la versión comercial: no se cambia al subir el
número de aplicación si el algoritmo sigue siendo el mismo.

Las firmas de dibujo y rutas no se actualizan para silenciar una regresión.
Un cambio numérico necesita una comparación explícita y revisión de su efecto
en las tres vistas. Las optimizaciones deben mantener los criterios de aceptación.

## Reproducir la publicación cerrada

El corte final es `v1.3.5`. Paquete, metadatos, interfaz, documentación y nombre
del artefacto de CI identifican esa misma entrega. Las firmas del algoritmo
geométrico conservan sus versiones de compatibilidad.

El flujo de GitHub Actions comprueba Node y las cinco suites Chrome. El trabajo
de Pages depende de ambas comprobaciones y publica solo `_site/`. Después,
`tag-release` fija la etiqueta del commit publicado y conserva intacta cualquier
etiqueta anterior. Reproducir la entrega no requiere diseñar otro flujo ni
recuperar experimentos descartados.

Conservar `P1_Plano_R01_brazos_variables.html` como respaldo original: su
inmutabilidad está comprobada por una prueba. Las muestras y la herramienta de
rendimiento conservadas verifican la entrega actual y no se publican en Pages.
