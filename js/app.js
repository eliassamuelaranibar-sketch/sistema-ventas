// js/app.js
async function iniciar() {
const { data, error } = await supabase.from("productos").select();
if (error) {
console.error("Error al leer productos:", error);
return;
}
console.log("Productos encontrados:", data);
}
iniciar();