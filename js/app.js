// ===== CONFIGURACIÓN =====
// Los números de WhatsApp están en index.html, dentro del desplegable "Enviar a" del carrito.

// Categorías de la tienda, en el orden en que aparecen los botones.
// Deben escribirse igual que en la columna "categoria" de los productos en Supabase.
const CATEGORIAS = [
  "Pura Patita",
  "Ropa y Accesorios Mujer",
  "Ropa Deportiva H y M",
  "Hogar y Jardín",
  "Electrodomésticos",
  "Frazadas y Pijamas H y M",
  "Fruta Fresca y Jugosa",
];

let productos = [];   // lista que viene de Supabase
let carrito = [];     // [{ id, nombre, precio, cantidad }]
let categoriaActiva = "Todas";

// Evita que un texto de la base de datos se interprete como código HTML
function limpiar(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

// ===== PRODUCTOS =====
async function cargarProductos() {
  const estado = document.querySelector("#estado");
  const { data, error } = await sup.from("catalogo_publico").select();

  if (error) {
    console.error("Error al leer catalogo_publico:", error);
    estado.hidden = false;
    estado.textContent = "No pudimos cargar los productos. Intenta de nuevo en unos minutos.";
    return;
  }
  if (!data || data.length === 0) {
    estado.hidden = false;
    estado.textContent = "Todavía no hay productos disponibles.";
    return;
  }
  productos = data;
  estado.hidden = true;
  dibujarFiltros();
  dibujarProductos();
}

function dibujarFiltros() {
  // Las 7 categorías fijas, y además cualquier otra que exista en algún producto,
  // para que ningún producto quede sin su botón si se escribe distinto.
  const extras = [...new Set(productos.map((p) => p.categoria).filter(Boolean))]
    .filter((c) => !CATEGORIAS.includes(c));
  const categorias = ["Todas", ...CATEGORIAS, ...extras];

  const cont = document.querySelector("#filtros");
  cont.innerHTML = categorias
    .map((c) => `<button class="filtro ${c === categoriaActiva ? "activo" : ""}" data-cat="${limpiar(c)}">${limpiar(c)}</button>`)
    .join("");
  cont.querySelectorAll(".filtro").forEach((b) =>
    b.addEventListener("click", () => {
      categoriaActiva = b.dataset.cat;
      dibujarFiltros();
      dibujarProductos();
    })
  );
}

function dibujarProductos() {
  const lista = productos.filter((p) => categoriaActiva === "Todas" || p.categoria === categoriaActiva);
  const cont = document.querySelector("#productos");

  // Categoría sin productos todavía: un mensaje claro en vez de un espacio vacío
  if (lista.length === 0) {
    cont.innerHTML = '<p class="estado">Pronto tendremos productos en esta categoría.</p>';
    return;
  }

  cont.innerHTML = lista
    .map((p) => {
      const agotado = p.existencia <= 0;
      const imagen = p.imagen_url
        ? `<img src="${limpiar(p.imagen_url)}" alt="${limpiar(p.nombre)}">`
        : "🐶";
      return `
      <article class="tarjeta">
        <div class="tarjeta-img">${imagen}</div>
        <div class="tarjeta-cuerpo">
          <span class="cat">${limpiar(p.categoria)}</span>
          <h3>${limpiar(p.nombre)}</h3>
          <p class="desc">${limpiar(p.descripcion)}</p>
          <p class="precio">Bs ${p.precio_venta}</p>
          ${agotado ? '<p class="agotado">Agotado</p>' : ""}
          <button class="btn" data-id="${p.id_producto}" ${agotado ? "disabled" : ""}>
            ${agotado ? "Agotado" : "Agregar al pedido"}
          </button>
        </div>
      </article>`;
    })
    .join("");

  document.querySelectorAll("#productos .btn:not(:disabled)").forEach((b) =>
    b.addEventListener("click", () => agregar(Number(b.dataset.id)))
  );
}

// ===== CARRITO =====
function agregar(id) {
  const p = productos.find((x) => x.id_producto === id);
  if (!p) return;
  const item = carrito.find((x) => x.id === id);
  if (item) {
    if (item.cantidad < p.existencia) item.cantidad++;
  } else {
    carrito.push({ id, nombre: p.nombre, precio: p.precio_venta, cantidad: 1 });
  }
  dibujarCarrito();
  abrirCarrito(true);
}

function cambiarCantidad(id, delta) {
  const item = carrito.find((x) => x.id === id);
  const p = productos.find((x) => x.id_producto === id);
  if (!item || !p) return;
  item.cantidad = Math.min(item.cantidad + delta, p.existencia);
  if (item.cantidad <= 0) carrito = carrito.filter((x) => x.id !== id);
  dibujarCarrito();
}

function dibujarCarrito() {
  const cont = document.querySelector("#carrito-items");
  cont.innerHTML = carrito.length
    ? carrito
        .map(
          (i) => `
      <div class="item">
        <strong>${limpiar(i.nombre)}</strong>
        <span>Bs ${i.precio * i.cantidad}</span>
        <div class="item-cant">
          <button data-id="${i.id}" data-d="-1" aria-label="Quitar uno">−</button>
          ${i.cantidad}
          <button data-id="${i.id}" data-d="1" aria-label="Agregar uno">+</button>
        </div>
      </div>`
        )
        .join("")
    : "<p>Tu pedido está vacío. Agrega una prenda del catálogo.</p>";

  cont.querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => cambiarCantidad(Number(b.dataset.id), Number(b.dataset.d)))
  );

  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  document.querySelector("#total").textContent = "Bs " + total;
  document.querySelector("#contador").textContent = carrito.reduce((s, i) => s + i.cantidad, 0);
}

function abrirCarrito(abrir) {
  const panel = document.querySelector("#carrito");
  panel.classList.toggle("abierto", abrir);
  panel.setAttribute("aria-hidden", String(!abrir));
  document.querySelector("#fondo").classList.toggle("visible", abrir);
}

// Redirección directa a WhatsApp (misma pestaña, no la bloquean los navegadores móviles)
function abrirWhatsApp(mensaje) {
  const numero = document.querySelector("#num-whatsapp").value.replace(/\D/g, "");
  // Se arma con "+" para que la barra "/" después de wa.me no se pierda al copiar y pegar
  const url = "https://wa.me/" + numero + "?text=" + encodeURIComponent(mensaje);
  window.location.href = url;
}

// ===== NUEVO: VENTANA DEL QR =====
let mensajePendiente = "";

function mostrarQR(total, mensaje) {
  mensajePendiente = mensaje;
  document.querySelector("#qr-total").textContent = "Bs " + total;
  document.querySelector("#modal-qr").hidden = false;
}

// ===== ENVÍO PROTEGIDO MEDIANTE LA FUNCIÓN RPC DE SUPABASE =====
async function enviarWhatsApp() {
  if (carrito.length === 0) return;

  const nombreCliente = document.querySelector("#cliente-nombre").value.trim();
  const telefonoCliente = document.querySelector("#cliente-telefono").value.trim();
  const direccionCliente = document.querySelector("#cliente-direccion").value.trim();

  if (!nombreCliente || !telefonoCliente || !direccionCliente) {
    alert("Por favor, completa tu Nombre, Teléfono y Dirección antes de continuar.");
    return;
  }

  const telefonoLimpio = telefonoCliente.replace(/\D/g, "");
  if (!telefonoLimpio) {
    alert("Por favor, escribe un número de teléfono válido.");
    return;
  }

  const btn = document.querySelector("#btn-whatsapp");

  // El mensaje se arma antes de la transacción como plan de contingencia
  const lineas = carrito.map((i) => `• ${i.cantidad} x ${i.nombre} (Bs ${i.precio * i.cantidad})`);
  const totalEstimado = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const mensaje = `*Nuevo Pedido - Multiverse del Hogar y Patitas*\n\n` +
                  `*Cliente:* ${nombreCliente}\n` +
                  `*Teléfono:* ${telefonoCliente}\n` +
                  `*Dirección:* ${direccionCliente}\n\n` +
                  `*Productos:*\n${lineas.join("\n")}\n\n` +
                  `*Total del Pedido: Bs ${totalEstimado}*\n\n` +
                  `_Coordinamos la entrega. Recuerden que las entregas son los viernes de 17:00 a 18:00._`;

  btn.disabled = true;
  btn.textContent = "Procesando pedido... 🐾";

  try {
    // Solo se envían ids y cantidades; el servidor toma los precios reales
    const itemsSimplificados = carrito.map((item) => ({ id: item.id, cantidad: item.cantidad }));

    const { data, error } = await sup.rpc("procesar_pedido_seguro", {
      p_nombre: nombreCliente,
      p_telefono: Number(telefonoLimpio),
      p_direccion: direccionCliente,
      p_id_usuario: 1, // Usuario por defecto para la web pública
      p_items: itemsSimplificados
    });

    if (error) throw error;
    console.log("¡Pedido guardado en el servidor con éxito!", data);

    carrito = [];
    dibujarCarrito();
    abrirCarrito(false);
    await cargarProductos();

    btn.disabled = false;
    btn.textContent = "Enviar pedido por WhatsApp";

    mostrarQR(totalEstimado, mensaje); // NUEVO: antes aquí se abría WhatsApp directo

  } catch (error) {
    console.error("Error procesando pedido en el servidor:", error);

    // Sin stock suficiente: NO se envía a WhatsApp, el cliente debe ajustar su pedido
    if (String(error.message || "").includes("Stock insuficiente")) {
      alert("Algún producto ya no tiene stock suficiente. Revisa tu pedido e intenta de nuevo.");
      carrito = [];
      dibujarCarrito();
      await cargarProductos();
      btn.disabled = false;
      btn.textContent = "Enviar pedido por WhatsApp";
      return;
    }

    // Otros errores: contingencia por WhatsApp para no perder la venta
    alert("Tuvimos un inconveniente al registrar el pedido en el sistema. Te llevaremos a WhatsApp de todos modos.");
    carrito = [];
    dibujarCarrito();
    abrirCarrito(false);
    await cargarProductos();

    btn.disabled = false;
    btn.textContent = "Enviar pedido por WhatsApp";

    abrirWhatsApp(mensaje);
  }
}

// ===== ARRANQUE =====
document.querySelector("#btn-carrito").addEventListener("click", () => abrirCarrito(true));
document.querySelector("#cerrar-carrito").addEventListener("click", () => abrirCarrito(false));
document.querySelector("#fondo").addEventListener("click", () => abrirCarrito(false));
document.querySelector("#btn-whatsapp").addEventListener("click", enviarWhatsApp);

// NUEVO: botón de la ventana del QR, cierra la ventana y abre WhatsApp con el mensaje
document.querySelector("#btn-qr-whatsapp").addEventListener("click", () => {
  document.querySelector("#modal-qr").hidden = true;
  abrirWhatsApp(mensajePendiente);
});

dibujarCarrito();
cargarProductos();