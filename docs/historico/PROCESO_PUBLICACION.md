> **Archivo histórico · desarrollo cerrado el 16 de noviembre de 2026.**
> Este documento describe su fecha de corte. Las propuestas no incorporadas
> quedaron descartadas y sus pendientes no constituyen un plan de desarrollo.
> El estado final se describe en [Cierre de desarrollo](../CIERRE_DESARROLLO.md).

# Tiempos de edición y publicación

Medición: 15 de noviembre de 2026, durante los ajustes de interfaz de 1.2.6.

Se revisaron los tiempos reales de las dos ejecuciones que publicaron 1.2.5:

| Fase | Tiempo de principio a fin | Fuente |
| --- | --- | --- |
| Validación de la propuesta | 88 s | [Ejecución 43769547053](https://github.com/jncubillosn-lab/LAB4.0-Fractaleando/actions/runs/43769547053) |
| Validación de main, Pages y etiqueta | 106 s | [Ejecución 43769751197](https://github.com/jncubillosn-lab/LAB4.0-Fractaleando/actions/runs/43769751197) |

En la propuesta, las pruebas Node tardaron 43 s y las de navegador 72 s.
En main, tardaron 65 s y 50 s respectivamente. Estos trabajos corren en paralelo:
sus tiempos no se suman dentro de una misma ejecución. El trabajo de despliegue
duró 13 s y el de etiqueta 8 s; el resto incluye preparación y coordinación.
Instalar las dependencias JavaScript tardó entre 0 y 2 s por trabajo.
La construcción aparece por debajo de un segundo en la resolución del registro.

La espera automática acumulada de ambas ejecuciones fue 194 s. No incluye la
edición, documentación, revisión visual, creación e integración de la propuesta
ni la demora hasta detectar que un trabajo terminó. Esa espera corresponde al
proceso de entrega y no al tiempo de carga de la aplicación.

La imagen de 1.2.6 se editó en 16 s. Las dos comprobaciones locales afectadas
(carrusel y construcción) ejecutaron sus pruebas en unos 0,35 s. No se repitió
localmente la batería completa antes de las dos ejecuciones completas de GitHub.

Para reducir trabajo repetido en cambios pequeños, se usan verificaciones
locales dirigidas y revisión visual, se prepara la propuesta lista para revisar
y se agrupan lecturas independientes. Se conservan las validaciones obligatorias
de la propuesta y de main. Documentar cada versión y mantener varias referencias
manuales también añade pasos; conviene automatizar esos metadatos en un cambio
dedicado.

La mejora de infraestructura con mayor potencial sería publicar un artefacto
ya validado, comprobando que corresponde exactamente al árbol integrado. Eso
podría evitar una de las dos baterías, pero requiere diseñar y probar el flujo
de permisos e identidad. No se modifica ese mecanismo durante este ajuste de UI.
