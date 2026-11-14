# Entradas enfrentadas · 0.2.7

La creación en reloj distribuía bien los cuadros, pero la preferencia
heredada de 01 fijaba la llegada al hijo por la izquierda. La búsqueda
variaba principalmente la salida y aceptaba el primer recorrido válido,
aunque tuviera que rodear al hijo.

Para las conexiones nuevas se eligen ambos extremos conjuntamente:

- Se priorizan las caras que se miran según la posición de los cuadros.
- La reflexión cambia la cara y complementa la posición sobre ella:
  una salida a las 2 corresponde a una entrada a las 8.
- Si las caras enfrentadas comparten una coordenada libre, se prueba
  primero una recta para evitar dos pliegues artificiales.
- Se comparan los recorridos locales seguros antes de aceptar un rodeo.
  Se respetan puertos ocupados, cuadros, rutas y el presupuesto de búsqueda.
- Si la reflexión está obstruida, se conservan alternativas de búsqueda.

El cambio está localizado en la elección de puertos y recorrido para
conexiones nuevas o pendientes en 01. No cambia las posiciones, el reloj,
la selección, las vistas 02/04 ni el enrutamiento inicial de referencia.
Los recorridos válidos del punto de control siguen conservándose.

Las pruebas cubren las doce direcciones, la reflexión 2→8, puertos ocupados,
rectas en los cuatro puntos cardinales y auditoría de cada ruta. Chrome
crea doce hermanos en un mismo ciclo, comprueba entradas por las cuatro
caras, selección, posiciones existentes, guardado y deshacer.
Continúan los pendientes normativos anteriores de cruces frente a 01 y 2H.
