# Guía 6 — Modelo de datos
## Entidades
- productos: lo que se vende (aparece en CU-01, CU-02, CU-03).
- clientes: quién compra, cuando aplica (mencionado en la entrevista, Guía 2).
- usuarios: quién registra cada venta (actor principal de CU-01).
- ventas: cada transacción registrada (CU-01).
- detalle_venta: qué productos y cantidades incluyó cada venta (relación N:N).
## Atributos.
### productos
- id: identificador (clave primaria)
- nombre: texto
- precio: número decimal
- existencia: número entero
### clientes
- id: identificador (clave primaria)
- nombre: texto
- contacto: texto (opcional)
### usuarios
- id: identificador (clave primaria)
- nombre: texto
- rol: texto (vendedor / administrador)
### ventas
- id: identificador (clave primaria)
- fecha: fecha / hora
- id_usuario: clave foránea -> usuarios
- id_cliente: clave foránea -> clientes (opcional)
- total: número decimal
### detalle_venta
- id: identificador (clave primaria)
- id_venta: clave foránea -> ventas
- id_producto: clave foránea -> productos
- cantidad: número entero
- precio_unitario: número decimal
## Relaciones
- ventas.id_usuario -> usuarios.id (un usuario tiene muchas ventas)
- ventas.id_cliente -> clientes.id (un cliente tiene muchas ventas, opcional)
- detalle_venta.id_venta -> ventas.id (una venta tiene muchas líneas de detalle)
- detalle_venta.id_producto -> productos.id (un producto aparece en muchas líneas de
detalle)
