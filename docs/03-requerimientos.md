# Guía 3 – Análisis de requerimientos

## Requerimientos funcionales

- RF-01: El sistema debe permitir registrar una venta indicando productos y cantidades.
- RF-02: El sistema debe permitir consultar la existencia disponible de un producto.
- RF-03: El sistema debe permitir registrar nuevos productos con nombre, precio y existencia.
- RF-04: El sistema debe permitir consultar el total vendido en un periodo.
- RF-05: El sistema debe permitir a Don Ernesto ver un resumen de ventas desde el celular.
- RF-06: El sistema debe mostrar cuando un producto tiene existencia baja.
- RF-07: El sistema debe permitir buscar productos por nombre o código.
- RF-08: El sistema debe permitir generar e imprimir el comprobante de venta.

## Requerimientos no funcionales

RNF-01 (Usabilidad): cualquier vendedor debe poder registrar una venta sin capacitación extensa.
RNF-02 (Disponibilidad): el sistema debe funcionar en cualquier navegador moderno, sin instalar nada.
RNF-03 (Seguridad): solo Don Ernesto y sus empleados deben poder acceder.
RNF-04 (Compatibilidad): el sistema debe verse y funcionar bien tanto en computadora como en celular.


## Restricciones

- Debe construirse únicamente con HTML, CSS, JavaScript y Supabase.
- Debe usarse el plan gratuito de Supabase (sin presupuesto para servicios pagos).
- Debe funcionar en el navegador, sin instalar aplicaciones adicionales.


## Priorización (MoSCoW)

| Categoría | Requerimientos / Temas |
|---|---|
| Debe tener (Must) | RF-01, RF-02, RF-03, RF-04 |
| Debería tener (Should) | RF-05, RF-06 |
| Podría tener (Could) | |
| No ahora (Won't) | Manejo de ventas fiadas / a crédito |
