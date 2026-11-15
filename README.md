# Fractalear 1.0

Una herramienta desarrollada por el LAB 4.0 de la Universidad Nacional para
construir conceptos, desarrollar sus jerarquías y representar sus relaciones.

**[Abrir Fractalear](https://jncubillosn-lab.github.io/LAB4.0-Fractaleando/?v=1.0.0)**

## Comenzar

La herramienta abre en **01 Editor** con un único núcleo seleccionado:
**¿Qué quieres fractalear hoy?**. Haz doble clic para editarlo y pulsa
**+ Concepto** para desarrollar sus hijos. **Nuevo** vuelve a ese lienzo;
**Ejemplo PPR** permite consultar el ejemplo completo.

Usa **02 Compacto** y **03 Espiral** para leer el mismo grafo en otras
distribuciones. **Guardar JSON** conserva el trabajo editable; SVG y PNG 4K
permiten compartir su representación.

## Documentación de 1.0.0

- [Guía de uso](docs/GUIA_USO.md).
- [Estado de la versión, decisiones y límites](docs/VERSION_1_0_0.md).
- [Mantenimiento, pruebas y publicación](docs/MANTENIMIENTO.md).
- [Registro de cambios](CHANGELOG.md).
- [Antecedentes y normas](docs/README.md).

El cierre funcional conserva los avisos normativos de Compacto y Espiral:
siguen existiendo casos con diferencias topológicas o separación superior a la
cota ensayada. Se documentan en el estado de la versión; 1.0.0 no los oculta.

## Desarrollo y comprobación

Con Node.js 22 y npm disponibles, como en GitHub Actions:

```sh
npm ci
npm test
npm run build
```

La construcción limpia y regenera únicamente `_site/`. GitHub Actions exige
las 96 pruebas Node y las cuatro suites de Chrome antes de publicar desde
`main`. Los documentos históricos, las pruebas y los respaldos no se incluyen
en el sitio generado. Las dependencias y sus licencias se describen en
[THIRD_PARTY.md](THIRD_PARTY.md).
