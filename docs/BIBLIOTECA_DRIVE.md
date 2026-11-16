# Biblioteca pública · Fractalear 1.3.0

Servicio autorizado por el propietario y desplegado el 16 de noviembre de 2026.
La conexión anónima fue comprobada con el candidato bajo el origen real de Pages;
su activación está incluida en 1.3.0. La publicación exige las pruebas completas.

Cuenta responsable: la cuenta propietaria indicada por el usuario.
Carpeta fija: `1Hktgc57dZubg_Gul5Y1x-eDxuIPJZQqj` («Fractalear LAB 4.0»,
confirmada mediante guardado y lectura reales del servicio autorizado).

Proyecto de mantenimiento: `1SaHrC5oXGieCgrEOwlRmiqf_j97XQgrOA9ugDbjNbDW1sJ4OfaLmbZ3k`.
Implementación autorizada: `AKfycbzV5DfSzq9C1QyUnYZ3RLsD9SD1gZtwKW_p6wENkZcIL4gabmoM2J375UshwIi4LGY7`.
La URL pública está en `js/data/LibraryConfig.js`; no contiene credenciales.

## Contrato conservado

Guardar JSON y Guardar en biblioteca usan la misma función de serialización:
`JSON.stringify(snapshot(), null, 2)`, después de consolidar la edición pendiente.
El servicio analiza el archivo para validarlo y guarda el texto recibido intacto.
No elimina campos, posiciones, rutas ni sangrías. El nombre es el único campo
que introduce el visitante. La carpeta no se recibe desde el navegador.

Cada guardado deliberado crea un archivo nuevo. Nombres iguales no sobrescriben.
Los reintentos conservan el identificador de la petición y recuperan la misma
copia. La API ofrece únicamente guardar, listar y leer. Comprueba pertenencia
a la carpeta antes de recuperar contenido de un identificador.

La biblioteca no hace llamadas a Google al abrir Fractalear. La consulta es
paginada y descarga solamente el archivo elegido. Se conserva la importación
local, su validación y la posibilidad de descargar el JSON actual.

## Preparar el servicio para Apps Script

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

## Activación y mantenimiento

1. Para futuras actualizaciones, generar el servicio, revisar el código y
   actualizar el proyecto de Apps Script con la cuenta propietaria.
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

Si el despliegue real impide leer la respuesta por restricciones entre dominios,
resolver el transporte antes de activar la interfaz. Nunca utilizar una respuesta
opaca como prueba de que el archivo se guardó.

## Verificación preparada

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
El [registro de verificación](evidencias/BIBLIOTECA_1_3_0.json) distingue la prueba
del candidato de la posterior verificación de la página publicada.
