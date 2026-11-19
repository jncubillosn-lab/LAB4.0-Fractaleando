# Instrucciones de consulta vigentes · Fractalear 1.3.5

La única documentación rectora es `README.md`, `docs/README.md`, `docs/CIERRE_DESARROLLO.md`, `docs/GUIA_USO.md`, `docs/MANTENIMIENTO.md` y `docs/BIBLIOTECA_DRIVE.md`, además del código y las pruebas presentes en `main`.

**No consultar ni recuperar por defecto** ramas `archivo/*`, historial de commits, versiones previas, documentos eliminados ni propuestas de motores y diseños descartados. Esos registros se conservan exclusivamente para una consulta retrospectiva solicitada expresamente, nunca como fuente de requisitos, objetivos, tareas o correcciones actuales.

El desarrollo se cerró en 1.3.5. No introducir nuevas funciones ni planes de ampliación; atender únicamente solicitudes nuevas explícitas y correcciones verificadas contra la entrega presente. Las alertas topológicas y geométricas no deben ocultarse ni declararse resueltas sin prueba.

Para cambios de mantenimiento: conservar documento, topología, importación/exportación, biblioteca y tres vistas; ejecutar `npm test`, suites de navegador y `npm run build`, y verificar publicación antes de concluir.
