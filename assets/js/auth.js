/* ============================================================
   AUTENTICACIÓN — Conecta Contigo
   ============================================================
   Usa Supabase Auth para registro, inicio de sesión, cierre de
   sesión y verificación de sesión activa. Supabase se encarga de
   guardar las contraseñas de forma segura (con hashing) y de
   emitir/validar los tokens de sesión; este archivo solo llama a
   esa API desde el frontend.
   ============================================================ */

// Comprueba si hay una sesión activa. Si NO la hay, redirige a
// cuenta.html. Se usa al cargar emocional.html (página privada).
async function exigirSesion() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = "cuenta.html";
        return null;
    }
    return session;
}

// Actualiza el enlace de la barra de navegación según haya o no
// sesión activa (id="nav-auth-link" en el <nav> de cada página).
async function actualizarEnlaceNav() {
    const enlace = document.getElementById("nav-auth-link");
    if (!enlace) return;

    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session) {
        enlace.textContent = "Cerrar sesión";
        enlace.href = "#";
        enlace.onclick = async (e) => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = "cuenta.html";
        };
    } else {
        enlace.textContent = "Iniciar sesión";
        enlace.href = "cuenta.html";
        enlace.onclick = null;
    }
}

/* ============================================================
   LÓGICA DE LA PÁGINA cuenta.html (login / crear cuenta)
   ============================================================ */

function inicializarPaginaCuenta() {
    const tabLogin = document.getElementById("tab-login");
    const tabRegistro = document.getElementById("tab-registro");
    const formLogin = document.getElementById("form-login");
    const formRegistro = document.getElementById("form-registro");
    const mensaje = document.getElementById("auth-mensaje");

    // Si estos elementos no existen, no estamos en cuenta.html.
    if (!tabLogin || !tabRegistro || !formLogin || !formRegistro) return;

    function mostrarMensaje(texto, esError) {
        mensaje.textContent = texto;
        mensaje.classList.toggle("mensaje-estado--error", !!esError);
    }

    function cambiarTab(mostrarLogin) {
        tabLogin.classList.toggle("activa", mostrarLogin);
        tabRegistro.classList.toggle("activa", !mostrarLogin);
        formLogin.classList.toggle("oculto", !mostrarLogin);
        formRegistro.classList.toggle("oculto", mostrarLogin);
        mostrarMensaje("", false);
    }

    tabLogin.addEventListener("click", () => cambiarTab(true));
    tabRegistro.addEventListener("click", () => cambiarTab(false));

    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        const btn = formLogin.querySelector("button[type=submit]");

        btn.disabled = true;
        mostrarMensaje("Iniciando sesión...", false);

        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

        btn.disabled = false;

        if (error) {
            mostrarMensaje("El correo o la contraseña no son correctos.", true);
            return;
        }
        window.location.href = "emocional.html";
    });

    formRegistro.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("registro-email").value.trim();
        const password = document.getElementById("registro-password").value;
        const password2 = document.getElementById("registro-password2").value;
        const btn = formRegistro.querySelector("button[type=submit]");

        if (password.length < 6) {
            mostrarMensaje("La contraseña debe tener al menos 6 caracteres.", true);
            return;
        }
        if (password !== password2) {
            mostrarMensaje("Las contraseñas no coinciden.", true);
            return;
        }

        btn.disabled = true;
        mostrarMensaje("Creando tu cuenta...", false);

        const { error } = await supabaseClient.auth.signUp({ email, password });

        btn.disabled = false;

        if (error) {
            const msg = (error.message || "").toLowerCase();
            if (msg.includes("already registered") || msg.includes("already exists")) {
                mostrarMensaje("Ya existe una cuenta con ese correo.", true);
            } else {
                mostrarMensaje("No se pudo crear la cuenta. Inténtalo nuevamente.", true);
            }
            return;
        }

        mostrarMensaje(
            "Cuenta creada. Si tu proyecto de Supabase pide confirmación por correo, revisa tu bandeja y luego inicia sesión.",
            false
        );
        formRegistro.reset();
        cambiarTab(true);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    inicializarPaginaCuenta();
    actualizarEnlaceNav();
});