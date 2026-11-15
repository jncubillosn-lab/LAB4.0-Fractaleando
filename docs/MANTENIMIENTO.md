# Mantenimiento de Fractalear 1.1

[Estado vigente](VERSION_1_0_0.md) · [Guía de uso](GUIA_USO.md) ·
[Registro de cambios](../CHANGELOG.md).

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
módulos y Workers. No es necesario instalar ELK o libavoid globalmente.
`elkjs` se conserva como dependencia de desarrollo para el comparador de
distribuciones; el motor del sitio utiliza libavoid.

La construcción elimina únicamente el resultado generado `_site/`, después de
leer las entradas necesarias. No debe usarse esa carpeta para guardar trabajos,
documentos o fuentes. `node_modules/`, `_site/`, `artifacts/` y cachés de Python
son resultados locales excluidos del repositorio.

## Comprobar cambios

`npm test` ejecuta las 100 pruebas Node en secuencia. También construye el sitio,
verifica imports y versiones de caché y comprueba que no se publique un archivo
residual de la construcción anterior.

Las cuatro suites Chrome se ejecutan sobre `_site` en
[GitHub Actions](../.github/workflows/tests.yml):

| Suite | Cobertura |
| --- | --- |
| `tests/pages_e2e.py` | Inicio, Nuevo, ejemplo PPR, creación, vínculos, estilos, archivos y exportación. |
| `tests/views_e2e.py` | Las tres vistas, fuente, márgenes, cruces, selección, WASM local y exportaciones. |
| `tests/topology_guard_e2e.py` | Edición libre en 01, protección en lectura, importación, cancelación y alternativa al Worker. |
| `tests/integrity_e2e.py` | Exportación durante carga, importar/deshacer/crear, geometría pendiente, duplicados e IDs especiales. |

Para ejecutarlas localmente se necesita Chrome y Playwright 1.56.0. Establecer
`P1_SITE_ROOT` en `_site` y ejecutar cada archivo con Python, como en el flujo.
Los resultados del navegador se conservan como artefactos de Actions.

Para revisar las diez fuentes del carrusel, ejecutar manualmente con acceso a red:

```sh
npm run check:poetry-links
```

El resultado incluye fecha, estado HTTP, URL final y presencia del fragmento en
el texto de cada página. Termina con error si alguna fuente no abre o no contiene
la cita. Una página con HTTP 200 pero vacía o con un bloqueo tampoco se acepta.
El control no forma parte del arranque, de `npm test` ni del despliegue: los sitios
externos pueden tener caídas temporales. Revisar las fuentes fallidas antes de
sustituir un enlace y actualizar también la tabla documental del carrusel.

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

## Publicar y cerrar una versión

1. Actualizar `package.json`, la versión raíz de `package-lock.json`, metadatos y
   pie de `index.html`, referencias de aceptación y nombre del artefacto de CI.
2. Actualizar `CHANGELOG.md`, estado de la versión, guía e índice documental.
   No reescribir como actuales las afirmaciones de documentos históricos.
3. Revisar el cambio y exigir Node y las cuatro suites Chrome antes de integrar.
4. Integrar en `main`. El trabajo de Pages depende de ambas comprobaciones;
   construye solo el sitio estático y publica `_site/`.
5. Tras publicar Pages, el trabajo `tag-release` crea `vX.Y.Z` a partir de la
   versión de `package.json`, sobre el commit que pasó las comprobaciones.
   Si la etiqueta ya existe, la conserva. Verificar la versión de la URL pública
   y que la etiqueta remota señale el corte publicado.

Conservar `P1_Plano_R01_brazos_variables.html` como respaldo original: su
inmutabilidad está comprobada por una prueba. Las muestras y scripts de
comparación siguen siendo material de mantenimiento, no residuos para eliminar.
