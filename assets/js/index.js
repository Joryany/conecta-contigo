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