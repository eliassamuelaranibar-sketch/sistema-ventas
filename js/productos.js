const vistaSinSesion = document.querySelector("#vista-sin-sesion");
const vistaProductos = document.querySelector("#vista-productos");
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
    .select("id_producto, nombre, categoria, precio_costo, precio_venta, existencia")
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

// Al abrir la página: ¿hay una sesión de trabajador guardada en este navegador?
async function iniciar() {
  const { data } = await sup.auth.getSession();
  const hayS = Boolean(data.session);
  vistaSinSesion.hidden = hayS;
  vistaProductos.hidden = !hayS;
  if (hayS) cargarProductos();
}
iniciar();