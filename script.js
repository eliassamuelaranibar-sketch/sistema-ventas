//function saludar() {
//    return console.log("hola");
//}
//saludar();

//const iva = 0.13;
//let saldo = 100;
//saldo = saldo -30;
//console.log (iva);
//console.log (saldo);}//
//const saludar = () => console.log("hola amigos");

//saludar();

//const triple = (n) => n * 3;

//console.log(triple(4));

//const ingresodiscoteca = (edad) => {
//if(adad >= 18){
    //console.log("puedes entrear")
//} else {
   // console.log("no puedes entrar");
// }
//};

//ingresodiscoteca(18);
//let cantidad = 3;
//let precioUnitario = 50;

//const subtotal = (cantidad, precioUnitario) => cantidad * precioUnitario;
//console.log(subtotal(cantidad))

//let nombre = "elias";
//let edad = 15;

//const``

//destructurar

// const producto = {
//     id: 2
//     nombre: "martillo",
//     precio: 45,
//     stock: 12,
// };

//const nombre = producto.nombre;
//console.log(nombre);

//const id = producto.id;
//console.log(id);

// const {id, nombre } = producto;

// console.log(id);
// console.log(`tienes ${stock} ${nombre}s`);

// const usuario = {
//     id: 3,
//     nombre: "elias",
//     rol: "admin",
//     edad: 25,
// };
 
// const {nombre, edad } = usuario;

// console.log(`${nombre} tiene ${edad} años`);

// const respuestas ={
//     data : ["martillo","alicate", "taladro"],
//     error: null,
// };

// const {data, error } =respuesta;
// console.log(`${data} ${error}`);

//  const productos = [
//  { nombre: "Martillo", precio: 45, existencia: 12 },
//  { nombre: "Taladro", precio: 350, existencia: 5 },
//  { nombre: "Clavos", precio: 15, existencia: 40 },
//  ];
// const nombres = productos.map((p) => p.nombre);
// console.log(nombre);

// const precio = productos.map((p) => p.precio);
// console.log(precio);

// const precioiva = productos.map((p) => p.precio * 1.13);
// console.log(precioiva);

// const preciosmayorcien = productos.map((p) => {
//     if (p.precio > 100) {
//         return p.nombre;
//     } else{ 
//         return null;
//     }
// });
// const productos = [
// { nombre: "Martillo", precio: 45, existencia: 12 },
// { nombre: "Taladro", precio: 350, existencia: 5 },
// { nombre: "Clavos", precio: 15, existencia: 40 },
// ];
// //  const preciosmayorcien = productos.filter((p) => p.precio > 100);
// //  console.log(preciosmayorcien);

//  const tohermenoresciemn
// const taladro = productos.find((p)=> p.nombre === "taladro");
// console.log(taladro);
// const totalInventario = productos.reduce((suma, p) => suma + p.precio, 0);
// console.log(totalInventario);

// const totalInventario = productos.reduce((total, p) => total + p.precio * p.existencia, 0,);
// console.log(totalInventario);

