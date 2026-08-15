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