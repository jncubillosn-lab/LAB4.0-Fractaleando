# Biblioteca pública · integración preparada

Estado: preparada para pruebas, pendiente de autorización y despliegue real.

Cuenta responsable: la cuenta propietaria indicada por el usuario.
Carpeta fija: `1Hktgc57dZubg_Gul5Y1x-eDxuIPJZQqj` («Fractalear LAB 4.0»,
según la captura del propietario; el conector institucional aún no tiene acceso).

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

## Activación y cierre pendientes

1. El propietario revisa el código generado y autoriza el proyecto en Google.
2. Se despliega como aplicación web y se obtiene su URL terminada en `/exec`.
3. Desde Pages, sin sesión Google, probar guardar, listar y leer. Las peticiones
   son POST simples de texto, con respuesta JSON y confirmación obligatoria.
   La conexión entre dominios y las redirecciones de Google deben probarse sobre
   ese despliegue real; la prueba simulada no las demuestra.
4. Confirmar que el archivo descargado coincide exactamente con el original,
   que repetir nombre crea otra copia y que no hay acceso a archivos ajenos.
5. Solo después configurar `js/data/LibraryConfig.js`, subir la versión de la
   aplicación y publicar. Con URL vacía, los botones de nube permanecen ocultos.

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

La integración no se considera publicada ni operativa hasta completar las
pruebas anónimas del servicio de Google y verificar la URL pública de Fractalear.
