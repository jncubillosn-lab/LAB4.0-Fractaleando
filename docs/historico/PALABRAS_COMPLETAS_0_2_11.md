> **Archivo histórico · desarrollo cerrado el 16 de noviembre de 2026.**
> Este documento describe su fecha de corte. Las propuestas no incorporadas
> quedaron descartadas y sus pendientes no constituyen un plan de desarrollo.
> El estado final se describe en [Cierre de desarrollo](../CIERRE_DESARROLLO.md).

# 0.2.11 — Palabras completas

El ancho solicitado del cuadro se amplía cuando la palabra más larga no cabe
con 14 px de margen a cada lado. La fuente permanece en 24 px; las frases
se reparten en renglones entre palabras y conservan 9 px de margen vertical.

La misma medición alimenta Editor, Compacto, Espiral y las exportaciones.
La edición recalcula el tamaño cuando cambia el ancho o la altura del texto.
Los archivos de 0.2.8–0.2.10 se validan con sus dimensiones anteriores antes
de ampliar localmente los cuadros, conservando las posiciones cuando hay espacio.

Se comprueba con «Especialización» e «Intrascendencia», el ejemplo completo
y un archivo exportado desde la versión publicada 0.2.10 cuyo núcleo fue movido.
Se conservan los archivos de espiral, escena derivada y trazado recuperados de 0.2.8.
La colocación junto al núcleo usa el mismo margen rectangular que su auditoría;
la reducción de distancia queda limitada por ese margen físico en diagonales.
