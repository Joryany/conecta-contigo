(function () {
    const boton = document.getElementById('boton-evaluacion');
    const panel = document.getElementById('panel-evaluacion');
    const cerrar = document.getElementById('cerrar-evaluacion');

    if (!boton || !panel || !cerrar) return;

    function abrirPanel() {
        panel.classList.add('activo');
        boton.setAttribute('aria-expanded', 'true');
        panel.setAttribute('aria-hidden', 'false');
    }

    function cerrarPanel() {
        panel.classList.remove('activo');
        boton.setAttribute('aria-expanded', 'false');
        panel.setAttribute('aria-hidden', 'true');
    }

    function togglePanel(e) {
        e.stopPropagation();
        if (panel.classList.contains('activo')) {
            cerrarPanel();
        } else {
            abrirPanel();
        }
    }

    boton.addEventListener('click', togglePanel);

    cerrar.addEventListener('click', function (e) {
        e.stopPropagation();
        cerrarPanel();
    });

    document.addEventListener('click', function (e) {
        if (panel.classList.contains('activo') && !panel.contains(e.target) && e.target !== boton) {
            cerrarPanel();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && panel.classList.contains('activo')) {
            cerrarPanel();
        }
    });
})();