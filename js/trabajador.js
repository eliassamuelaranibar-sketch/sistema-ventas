// ===== ELEMENTOS DE LA PÁGINA =====
const vistaLogin = document.querySelector("#vista-login");
const vistaPanel = document.querySelector("#vista-panel");
const btnSalir = document.querySelector("#btn-salir");
const formLogin = document.querySelector("#form-login");
const mensajeLogin = document.querySelector("#mensaje-login");

const estadoVentas = document.querySelector("#estado-ventas");
const listaVentas = document.querySelector("#lista-ventas");

const estadoProductos = document.querySelector("#estado-productos");
const listaProductos = document.querySelector("#lista-productos");
const formNuevo = document.querySelector("#form-nuevo");
const mensajeNuevo = document.querySelector("#mensaje-nuevo");
const btnNuevo = document.querySelector("#btn-nuevo");

// Evita que un texto de la base de datos se interprete como código HTML
function limpiar(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

// 20261107 -> 07/11/2026
function formatearFecha(n) {
  const s = String(n);
  return s.length === 8 ? `${s.slice(6, 8)}/${s.slice(4, 6)}/${s.slice(0, 4)}` : s;
}

// ===== PESTAÑAS =====
function cambiarPestana(nombre) {
  document.querySelector("#panel-ventas").hidden = nombre !== "ventas";
  document.querySelector("#panel-productos").hidden = nombre !== "productos";
  document.querySelectorAll("[data-pestana]").forEach((b) =>
    b.classList.toggle("activo", b.dataset.pestana === nombre)
  );
}
document.querySelectorAll("[data-pestana]").forEach((b) =>
  b.addEventListener("click", () => cambiarPestana(b.dataset.pestana))
);

// ===== LOGIN / SESIÓN =====
// Muestra el login o el panel según haya sesión
function mostrar(sesion) {
  const hayS = Boolean(sesion);
  vistaLogin.hidden = hayS;
  vistaPanel.hidden = !hayS;
  btnSalir.hidden = !hayS;
  if (hayS) {
    cargarVentas();
    cargarProductos();
  }
}

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  mensajeLogin.textContent = "";
  const { data, error } = await sup.auth.signInWithPassword({
    email: document.querySelector("#login-email").value.trim(),
    password: document.querySelector("#login-password").value,
  });
  if (error) {
    mensajeLogin.textContent = "Correo o contraseña incorrectos.";
    return;
  }
  formLogin.reset();
  mostrar(data.session);
});

btnSalir.addEventListener("click", async () => {
  await sup.auth.signOut();
  mostrar(null);
});

// ===== VENTAS =====
async function cargarVentas() {
  estadoVentas.hidden = false;
  estadoVentas.textContent = "Cargando ventas...";
  listaVentas.innerHTML = "";

  const { data, error } = await sup
    .from("ventas")
    .select("id_venta, fecha_venta, total, estado, cliente(nombre, telefono, direccion), detalles_venta(cantidad, subtotal, producto(nombre))")
    .order("id_venta", { ascending: false });

  if (error) {
    console.error("Error al leer ventas:", error);
    estadoVentas.textContent = "No pudimos cargar las ventas.";
    return;
  }
  if (!data || data.length === 0) {
    estadoVentas.textContent = "Todavía no hay ventas.";
    return;
  }

  estadoVentas.hidden = true;
  listaVentas.innerHTML = data
    .map((v) => {
      const items = (v.detalles_venta || [])
        .map((d) => `<li>${limpiar(d.cantidad)} x ${limpiar(d.producto?.nombre)} (Bs ${limpiar(d.subtotal)})</li>`)
        .join("");
      const botones = v.estado === "pendiente"
        ? `<button class="btn btn-ancho btn-entregar" data-id="${v.id_venta}">Marcar como entregada</button>
           <button class="btn btn-ancho btn-cancelar" data-id="${v.id_venta}" style="background: var(--rojo); margin-top: 8px;">Cancelar pedido</button>`
        : "";
      return `
      <article class="tarjeta-contacto">
        <h3>Venta #${v.id_venta} · ${limpiar(v.estado)}</h3>
        <p>📅 ${formatearFecha(v.fecha_venta)}</p>
        <p>👤 ${limpiar(v.cliente?.nombre)} · 📱 ${limpiar(v.cliente?.telefono)}</p>
        <p>📍 ${limpiar(v.cliente?.direccion)}</p>
        <ul>${items}</ul>
        <p><strong>Total: Bs ${limpiar(v.total)}</strong></p>
        ${botones}
      </article>`;
    })
    .join("");

  // Botón "Marcar como entregada"
  listaVentas.querySelectorAll(".btn-entregar").forEach((b) =>
    b.addEventListener("click", async () => {
      b.disabled = true;
      const { error } = await sup.rpc("cambiar_estado_venta", {
        p_id_venta: Number(b.dataset.id),
        p_estado: "entregada",
      });
      if (error) {
        console.error("Error al cambiar el estado:", error);
        alert("No se pudo cambiar el estado. Intenta de nuevo.");
        b.disabled = false;
        return;
      }
      cargarVentas();
    })
  );

  // Botón "Cancelar pedido": pide confirmación y devuelve los productos al stock
  listaVentas.querySelectorAll(".btn-cancelar").forEach((b) =>
    b.addEventListener("click", async () => {
      if (!confirm("¿Cancelar este pedido? Los productos volverán al stock y no se puede deshacer.")) return;
      b.disabled = true;
      const { error } = await sup.rpc("cancelar_venta", {
        p_id_venta: Number(b.dataset.id),
      });
      if (error) {
        console.error("Error al cancelar la venta:", error);
        alert("No se pudo cancelar el pedido. Intenta de nuevo.");
        b.disabled = false;
        return;
      }
      cargarVentas();
      cargarProductos();
    })
  );
}

// ===== PRODUCTOS =====
function avisoNuevo(texto, esError) {
  mensajeNuevo.textContent = texto;
  mensajeNuevo.className = esError ? "agotado" : "estado";
}

async function cargarProductos() {
  estadoProductos.hidden = false;
  estadoProductos.textContent = "Cargando productos...";
  listaProductos.innerHTML = "";

  const { data, error } = await sup
    .from("producto")
    .select("id_producto, nombre, categoria, precio_costo, precio_venta, existencia, descripcion") // NUEVO: se pide la descripción
    .order("id_producto");

  if (error) {
    console.error("Error al leer productos:", error);
    estadoProductos.textContent = "No pudimos cargar los productos.";
    return;
  }
  if (!data || data.length === 0) {
    estadoProductos.textContent = "Todavía no hay productos.";
    return;
  }

  estadoProductos.hidden = true;
  listaProductos.innerHTML = data
    .map((p) => `
      <article class="tarjeta-contacto" data-id="${p.id_producto}">
        <h3>${limpiar(p.nombre)}</h3>
        <p>${limpiar(p.categoria)}</p>
        <div class="formulario-cliente">
          <label>Precio de venta (Bs):
            <input type="number" class="in-venta" min="0" step="0.01" value="${limpiar(p.precio_venta)}">
          </label>
          <label>Precio de costo (Bs):
            <input type="number" class="in-costo" min="0" step="0.01" value="${limpiar(p.precio_costo)}">
          </label>
          <label>Stock (unidades):
            <input type="number" class="in-stock" min="0" step="1" value="${limpiar(p.existencia)}">
          </label>
          <label>Descripción:
            <textarea class="in-desc" rows="3" style="width:100%; padding:8px; margin-top:2px; border:2px solid var(--borde); border-radius:8px; font-family:inherit; font-size:1rem;">${limpiar(p.descripcion)}</textarea>
          </label>
        </div>
        <button class="btn btn-ancho btn-guardar" data-id="${p.id_producto}">Guardar cambios</button>
      </article>`)
    .join("");

  // Cada botón "Guardar cambios" llama a la función de Supabase
  listaProductos.querySelectorAll(".btn-guardar").forEach((b) =>
    b.addEventListener("click", async () => {
      const tarjeta = b.closest("article");
      const venta = tarjeta.querySelector(".in-venta").value.trim();
      const costo = tarjeta.querySelector(".in-costo").value.trim();
      const stock = tarjeta.querySelector(".in-stock").value.trim();
      const desc = tarjeta.querySelector(".in-desc").value.trim(); // NUEVO: lee la descripción escrita

      if (venta === "" || costo === "" || stock === "" ||
          Number(venta) < 0 || Number(costo) < 0 || Number(stock) < 0 ||
          !Number.isInteger(Number(stock))) {
        alert("Revisa los datos: no pueden estar vacíos ni ser negativos, y el stock debe ser un número entero.");
        return;
      }

      b.disabled = true;
      b.textContent = "Guardando...";
      const { error } = await sup.rpc("actualizar_producto", {
        p_id_producto: Number(b.dataset.id),
        p_precio_venta: Number(venta),
        p_precio_costo: Number(costo),
        p_existencia: Number(stock),
      });

      if (error) {
        console.error("Error al guardar el producto:", error);
        alert("No se pudo guardar. Intenta de nuevo.");
        b.disabled = false;
        b.textContent = "Guardar cambios";
        return;
      }

      // NUEVO: guarda la descripción con la función nueva de Supabase
      const { error: errDesc } = await sup.rpc("actualizar_descripcion_producto", {
        p_id_producto: Number(b.dataset.id),
        p_descripcion: desc,
      });
      if (errDesc) {
        console.error("Error al guardar la descripción:", errDesc);
        alert("Se guardaron los precios, pero no la descripción. Intenta de nuevo.");
        b.disabled = false;
        b.textContent = "Guardar cambios";
        return;
      }

      b.textContent = "Guardado ✓";
      setTimeout(() => {
        b.disabled = false;
        b.textContent = "Guardar cambios";
      }, 1500);
    })
  );
}

// ===== NUEVO PRODUCTO =====
formNuevo.addEventListener("submit", async (e) => {
  e.preventDefault();
  mensajeNuevo.textContent = "";

  const nombre = document.querySelector("#nuevo-nombre").value.trim();
  const categoria = document.querySelector("#nuevo-categoria").value.trim();
  const venta = document.querySelector("#nuevo-venta").value.trim();
  const costo = document.querySelector("#nuevo-costo").value.trim();
  const stock = document.querySelector("#nuevo-stock").value.trim();
  const descripcion = document.querySelector("#nuevo-descripcion").value.trim();
  const archivo = document.querySelector("#nuevo-foto").files[0];

  if (nombre === "" || categoria === "" || venta === "" || costo === "" || stock === "" ||
      Number(venta) < 0 || Number(costo) < 0 || Number(stock) < 0 ||
      !Number.isInteger(Number(stock))) {
    avisoNuevo("Revisa los datos: nombre y categoría son obligatorios, los números no pueden ser negativos y el stock debe ser entero.", true);
    return;
  }

  if (archivo) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(archivo.type)) {
      avisoNuevo("La foto debe ser JPG, PNG o WebP.", true);
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      avisoNuevo("La foto pesa más de 5 MB. Elige una más liviana.", true);
      return;
    }
  }

  btnNuevo.disabled = true;
  btnNuevo.textContent = "Guardando...";

  // 1) Subir la foto (si hay) al almacén "productos"
  let imagenUrl = "";
  if (archivo) {
    const ext = archivo.type === "image/png" ? "png" : archivo.type === "image/webp" ? "webp" : "jpg";
    // Nombre propio y único, para no depender del nombre del archivo ni pisar otra foto
    const ruta = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: errSubida } = await sup.storage.from("productos").upload(ruta, archivo, { contentType: archivo.type });
    if (errSubida) {
      console.error("Error al subir la foto:", errSubida);
      avisoNuevo("No se pudo subir la foto. Intenta de nuevo.", true);
      btnNuevo.disabled = false;
      btnNuevo.textContent = "Agregar producto";
      return;
    }
    imagenUrl = sup.storage.from("productos").getPublicUrl(ruta).data.publicUrl;
  }

  // 2) Crear el producto con la función de Supabase
  const { error } = await sup.rpc("agregar_producto", {
    p_nombre: nombre,
    p_categoria: categoria,
    p_precio_costo: Number(costo),
    p_precio_venta: Number(venta),
    p_existencia: Number(stock),
    p_imagen_url: imagenUrl,
    p_descripcion: descripcion,
  });

  btnNuevo.disabled = false;
  btnNuevo.textContent = "Agregar producto";

  if (error) {
    console.error("Error al agregar el producto:", error);
    avisoNuevo("No se pudo agregar el producto. Intenta de nuevo.", true);
    return;
  }

  formNuevo.reset();
  avisoNuevo("Producto agregado ✓", false);
  cargarProductos();
});

// ===== ARRANQUE =====
// Al abrir la página: ¿ya hay una sesión guardada en este navegador?
async function iniciar() {
  const { data } = await sup.auth.getSession();
  mostrar(data.session);
}
iniciar();