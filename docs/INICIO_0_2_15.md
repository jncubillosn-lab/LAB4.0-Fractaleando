# 0.2.15 · Inicio con un solo núcleo

Fecha: 15 de noviembre de 2026. Base: 0.2.14.

Al abrir Fractalear aparece **01 Editor** con un único concepto J0, seleccionado
y listo para editar: **¿Qué quieres fractalear hoy?**. El botón **Nuevo** crea
ese mismo documento, sin conceptos J1 ni vínculos predefinidos. El ancho inicial
del núcleo es de 300 px; conserva letra fija, márgenes y ajuste de palabras.

El ejemplo completo de 210 conceptos y 217 vínculos permanece disponible en
**Ejemplo PPR**. Ya no se calcula como documento de entrada. No cambia su
contenido, distribución ni comportamiento en las tres vistas.

El cambio se limita a los datos de un documento nuevo, la selección del
documento de arranque y los mensajes de Nuevo. Se conserva la creación de hijos
desde el concepto seleccionado, la edición por doble clic, las vistas de
lectura, el historial, los archivos y las exportaciones.

Las suites de Chrome verifican el arranque con un solo núcleo, su edición,
creación de la primera rama, Nuevo desde una vista derivada y el acceso explícito
al ejemplo. Las regresiones que necesitan la antigua distribución de tres
ramas la cargan como archivo de prueba; no la reintroducen en Nuevo.
