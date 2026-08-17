/* ====================================================================
   Boton Subir
==================================================================== */      

document.addEventListener("DOMContentLoaded", function () {
    const boton = document.getElementById("boton-subir");
    if (!boton) return;

    const UMBRAL = 320;

    function actualizarVisibilidad() {
        if (window.scrollY > UMBRAL) {
            boton.classList.add("visible");
        } else {
            boton.classList.remove("visible");
        }
    }

    boton.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", actualizarVisibilidad, { passive: true });
    actualizarVisibilidad();
});
/* ====================================================================
    Acordeon titulos
==================================================================== */
document.addEventListener("DOMContentLoaded", function () {
    function abrirYDesplazar(id) {
        const detalle = document.getElementById(id);
        if (!detalle || detalle.tagName !== "DETAILS") return;
        detalle.open = true;
        detalle.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (window.location.hash) {
        abrirYDesplazar(window.location.hash.substring(1));
    }

    window.addEventListener("hashchange", function () {
        abrirYDesplazar(window.location.hash.substring(1));
    });
});

/* ====================================================================
   Tarjetas links
==================================================================== */

document.addEventListener("DOMContentLoaded", function () {
    const tarjetas = document.querySelectorAll(".tarjeta[data-href]");

    tarjetas.forEach(function (tarjeta) {
        tarjeta.addEventListener("click", function (event) {
            // Si el clic fue directamente sobre el link del título,
            // dejamos que el navegador lo maneje normal (evita doble redirección)
            if (event.target.closest("a")) {
                return;
            }
            window.location.href = tarjeta.dataset.href;
        });
    });
});

/* ====================================================================
   Intercambiable
==================================================================== */


document.addEventListener("DOMContentLoaded", () => {
    const estilos = [
        "estilo-hojas-1",
        "estilo-hojas-2",
        "estilo-hojas-3",
        "estilo-hojas-4",
        "estilo-hojas-5", 
        "estilo-hojas-6", 
    ];

    const estiloAleatorio = estilos[Math.floor(Math.random() * estilos.length)];
    document.body.classList.add(estiloAleatorio);
});


