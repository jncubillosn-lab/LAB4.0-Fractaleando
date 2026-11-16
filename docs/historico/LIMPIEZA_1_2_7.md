> **Archivo histórico · desarrollo cerrado el 16 de noviembre de 2026.**
> Este documento describe su fecha de corte. Las propuestas no incorporadas
> quedaron descartadas y sus pendientes no constituyen un plan de desarrollo.
> El estado final se describe en [Cierre de desarrollo](../CIERRE_DESARROLLO.md).

# 1.2.7 · Limpieza de código heredado

Fecha: 15 de noviembre de 2026. Revisión de consumidores en aplicación,
Workers, pruebas y herramientas de mantenimiento antes de retirar código.

Se eliminan del coordinador las referencias sin uso al enrutador, dos alias de
consulta, un estado de puntero, una constante, una función de cámara nunca
invocada y una búsqueda DOM innecesaria. Los controles usan las funciones
actuales sin argumentos obsoletos.

La presentación SVG deja de recibir el enrutador; solo dibuja las rutas ya
calculadas. Las vistas derivadas dejan de recibir objetos de geometría que
sobrescribían inmediatamente con sus propias instancias.

Se retiran el trazado antiguo de saltos curvos y su auxiliar. El método de
trayectorias simples que necesita el comparador de distribuciones permanece.
Las tres vistas siguen utilizando las máscaras blancas proporcionales.
Se elimina además una alternativa de ordenación inalcanzable y dos estados
intermedios que nunca se leían.

El antiguo estado `rejected` de las vistas derivadas ya no recibía resultados.
Su rama de presentación se sustituye por el fallo real de la operación.
Antes, cambiar la profundidad tras un fallo podía sustituir el aviso por
«Calculando…» aunque no hubiera un cálculo en curso. Ahora el aviso persiste
hasta seleccionar otra vista o reintentar. El diagnóstico expone `error`.
La prueba de ciclo de vida verifica su persistencia y su limpieza al volver
al Editor.

Se conserva expresamente la medición histórica necesaria para recuperar
archivos anteriores, los esquemas JSON y el identificador interno `04`, los
Workers y métodos usados por pruebas y comparadores, y el respaldo original
inmutable. Antiguo no implica prescindible.

Las comprobaciones dirigidas cubren tipografía, cruces, restauración y fallos
de vistas, geometría y la firma exacta de las 217 rutas del ejemplo. La
integración exige también la batería completa y las cuatro suites Chrome.
