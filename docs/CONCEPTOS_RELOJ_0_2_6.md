# Ajustes puntuales · 0.2.6

## «+ Concepto» en 01

El botón crea un hijo del concepto seleccionado y conserva esa selección.
No enfoca ni selecciona el texto del padre, ni lleva la cámara al hijo.
Así se pueden crear varios hermanos con pulsaciones sucesivas.

La posición usa el orden de hijos de ese padre: 12, 5, 10, 3, 8, 1, 6, 11,
4, 9, 2, 7, y vuelve a 12. Los hijos existentes cuentan en ese orden.
Si una dirección está ocupada, se busca más lejos sobre el mismo rayo,
respetando los cuadros y las rutas existentes. No redistribuye otros nodos.
Un hijo de J0 conserva la creación de un brazo con índice propio.

## Grosor y blanco de los cruces

01, 02 y 04 usan la escala acotada de 1,35 a 2,05 px por jerarquía.
La selección y el hover añaden 0,75 px al grosor de cada línea, de modo
que el énfasis conserva las diferencias entre niveles. Los transversales
mantienen su base de 1,35 px y el filtro no cambia la escala.

En 02/04, la máscara de la línea superior mide tres veces su grosor:
un grosor de blanco a cada lado, más el propio trazo. Usa también el grosor
real seleccionado y mantiene la conversión por zoom y la fase de guiones.
El halo sigue la forma del trazo, incluso junto a un giro de 45°.
01 conserva su representación de saltos y sus recorridos de referencia.

Las pruebas verifican el ciclo de doce direcciones, repetición del rayo
sin solapes, siete pulsaciones seguidas que crean hermanos, selección,
deshacer sin mover los nodos restantes y trazos proporcionales.
No se cambia el motor de distribución de 02/04 ni el grafo ilustrativo.
Siguen pendientes las diferencias de cruces respecto a 01 y la cota 2H.
