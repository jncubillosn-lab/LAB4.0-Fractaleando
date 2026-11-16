> **Archivo histórico · desarrollo cerrado el 16 de noviembre de 2026.**
> Este documento describe su fecha de corte. Las propuestas no incorporadas
> quedaron descartadas y sus pendientes no constituyen un plan de desarrollo.
> El estado final se describe en [Cierre de desarrollo](../CIERRE_DESARROLLO.md).

# Propuesta · Archivos compartidos en Drive

Documento histórico: la implementación de 1.3.0 se describe en
[Biblioteca pública en Drive](../BIBLIOTECA_DRIVE.md). Lo que sigue conserva el
estado y las decisiones de la evaluación preliminar del 15 de noviembre.

Estado: diseño preliminar, sin implementación ni despliegue.
Verificación documental: 15 de noviembre de 2026.

## Alcance recibido

Fractalear permanece en GitHub Pages. Los visitantes no crean cuentas ni inician
sesión. Guardar envía una copia nueva del JSON; cargar permite seleccionar un
trabajo de la colección compartida. Los visitantes pueden leer y subir, sin
eliminar ni sobrescribir. Se acepta que los trabajos sean accesibles entre
usuarios, el contenido libre y el posible abuso. No se propone moderación ni
perfiles para cambiar estas decisiones.

## Camino viable

Se propone una aplicación web de Google Apps Script que actúe con la cuenta
Google del responsable y una carpeta dedicada. La interfaz seguiría siendo
estática; la escritura necesita ese servicio remoto autorizado. No se precisa
una cuenta nueva para los visitantes, pero sí un responsable que autorice y
mantenga el servicio. Su disponibilidad anónima depende de la política de la
cuenta o del dominio. [Modo de ejecución de Apps Script](https://developers.google.com/apps-script/guides/web).

Una clave API permite ciertas lecturas públicas, pero no sustituye la
autorización necesaria para subir. Por ello no se debe colocar una credencial
de escritura del responsable en el código público. [Credenciales](https://developers.google.com/workspace/guides/create-credentials)
y [subida de archivos](https://developers.google.com/workspace/drive/api/guides/manage-uploads).

El servicio expondría solo tres operaciones: crear una copia nueva, listar
archivos de la carpeta y recuperar uno de ellos. La carpeta se fija en el
servicio; no la elige una petición del visitante. Recuperar un identificador
también debe comprobar su pertenencia a esa carpeta. No se exponen operaciones
de actualización, borrado o cambio de permisos, ni se concede a los visitantes
el rol de editor sobre la carpeta. El responsable de Drive conserva, por
naturaleza, sus permisos administrativos; la prohibición se aplica a la
herramienta y a sus visitantes.

Guardar usaría un identificador nuevo y conservaría cada copia. Cargar pasaría
el JSON por la validación actual antes de cambiar el documento. El navegador
mostraría el contenido como datos de Fractalear, sin ejecutar contenido del
archivo. Las descargas y aperturas locales seguirían disponibles.

La conexión desde Pages debe probarse con el despliegue real antes de prometer
un clic: son orígenes diferentes. Un puente de HTML Service con mensajes de
origen verificado es una alternativa a estudiar; `google.script.run` pertenece
a páginas servidas por Apps Script, no directamente a Pages. También hay que
probar cookies restringidas, acceso anónimo y políticas del dominio.
[Comunicación de HTML Service](https://developers.google.com/apps-script/guides/html/communication).

## Privacidad y capacidad

La aplicación puede evitar solicitar nombres, correos, identificadores de
visitante, analítica y seguimiento. No puede asegurar que el contenido libre
escrito por una persona no contenga datos personales, ni afirmar que Google o
GitHub carezcan de registros propios. No se añade información personal del
visitante al JSON como parte del diseño propuesto.

La gratuidad no equivale a capacidad ilimitada. Apps Script documenta **30
ejecuciones simultáneas por usuario**, **1.000 por script** y **6 minutos por
ejecución**. El modo de ejecución bajo una sola cuenta hace que las cuotas de
esa cuenta sean relevantes. Las cuotas pueden cambiar y superarlas interrumpe
la operación. [Cuotas de Apps Script](https://developers.google.com/apps-script/guides/services/quotas).

Una cuenta Google estándar dispone de hasta **15 GB compartidos entre Drive,
Gmail y Fotos**. Sin borrado ni sobrescritura el espacio ocupado crece con cada
copia. [Almacenamiento de Google](https://support.google.com/googleone/answer/9312312?hl=en).
La API de Drive también tiene cuotas por proyecto y por usuario, y condiciones
que Google está actualizando en 2026. No debe presupuestarse como un servicio
sin límites o con condiciones inmutables. [Límites vigentes de Drive](https://developers.google.com/workspace/drive/api/guides/limits).

Por tanto, el requisito de gratuidad y resistencia garantizada a cualquier pico
no puede darse por cumplido con Drive. Para evaluar un evento concreto faltan
la concurrencia prevista, el tamaño habitual de los JSON y el espacio disponible
en la cuenta responsable. Una prueba debe medir guardado, listado y recuperación
bajo ese volumen; errores de cuota deben dejar el trabajo intacto y permitir
conservarlo localmente. Listados paginados y reutilizados, y reintentos limitados
con espera creciente, pueden reducir presión sin prometer capacidad infinita.

## Próximo punto de decisión

Probar un servicio pequeño sobre una carpeta dedicada y la cuenta Google
responsable, confirmar acceso anónimo y medir el evento esperado. A partir de
esa evidencia se decide si cumple el volumen aceptable. Este documento no crea
la carpeta, habilita permisos ni añade botones aún sin un servicio operativo.
