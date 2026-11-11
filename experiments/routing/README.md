# Experimento de enrutamiento — aislado

Este experimento **no modifica la aplicación** ni habilita otro motor para los usuarios. Mantiene la geometría del ejemplo PPR, con 210 cuadros y 217 vínculos. Calcula rutas a través de \`PcbRouter\` y, por separado, a través de \`libavoid-js\` (\`OrthogonalRouting\`) y somete ambas salidas al mismo \`GeometryValidator\`.

La comparabilidad es parcial: ambos reciben las mismas posiciones de cuadros y los mismos puertos preasignados. Libavoid calcula todas las rutas como un problema conjunto y PcbRouter las resuelve secuencialmente. Se suman los segmentos de conexión del puerto a su punto de salida. No se ajustan puertos para favorecer a ninguno.

La salida registra conectividad, cruces, invalidez geométrica, longitud, puntos y tiempo. Una ruta inválida para R02–R04 **no** se considera mejora aunque sea más corta.

## Condiciones de posible adopción

1. Sin cambios en la interfaz ni en los datos conceptuales.
2. Cero invasiones de cuadros, puertos repetidos o segmentos compartidos.
3. Validación independiente antes de consolidar un nuevo punto de control.
4. Demostrar mejora en el caso de movimiento de rama que deja rutas pendientes.
5. Mantener las rutas no afectadas como punto de control; no aceptar un reordenamiento global por defecto.
6. Si la biblioteca no cumple, mantener el motor vigente y documentar por qué.

Licencia de la biblioteca de evaluación: LGPL-2.1-or-later. Se instala solo en CI, no se distribuye en la web pública. Véase https://github.com/Aksem/libavoid-js.
