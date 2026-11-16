# Biblioteca pública · Fractalear 1.3.5

Servicio autorizado por el propietario y desplegado el 16 de noviembre de 2026.
La biblioteca está publicada desde 1.3.0. En 1.3.1 se verificó el consentimiento
y el ciclo real de guardado, listado y apertura en Pages, sin sesión de Google.
El cierre 1.3.5 conserva ese servicio y el formato JSON.

Cuenta responsable: la cuenta propietaria indicada por el usuario.
Carpeta fija: `1Hktgc57dZubg_Gul5Y1x-eDxuIPJZQqj` («Fractalear LAB 4.0»,
confirmada mediante guardado y lectura reales del servicio autorizado).

Proyecto de mantenimiento: `1SaHrC5oXGieCgrEOwlRmiqf_j97XQgrOA9ugDbjNbDW1sJ4OfaLmbZ3k`.
Implementación autorizada: `AKfycbzV5DfSzq9C1QyUnYZ3RLsD9SD1gZtwKW_p6wENkZcIL4gabmoM2J375UshwIi4LGY7`.
La URL pública está en `js/data/LibraryConfig.js`; no contiene credenciales.

## Contrato conservado

Exportar JSON y Guardar en biblioteca usan la misma función de serialización:
`JSON.stringify(snapshot(), null, 2)`, después de consolidar la edición pendiente.
El servicio analiza el archivo para validarlo y guarda el texto recibido intacto.
No elimina campos, posiciones, rutas ni sangrías. El nombre es el único campo
que introduce el visitante. Antes de escribirlo se presentan las condiciones
de publicación y la alternativa de exportar localmente; después se muestra
una confirmación explícita. Solo el botón «Sí» del tercer paso llama al servicio.
Avanzar, elegir «No», cerrar, pulsar Escape o exportar no envía el diagrama.
El cierre tras un resultado dice «Chao, un abracito a la distancia».
El aviso incluye el correo para solicitar una eliminación y distingue el
procesamiento local de las consultas a la biblioteca. No incluye enlaces al
repositorio ni al alojamiento. La carpeta no se recibe desde el navegador.

Cada guardado deliberado crea un archivo nuevo. Nombres iguales no sobrescriben.
Los reintentos conservan el identificador de la petición y recuperan la misma
copia. La API ofrece únicamente guardar, listar y leer. Comprueba pertenencia
a la carpeta antes de recuperar contenido de un identificador.

La biblioteca no hace llamadas a Google al abrir Fractalear. La consulta es
paginada y descarga solamente el archivo elegido. Se conserva la importación
local, su validación y la posibilidad de descargar el JSON actual.

## Reproducir el servicio entregado de Apps Script

Ejecutar `npm run build:drive`. Produce dos archivos en
`artifacts/drive-service`: `Code.gs` y `appsscript.json`. El primero incorpora
el mismo validador que la aplicación; no hay otra definición del formato.
Este directorio y el servidor `cloud/` no forman parte del sitio en Pages.

En un proyecto de Apps Script de la cuenta responsable, colocar esos dos
archivos. El manifiesto habilita Drive API v3 y configura la aplicación web
para ejecutarse como quien despliega y admitir visitantes anónimos.

Google solicita al propietario el permiso de Drive al autorizar este servicio.
Ese permiso de Google es amplio; la restricción a la carpeta indicada se aplica
en el código del servicio. El visitante no recibe esa autorización ni un token,
y nunca se incluye una credencial en Pages.

La carpeta puede conservar su acceso restringido. El servicio publica sus
diagramas mediante sus operaciones limitadas, sin conceder permisos de editor
de Drive a los visitantes.

## Operación del servicio existente

1. El código reproducible del servicio pertenece a esta entrega. Generarlo no
   modifica ni vuelve a publicar la implementación existente de Google.
2. Mantener la implementación existente, ejecutada como propietario y con acceso
   «Cualquiera»; si cambia la URL, actualizar la configuración de Pages.
3. Probar desde Pages, sin sesión Google, guardar, listar y leer. Las peticiones
   son POST simples de texto, con respuesta JSON y confirmación obligatoria.
   La conexión entre dominios y las redirecciones se comprobaron sobre el
   despliegue real. La prueba simulada sirve de regresión, no sustituye esa prueba.
4. Confirmar que el archivo descargado coincide exactamente con el original,
   que repetir nombre crea otra copia y que no hay acceso a archivos ajenos.
5. Publicar la aplicación únicamente después de verificar la configuración.
   Una URL vacía mantiene ocultos los controles de nube.

El cliente exige una respuesta JSON legible para confirmar el guardado. Una
respuesta opaca o un error de red no se presentan como un guardado confirmado.

## Verificación de la entrega

- `tests/public-library.test.js`: texto exacto, reintentos, nombres repetidos,
  solicitudes prohibidas, validación, aislamiento de carpeta y cliente sin carga
  remota inicial. Incluye el lector y serializador compartidos con los archivos
  locales.
- `tests/library_e2e.py`: interfaz real frente a servicio simulado; una entrada
  de nombre, ninguna selección de archivo o carpeta, guardado idéntico a la
  descarga local y apertura desde catálogo con el lector actual.

La comprobación real creó `Comprobación de conexión de Fractalear.json`, confirmó
su presencia en el catálogo y recuperó exactamente los 744 bytes originales.
El navegador no inició sesión en Google ni recibió credenciales. Se conserva
el archivo de comprobación como una copia más de la biblioteca.
El [registro inicial](evidencias/BIBLIOTECA_1_3_0.json) conserva la prueba del
candidato. La [verificación publicada de 1.3.1](evidencias/BIBLIOTECA_1_3_1.json)
confirma el envío solo tras Sí, exportación local sin llamadas, guardado y
apertura reales, JSON idéntico de 749 bytes y ausencia de errores.

## Solicitudes de retirada

El aviso remite a **jeducubillosn@gmail.com** e indica aportar el nombre y la
fecha aproximada. Solo el propietario administra los archivos desde su Drive;
el servicio no ofrece borrado, modificación ni cambios de permisos. Una
retirada no permite recuperar copias descargadas por otras personas.
