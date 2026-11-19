# Fractalear 1.3.5

Una herramienta desarrollada por el LAB 4.0 de la Universidad Nacional para
construir conceptos, desarrollar sus jerarquías y representar sus relaciones.

**[Abrir Fractalear](https://jncubillosn-lab.github.io/LAB4.0-Fractaleando/?v=1.3.5)**

**Desarrollo cerrado el 16 de noviembre de 2026 por decisión del responsable.**
La versión entregada constituye el alcance final. Las propuestas no implementadas
quedan descartadas y no deben recuperarse como obligaciones del proyecto.

## Usar la herramienta

La página abre en **01 Editor** con un único núcleo: **¿Qué quieres fractalear
hoy?**. Haz doble clic para editarlo y pulsa **+ Concepto** para desarrollar
sus hijos. **Nuevo** vuelve al lienzo inicial y **Ejemplo** abre un fractal del propio programa: 300 conceptos y 301 vínculos
creados con la herramienta para explicar construcción, lectura, cálculo, archivos,
legibilidad y comprobaciones. Sus desarrollos incluyen módulos de código,
Workers, cachés, puertos, transporte de la biblioteca, navegación y publicación.
Los últimos 100 cuadros explican funciones reales de 30 módulos: cada uno incluye
su nombre, una firma descriptiva abreviada y su responsabilidad.
**02 Compacto** y **03 Espiral** presentan el mismo grafo en otras distribuciones.

**Guardar** ofrece las condiciones de la biblioteca pública, el nombre y una
confirmación final. Solo **Sí** en el tercer paso envía el diagrama. **Biblioteca**
permite abrir una copia compartida, sin iniciar sesión. Para conservar el trabajo
en privado, usa **Exportar JSON** y **Importar JSON**. **SVG** y **PNG** exportan
la representación; el PNG mantiene 4096 píxeles en su lado mayor.

El funcionamiento también se explica mediante comentarios en los módulos: el
recorrido comienza en [app.js](js/app.js) y cada capa documenta su responsabilidad
y las decisiones que protegen el documento. El ejemplo utiliza el mismo
[JSON exportable](js/data/examples/fractalear.json) que los trabajos del usuario.

## Documentación de entrega

- [Cierre de desarrollo, alcance y límites](docs/CIERRE_DESARROLLO.md).
- [Guía de uso](docs/GUIA_USO.md).
- [Biblioteca pública y operación de Drive](docs/BIBLIOTECA_DRIVE.md).
- [Reproducción, pruebas y publicación de la entrega](docs/MANTENIMIENTO.md).
- [Dependencias y licencias](THIRD_PARTY.md).

## Reproducir la entrega

Con Node.js 22 y npm:

```sh
npm ci
npm test
npm run build
```

GitHub Actions exige las **111 pruebas Node y las cinco suites de Chrome** antes
de publicar desde `main`. Las pruebas se ejecutan durante la preparación de la
entrega; no forman parte de la ejecución del sitio. La construcción regenera
solo `_site/`, con los recursos de la aplicación, sus fuentes y WASM locales.
Documentos, experimentos, respaldos, pruebas y herramientas de desarrollo quedan
fuera del sitio publicado.

Los avisos de revisión y las rutas que el motor no resuelva conservan su
comportamiento. Cerrar el desarrollo no equivale a certificar una solución
geométrica para cualquier grafo; los límites se registran en el cierre.
