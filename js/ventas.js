const vistaLogin = document.querySelector("#vista-login");
const vistaVentas = document.querySelector("#vista-ventas");
const btnSalir = document.querySelector("#btn-salir");
const formLogin = document.querySelector("#form-login");
const mensajeLogin = document.querySelector("#mensaje-login");
const estadoVentas = document.querySelector("#estado-ventas");
const listaVentas = document.querySelector("#lista-ventas");

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

// Muestra el login o la lista de ventas según haya sesión
function mostrar(sesion) {
  const hayS = Boolean(sesion);
  vistaLogin.hidden = hayS;
  vistaVentas.hidden = !hayS;
  btnSalir.hidden = !hayS;
  if (hayS) cargarVentas();
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
    })
  );
}

// Al abrir la página: ¿ya hay una sesión guardada en este navegador?
async function iniciar() {
  const { data } = await sup.auth.getSession();
  mostrar(data.session);
}
iniciar();