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
### productos
- id: identificador (clave primaria)
- nombre: texto
- precio: número decimal
- existencia: número entero

### clientes
- id: identificador (clave primaria)
- nombre: texto
- email: texto
- telefono: texto
- direccion: texto

### usuarios
- id: identificador (clave primaria)
- nombre: texto
- email: texto
- password: texto
- rol: texto

### ventas
- id: identificador (clave primaria)
- id_usuario: identificador (clave foránea a usuarios)
- id_cliente: identificador (clave foránea a clientes)
- fecha: fecha
- metodo_pago: texto
- total: número decimal
- estado: texto

### detalle_venta
- id: identificador (clave primaria)
- id_venta: identificador (clave foránea a ventas)
- id_producto: identificador (clave foránea a productos)
- cantidad: número entero
- precio_unitario: número decimal
- subtotal: número decimal