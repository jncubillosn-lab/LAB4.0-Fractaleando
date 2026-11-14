# Fractalear

Una herramienta desarrollada por el LAB 4.0 de la Universidad Nacional para
construir conceptos, desarrollar sus jerarquías y representar sus relaciones.

**[Abrir Fractalear en GitHub Pages](https://jncubillosn-lab.github.io/LAB4.0-Fractaleando/)**

## Documentación vigente

El punto de referencia funcional es **0.2.11**, documentado el **14 de noviembre
de 2026**, después de los ajustes de edición libre, estabilidad de la espiral y
palabras completas.

- [Estado, decisiones, arquitectura y validaciones del corte 0.2.11](docs/CORTE_0_2_11.md).
- [Guía de uso](docs/GUIA_USO.md).
- [Índice de antecedentes y normas](docs/README.md).

Las vistas disponibles son **01 Editor**, **02 Compacto** y **03 Espiral**.
Las dos últimas mantienen diagnósticos normativos pendientes: la aceptación
visual y las pruebas funcionales no equivalen a aprobar todas las normas.

## Desarrollo y comprobación

Con Node.js y npm disponibles:

```sh
npm ci
npm test
npm run build
```

La construcción genera el sitio estático en `_site/`. GitHub Actions comprueba
además las tres suites de navegador antes de publicar desde `main`.
Los archivos JSON guardados por la aplicación conservan el trabajo editable.
