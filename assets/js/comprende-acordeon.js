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