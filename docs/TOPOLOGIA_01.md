# Registro topológico paralelo — P1 / 01 · Plano

**Objeto:** verificar que la estructura relativa del dibujo permanezca reconocible aunque cambien las distancias, tamaños o proporciones del plano.

Este registro es **independiente del punto de control geométrico**. El registro de geometría guarda coordenadas, rectángulos, puertos y polilíneas. El registro topológico guarda **identidades, precedencias y relaciones** de esos elementos. Uno no sustituye al otro.

## Relaciones que quedan fijadas

1. **Conceptos:** orden relativo izquierda/derecha y arriba/abajo, expresado por bandas ordenadas de identificadores; no guarda las coordenadas. Dos conceptos originalmente alineados en un eje no se fuerzan a permanecer exactamente alineados. Se considera orientación del lienzo fija: una reflexión o giro que invierta izquierda/derecha se detecta como cambio, aunque sea topológicamente posible en un sentido matemático más general.
2. **Puertos:** cada vínculo existente conserva su identidad `id:pN` por extremo y la cara utilizada del cuadro; cada cuadro conserva el orden horario de sus puertos. Los vínculos nuevos pueden intercalarse sin invertir el orden previo.
3. **Cruces:** se conserva el conjunto de pares de vínculos que se cruzan, la multiplicidad, cuál se dibuja por encima y el orden en el que cada ruta encuentra a las otras. La nueva relación puede crear cruces con conexiones nuevas, pero **no puede cambiar los cruces preexistentes** sin que el validador lo informe.
4. **Vecinos de carril:** cuando dos tramos ortogonales comparten un corredor y son vecinos, se registra si uno queda arriba/abajo (horizontal) o izquierda/derecha (vertical). No se almacena su distancia. Un par de vecinos que invierte el orden o deja de poder identificarse se reporta como una pérdida de relación. Las observaciones corresponden al enrutamiento ortogonal existente, no a algoritmos todavía no implementados.
5. **Pendientes:** una conexión que tenía ruta y después queda sin resolver no se interpreta como una relación conservada.

Las relaciones se asocian al **identificador estable del vínculo** derivado de sus extremos, no a los índices de las curvas SVG ni a las coordenadas de sus puntos.

## Funcionamiento

```text
Grafo conceptual
      │
      ├── Punto de control geométrico (coordenadas y rutas)
      │
      └── Registro topológico (órdenes y relaciones)
                   │
              Comparación
                   │
       ┌───────────┴───────────┐
       │                       │
    Coincide                Se altera
       │                       │
 Actualizar referencia    Mantener referencia anterior
                          y registrar discrepancias
```

El módulo `js/core/TopologyRegister.js` únicamente **captura y compara**. No modifica el motor, las rutas, los datos conceptuales ni la interfaz. Solo observa cuando cambia la geometría: aplicar filtros, seleccionar, desplazar la cámara y hacer zoom no reconstruyen el registro.

El registro usa `schema: "p1.topology.v1"` y se serializa en el campo **opcional** `topologyRegister` del JSON existente `p1.graph.v1`. Los JSON anteriores son compatibles: se genera una primera referencia desde la geometría validada. En una importación con registro, las relaciones guardadas se comparan con la geometría restaurada.

## Comportamiento cuando se incumple

- **La referencia anterior no se sobrescribe silenciosamente.**
- El diagnóstico `window.P1_PLANO_DIAGNOSTICO.topology()` informa `valid`, `issueCount`, categorías y ejemplos.
- El cuadro de avisos ya existente informa que se detectaron discrepancias.
- **Esta primera intervención es una capa de validación, no un bloqueo transaccional de movimientos o reenrutamientos.** No afirma haber garantizado que todas las operaciones respeten las relaciones: permite descubrir exactamente cuándo dejarían de hacerlo, sin deshacer cambios conceptuales existentes ni perder puntos de control por una política nueva no probada.
- Tampoco recalcula o «arregla» rutas por su cuenta: eso corresponde al enrutador y debe evaluarse por separado.

## Limitaciones explícitas

El concepto de «vecino» requiere compartir un corredor de trazos ortogonales; si las rutas toman corredores completamente diferentes, la relación puede resultar imposible de comprobar y se registra como pérdida, no se inventa una comparación. La firma de cruce distingue vínculos, cantidad y orden, no identifica individualmente cruces repetidos entre exactamente los mismos dos vínculos si esos cruces se permutan sin afectar a otros.

No se crea una vista nueva, un sistema de normas R09 ni funciones para las etapas 02–04. Este mecanismo es un requisito de validación del plano actual, subordinado a R01–R08.

## Comprobación

Ejecutar `npm test` para las pruebas de estabilidad bajo escalado, creación de vínculos, conservación del identificador de puertos, inversiones de orden y cambios de cruces. El E2E verifica la recuperación de la referencia y que los filtros no ejecuten cálculos de rutas.
