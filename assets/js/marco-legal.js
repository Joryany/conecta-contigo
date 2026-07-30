document.addEventListener('DOMContentLoaded', () => {

    /*======================================
    =        1. SISTEMA DE BÚSQUEDA        =
    ======================================*/

    const input = document.getElementById('buscador-input');
    const wrapBuscador = document.querySelector('.buscador-legal');
    const btnLimpiar = document.querySelector('.btn-limpiar');
    const mensajeVacio = document.querySelector('.resultado-busqueda-vacio');
    const btnLimpiarVacio = document.querySelector('.resultado-busqueda-vacio button');
    const tarjetas = Array.from(document.querySelectorAll('.card-legal'));
    const categorias = Array.from(document.querySelectorAll('.categoria-legal'));

    // Guarda el HTML original de cada título/descr. para poder quitar el resaltado
    const original = new Map();
    tarjetas.forEach(t => {
        original.set(t, {
            titulo: t.querySelector('.titulo-norma').innerHTML,
            descripcion: t.querySelector('.descripcion') ? t.querySelector('.descripcion').innerHTML : ''
        });
    });

    function normalizar(texto) {
        return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function resaltar(html, termino) {
        if (!termino) return html;
        const patron = new RegExp('(' + termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
        return html.replace(patron, '<mark class="coincidencia">$1</mark>');
    }

    function limpiarBusqueda() {
        input.value = '';
        wrapBuscador.classList.remove('tiene-texto');
        mensajeVacio.classList.remove('visible');
        tarjetas.forEach(t => {
            t.style.display = '';
            t.style.opacity = '1';
            t.removeAttribute('open');
            const datos = original.get(t);
            t.querySelector('.titulo-norma').innerHTML = datos.titulo;
            const desc = t.querySelector('.descripcion');
            if (desc) desc.innerHTML = datos.descripcion;
        });
        categorias.forEach(c => c.style.display = '');
        input.focus();
    }

    function ejecutarBusqueda() {
        const crudo = input.value.trim();
        wrapBuscador.classList.toggle('tiene-texto', crudo.length > 0);

        if (!crudo) {
            tarjetas.forEach(t => {
                t.style.display = '';
                t.style.opacity = '1';
                const datos = original.get(t);
                t.querySelector('.titulo-norma').innerHTML = datos.titulo;
                const desc = t.querySelector('.descripcion');
                if (desc) desc.innerHTML = datos.descripcion;
            });
            categorias.forEach(c => c.style.display = '');
            mensajeVacio.classList.remove('visible');
            return;
        }

        const termino = normalizar(crudo);
        let algunaCoincidencia = false;

        categorias.forEach(cat => {
            let coincidenciasEnCategoria = 0;

            cat.querySelectorAll('.card-legal').forEach(t => {
                const texto = normalizar(t.textContent);
                const coincide = texto.includes(termino);
                const datos = original.get(t);

                if (coincide) {
                    algunaCoincidencia = true;
                    coincidenciasEnCategoria++;
                    t.style.display = '';
                    t.style.opacity = '1';
                    t.setAttribute('open', '');
                    t.querySelector('.titulo-norma').innerHTML = resaltar(datos.titulo, crudo);
                    const desc = t.querySelector('.descripcion');
                    if (desc) desc.innerHTML = resaltar(datos.descripcion, crudo);
                } else {
                    t.style.display = 'none';
                }
            });

            cat.style.display = coincidenciasEnCategoria > 0 ? '' : 'none';
        });

        mensajeVacio.classList.toggle('visible', !algunaCoincidencia);
    }

    if (input) {
        input.addEventListener('input', ejecutarBusqueda);
        btnLimpiar.addEventListener('click', limpiarBusqueda);
        btnLimpiarVacio.addEventListener('click', limpiarBusqueda);
    }

    /*======================================
    =     2. COPIAR CITA APA AL PORTAPAPELES=
    ======================================*/

    document.querySelectorAll('.cita-apa button').forEach(boton => {
        const textoOriginal = boton.innerHTML;
        boton.addEventListener('click', async () => {
            const cita = boton.closest('.cita-apa').querySelector('p').textContent.trim();
            try {
                await navigator.clipboard.writeText(cita);
            } catch (err) {
                const area = document.createElement('textarea');
                area.value = cita;
                document.body.appendChild(area);
                area.select();
                document.execCommand('copy');
                document.body.removeChild(area);
            }
            boton.classList.add('copiado');
            boton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> ¡Copiado!';
            setTimeout(() => {
                boton.classList.remove('copiado');
                boton.innerHTML = textoOriginal;
            }, 2000);
        });
    });

    /*======================================
    =     3. NAVEGACIÓN POR PESTAÑAS        =
    ======================================*/

    const botonesTab = Array.from(document.querySelectorAll('.tabs-legal button'));
    const seccionesTab = botonesTab
        .map(b => document.querySelector(b.dataset.destino))
        .filter(Boolean);

    botonesTab.forEach(boton => {
        boton.addEventListener('click', () => {
            const destino = document.querySelector(boton.dataset.destino);
            if (!destino) return;
            const offset = document.querySelector('.tabs-legal-wrap').offsetHeight + 20;
            const top = destino.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });

    if ('IntersectionObserver' in window && seccionesTab.length) {
        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach(entrada => {
                if (entrada.isIntersecting) {
                    const idVisible = '#' + entrada.target.id;
                    botonesTab.forEach(b => b.classList.toggle('activo', b.dataset.destino === idVisible));
                }
            });
        }, { rootMargin: '-45% 0px -50% 0px' });

        seccionesTab.forEach(s => observador.observe(s));
    }

});