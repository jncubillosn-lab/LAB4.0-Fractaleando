# Instrucciones de consulta vigentes · Fractalear 1.3.5

La única documentación rectora es `README.md`, `docs/README.md`, `docs/CIERRE_DESARROLLO.md`, `docs/GUIA_USO.md`, `docs/MANTENIMIENTO.md` y `docs/BIBLIOTECA_DRIVE.md`, además del código y las pruebas presentes en `main`.

**No consultar ni recuperar por defecto** ramas `archivo/*`, historial de commits, versiones previas, documentos eliminados ni propuestas de motores y diseños descartados. Esos registros se conservan exclusivamente para una consulta retrospectiva solicitada expresamente, nunca como fuente de requisitos, objetivos, tareas o correcciones actuales.

El desarrollo se cerró en 1.3.5. No introducir nuevas funciones ni planes de ampliación; atender únicamente solicitudes nuevas explícitas y correcciones verificadas contra la entrega presente. Las alertas topológicas y geométricas no deben ocultarse ni declararse resueltas sin prueba.

Para cambios de mantenimiento: conservar documento, topología, importación/exportación, biblioteca y tres vistas; ejecutar `npm test`, suites de navegador y `npm run build`, y verificar publicación antes de concluir.

## ARCHIVO HISTÓRICO — NO CONSULTAR NI HEREDAR

**Etiqueta obligatoria:** `HISTÓRICO | NO CONSULTAR | NO VIGENTE`.

**Destino de nuevos registros históricos:** rama `archivo/no-consulta-2026-11-18`, carpeta `registros/no-consulta/AAAA-MM-DD/`. Conservar allí cada documento íntegro, identificado por fecha y ruta de procedencia. Los registros retirados anteriormente se recuperan en esa misma rama, en sus rutas originales.

**Protocolo de envío:** cuando una corrección, informe, explicación de fallos, plan descartado o registro de un proceso deje de ser vigente, primero copiar el documento completo a ese destino y comprobar que puede recuperarse; después retirarlo de la documentación de consulta de `main`, actualizando los enlaces. No archivar código operativo, pruebas de regresión, contratos o evidencia aún necesaria para decisiones vigentes. Nunca fusionar la rama de archivo con `main`.

**Prohibición de lectura por defecto:** no buscar, recorrer, indexar como contexto, citar ni aplicar documentos con esa etiqueta, ramas `archivo/*` o commits anteriores para desarrollar o corregir el proyecto. Solo consultarlos ante una petición explícita de investigación histórica. La información histórica nunca prevalece sobre el contrato, código, pruebas y documentación actuales de `main`.

Esta es una **política documental para colaboradores y agentes**, no un bloqueo de permisos de GitHub: los archivos pueden abrirse deliberadamente desde el historial público.
