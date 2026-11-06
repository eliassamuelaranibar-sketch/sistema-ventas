// ===== CONFIGURACIÓN =====
// Los números de WhatsApp están en index.html, dentro del desplegable "Enviar a" del carrito.

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
    estado.textContent = "No pudimos cargar los productos. Intenta de nuevo en unos minutos.";
    return;
  }
  if (!data || data.length === 0) {
    estado.textContent = "Todavía no hay productos disponibles.";
    return;
  }
  productos = data;
  estado.hidden = true;
  dibujarFiltros();
  dibujarProductos();
}

function dibujarFiltros() {
  const categorias = ["Todas", ...new Set(productos.map((p) => p.categoria).filter(Boolean))];
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
  document.querySelector("#productos").innerHTML = lista
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
  const item = carrito.find((x) => x.id === id);
  if (item) {
    if (item.cantidad < p.existencia) item.cantidad++;   // no pedir más de lo que hay
  } else {
    carrito.push({ id, nombre: p.nombre, precio: p.precio_venta, cantidad: 1 });
  }
  dibujarCarrito();
  abrirCarrito(true);
}

function cambiarCantidad(id, delta) {
  const item = carrito.find((x) => x.id === id);
  const p = productos.find((x) => x.id_producto === id);
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
  document.querySelector("#carrito").classList.toggle("abierto", abrir);
  document.querySelector("#fondo").classList.toggle("visible", abrir);
}

// ===== PEDIDO POR WHATSAPP CON CONEXIÓN A SUPABASE =====
async function enviarWhatsApp() {
  if (carrito.length === 0) return;

  // 1. Tomamos los textos ingresados por el cliente en el carrito
  const nombreCliente = document.querySelector("#cliente-nombre").value.trim();
  const telefonoCliente = document.querySelector("#cliente-telefono").value.trim();
  const direccionCliente = document.querySelector("#cliente-direccion").value.trim();

  // 2. Comprobamos que todos los campos del cliente estén completos
  if (!nombreCliente || !telefonoCliente || !direccionCliente) {
    alert("Por favor, completa tu Nombre, Teléfono y Dirección antes de continuar.");
    return;
  }

  const btn = document.querySelector("#btn-whatsapp");

  try {
    // Deshabilitamos el botón para evitar doble clic mientras procesa
    btn.disabled = true;
    btn.textContent = "Guardando pedido... 🐾";

    // 3. PASO 1: Guardamos los datos en la tabla 'cliente'
    const { data: nuevoCliente, error: errorCliente } = await sup
      .from("cliente")
      .insert([{ 
        nombre: nombreCliente, 
        telefono: Number(telefonoCliente), 
        direccion: direccionCliente 
      }])
      .select(); // El .select() le pide a Supabase que nos devuelva la fila que acaba de crear con su nuevo ID

    if (errorCliente) throw errorCliente;

    // Aquí ya tenemos el ID automático generado para el cliente
    const idDelClienteGenerado = nuevoCliente[0].id_cliente;
    console.log("Cliente guardado con éxito. ID:", idDelClienteGenerado);

    // 4. PASO 2: Armamos y abrimos el mensaje de WhatsApp tradicional
    const lineas = carrito.map((i) => `• ${i.cantidad} x ${i.nombre} (Bs ${i.precio * i.cantidad})`);
    const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);

    const mensaje = `✨ *Nuevo Pedido - Multiverse del Hogar y Patitas* ✨\n\n` +
                    `👤 *Cliente:* ${nombreCliente}\n` +
                    `📱 *Teléfono:* ${telefonoCliente}\n` +
                    `📍 *Dirección:* ${direccionCliente}\n\n` +
                    `🛒 *Productos:* \n${lineas.join("\n")}\n\n` +
                    `💰 *Total del Pedido: Bs ${total}*\n\n` +
                    `📦 _Coordinamos la entrega. Recuerden que las entregas son los viernes de 17:00 a 18:00._`;

    const numero = document.querySelector("#num-whatsapp").value;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, "_blank");

    // Restauramos el diseño del botón
    btn.disabled = false;
    btn.textContent = "Enviar pedido por WhatsApp";

  } catch (error) {
    console.error("Error al registrar el pedido:", error);
    alert("Tuvimos un problema con la base de datos al guardar tus datos. Por favor, intenta enviar de nuevo.");
    btn.disabled = false;
    btn.textContent = "Enviar pedido por WhatsApp";
  }
}

// ===== ARRANQUE =====
document.querySelector("#btn-carrito").addEventListener("click", () => abrirCarrito(true));
document.querySelector("#cerrar-carrito").addEventListener("click", () => abrirCarrito(false));
document.querySelector("#fondo").addEventListener("click", () => abrirCarrito(false));
document.querySelector("#btn-whatsapp").addEventListener("click", enviarWhatsApp);

dibujarCarrito();
cargarProductos();
