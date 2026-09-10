/* ============================================================
   AUTENTICACIÓN — Conecta Contigo
   ============================================================ */

const DOMINIO_INTERNO = "conectacontigo.local";

const PREGUNTAS_SEGURIDAD = [
    "¿Cuál es el nombre de tu primera mascota?",
    "¿Cuál es tu color favorito?",
    "¿En qué ciudad naciste?",
    "¿Cuál es el nombre de tu mejor amigo/a de la infancia?",
    "¿Cuál es tu comida favorita?",
    "¿Cómo se llama tu profesor/a favorito/a?"
];

function usuarioACorreoInterno(nombreUsuario) {
    const limpio = nombreUsuario.trim().toLowerCase();
    return `${limpio}@${DOMINIO_INTERNO}`;
}

// Entre 3 y 20 caracteres: letras, números, guion bajo (_) o punto (.).
function nombreUsuarioValido(nombreUsuario) {
    return /^[a-zA-Z0-9_.]{3,20}$/.test(nombreUsuario.trim());
}

// Mínimo 6 caracteres, al menos 1 mayúscula, 1 número y 1 caracter especial.
function passwordValida(password) {
    return /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,}$/.test(password);
}

async function exigirSesion() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = "cuenta.html";
        return null;
    }
    return session;
}

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
   VALIDACIÓN EN TIEMPO REAL (marca en rojo los campos inválidos)
   ============================================================ */

function marcarValidez(input, esValido) {
    input.classList.toggle("campo-invalido", !esValido);
}

// Conecta un input con una función de validación: mientras la
// persona escribe, el campo se marca en rojo si no cumple.
function vigilarCampo(input, validador) {
    if (!input) return;
    input.addEventListener("input", () => {
        const valor = input.value;
        marcarValidez(input, valor === "" || validador(valor));
    });
}

/* ============================================================
   MOSTRAR / OCULTAR CONTRASEÑA
   ============================================================ */

function inicializarBotonesMostrarPassword() {
    document.querySelectorAll(".btn-mostrar-password").forEach(btn => {
        btn.addEventListener("click", () => {
            const input = document.getElementById(btn.dataset.target);
            if (!input) return;
            const oculto = input.type === "password";
            input.type = oculto ? "text" : "password";
            btn.textContent = oculto ? "Ocultar" : "Mostrar";
            btn.setAttribute("aria-pressed", oculto ? "true" : "false");
        });
    });
}

/* ============================================================
   LÓGICA DE LA PÁGINA cuenta.html
   ============================================================ */

function inicializarPaginaCuenta() {
    const tabLogin = document.getElementById("tab-login");
    const tabRegistro = document.getElementById("tab-registro");
    const tabRecuperar = document.getElementById("tab-recuperar");
    const formLogin = document.getElementById("form-login");
    const formRegistro = document.getElementById("form-registro");
    const formRecuperar = document.getElementById("form-recuperar");
    const mensaje = document.getElementById("auth-mensaje");
    const cajaCodigo = document.getElementById("codigo-recuperacion-caja");

    if (!tabLogin || !tabRegistro || !tabRecuperar) return;

    inicializarBotonesMostrarPassword();

    // Validación en tiempo real.
    vigilarCampo(document.getElementById("login-username"), nombreUsuarioValido);
    vigilarCampo(document.getElementById("registro-username"), nombreUsuarioValido);
    vigilarCampo(document.getElementById("registro-password"), passwordValida);
    vigilarCampo(document.getElementById("registro-password2"), (v) =>
        v === document.getElementById("registro-password").value);
    vigilarCampo(document.getElementById("recuperar-username"), nombreUsuarioValido);
    vigilarCampo(document.getElementById("recuperar-nueva-password"), passwordValida);
    vigilarCampo(document.getElementById("recuperar-nueva-password2"), (v) =>
        v === document.getElementById("recuperar-nueva-password").value);

    function mostrarMensaje(texto, esError) {
        mensaje.textContent = texto;
        mensaje.classList.toggle("mensaje-estado--error", !!esError);
    }

    function ocultarCajaCodigo() {
        cajaCodigo.classList.add("oculto");
        cajaCodigo.innerHTML = "";
    }

    function mostrarCajaCodigo(codigo, alTerminar) {
        cajaCodigo.classList.remove("oculto");
        cajaCodigo.innerHTML = `
            <p><strong>Tu código de recuperación personal:</strong></p>
            <p class="codigo-recuperacion-texto">${codigo}</p>
            <p class="auth-ayuda">
                Guárdalo en un lugar seguro. Lo necesitarás, junto con tu pregunta de
                seguridad, si alguna vez olvidas tu contraseña. No se puede volver a mostrar.
            </p>
            <button type="button" class="btn-secundario" id="btn-continuar-codigo">Ya lo guardé, continuar</button>
        `;
        document.getElementById("btn-continuar-codigo").addEventListener("click", alTerminar);
    }

    function cambiarTab(tabActiva) {
        tabLogin.classList.toggle("activa", tabActiva === "login");
        tabRegistro.classList.toggle("activa", tabActiva === "registro");
        tabRecuperar.classList.toggle("activa", tabActiva === "recuperar");

        formLogin.classList.toggle("oculto", tabActiva !== "login");
        formRegistro.classList.toggle("oculto", tabActiva !== "registro");
        formRecuperar.classList.toggle("oculto", tabActiva !== "recuperar");

        mostrarMensaje("", false);
        ocultarCajaCodigo();
    }

    tabLogin.addEventListener("click", () => cambiarTab("login"));
    tabRegistro.addEventListener("click", () => cambiarTab("registro"));
    tabRecuperar.addEventListener("click", () => cambiarTab("recuperar"));

    const selectPregunta = document.getElementById("registro-pregunta");
    if (selectPregunta) {
        selectPregunta.innerHTML = PREGUNTAS_SEGURIDAD
            .map(p => `<option value="${p}">${p}</option>`).join("");
    }

    // ---------------------- INICIAR SESIÓN ----------------------
    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nombreUsuario = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;
        const btn = formLogin.querySelector("button[type=submit]");

        if (!nombreUsuarioValido(nombreUsuario)) {
            mostrarMensaje("El nombre de usuario no es válido.", true);
            marcarValidez(document.getElementById("login-username"), false);
            return;
        }

        btn.disabled = true;
        mostrarMensaje("Iniciando sesión...", false);

        const { error } = await supabaseClient.auth.signInWithPassword({
            email: usuarioACorreoInterno(nombreUsuario),
            password
        });

        btn.disabled = false;

        if (error) {
            mostrarMensaje("El usuario o la contraseña no son correctos.", true);
            return;
        }
        window.location.href = "emocional.html";
    });

    // ------------------------ CREAR CUENTA ------------------------
    formRegistro.addEventListener("submit", async (e) => {
        e.preventDefault();
        const campoUsuario = document.getElementById("registro-username");
        const campoPassword = document.getElementById("registro-password");
        const campoPassword2 = document.getElementById("registro-password2");
        const nombreUsuario = campoUsuario.value;
        const password = campoPassword.value;
        const password2 = campoPassword2.value;
        const pregunta = document.getElementById("registro-pregunta").value;
        const respuesta = document.getElementById("registro-respuesta").value;
        const btn = formRegistro.querySelector("button[type=submit]");

        let hayErrores = false;

        if (!nombreUsuarioValido(nombreUsuario)) {
            marcarValidez(campoUsuario, false);
            hayErrores = true;
        }
        if (!passwordValida(password)) {
            marcarValidez(campoPassword, false);
            hayErrores = true;
        }
        if (password !== password2) {
            marcarValidez(campoPassword2, false);
            hayErrores = true;
        }

        if (hayErrores) {
            mostrarMensaje("Revisa los campos marcados en rojo antes de continuar.", true);
            return;
        }
        if (!respuesta.trim()) {
            mostrarMensaje("Responde la pregunta de seguridad; la necesitarás si olvidas tu contraseña.", true);
            return;
        }

        btn.disabled = true;
        mostrarMensaje("Creando tu cuenta...", false);

        const { error: errorRegistro } = await supabaseClient.auth.signUp({
            email: usuarioACorreoInterno(nombreUsuario),
            password,
            options: {
                data: { username: nombreUsuario.trim() }
            }
        });

        if (errorRegistro) {
            btn.disabled = false;
            const msg = (errorRegistro.message || "").toLowerCase();
            if (msg.includes("already registered") || msg.includes("already exists")) {
                mostrarMensaje("Ese nombre de usuario ya está en uso. Elige otro.", true);
            } else {
                mostrarMensaje("No se pudo crear la cuenta. Inténtalo nuevamente.", true);
            }
            return;
        }

        const { data: codigo, error: errorRecuperacion } = await supabaseClient.rpc(
            "guardar_recuperacion",
            { pregunta, respuesta }
        );

        btn.disabled = false;

        if (errorRecuperacion || !codigo) {
            mostrarMensaje(
                "Tu cuenta se creó, pero no se pudo guardar tu pregunta de recuperación. Puedes iniciar sesión igualmente.",
                true
            );
            return;
        }

        formRegistro.reset();
        mostrarMensaje("Cuenta creada correctamente.", false);
        mostrarCajaCodigo(codigo, () => {
            window.location.href = "emocional.html";
        });
    });

    // ------------------- RECUPERAR CONTRASEÑA -------------------
    const campoUsuarioRecuperar = document.getElementById("recuperar-username");
    const btnBuscarPregunta = document.getElementById("btn-buscar-pregunta");
    const bloquePregunta = document.getElementById("recuperar-pregunta-bloque");
    const textoPregunta = document.getElementById("recuperar-pregunta-texto");
    const bloqueCampos = document.getElementById("recuperar-campos");

    btnBuscarPregunta.addEventListener("click", async () => {
        const nombreUsuario = campoUsuarioRecuperar.value;
        if (!nombreUsuarioValido(nombreUsuario)) {
            mostrarMensaje("Escribe un nombre de usuario válido.", true);
            marcarValidez(campoUsuarioRecuperar, false);
            return;
        }

        btnBuscarPregunta.disabled = true;
        mostrarMensaje("Buscando tu pregunta de seguridad...", false);

        const { data: pregunta, error } = await supabaseClient.rpc(
            "obtener_pregunta_recuperacion",
            { nombre_usuario: nombreUsuario }
        );

        btnBuscarPregunta.disabled = false;

        if (error || !pregunta) {
            mostrarMensaje("No encontramos una cuenta con ese nombre de usuario y pregunta de seguridad.", true);
            bloquePregunta.classList.add("oculto");
            return;
        }

        textoPregunta.textContent = pregunta;
        bloquePregunta.classList.remove("oculto");
        bloqueCampos.classList.remove("oculto");
        campoUsuarioRecuperar.disabled = true;
        btnBuscarPregunta.disabled = true;
        mostrarMensaje("", false);
    });

    formRecuperar.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombreUsuario = campoUsuarioRecuperar.value;
        const respuesta = document.getElementById("recuperar-respuesta").value;
        const codigo = document.getElementById("recuperar-codigo").value;
        const campoNueva = document.getElementById("recuperar-nueva-password");
        const campoNueva2 = document.getElementById("recuperar-nueva-password2");
        const nuevaPassword = campoNueva.value;
        const nuevaPassword2 = campoNueva2.value;
        const btn = formRecuperar.querySelector("button[type=submit]");

        if (!respuesta.trim() || !codigo.trim()) {
            mostrarMensaje("Completa la respuesta y el código de recuperación.", true);
            return;
        }
        let hayErrores = false;
        if (!passwordValida(nuevaPassword)) {
            marcarValidez(campoNueva, false);
            hayErrores = true;
        }
        if (nuevaPassword !== nuevaPassword2) {
            marcarValidez(campoNueva2, false);
            hayErrores = true;
        }
        if (hayErrores) {
            mostrarMensaje("Revisa los campos marcados en rojo antes de continuar.", true);
            return;
        }

        btn.disabled = true;
        mostrarMensaje("Verificando...", false);

        const { data: nuevoCodigo, error } = await supabaseClient.rpc("restablecer_password", {
            nombre_usuario: nombreUsuario,
            respuesta,
            codigo,
            nueva_password: nuevaPassword
        });

        btn.disabled = false;

        if (error || !nuevoCodigo) {
            mostrarMensaje("La respuesta o el código de recuperación no son correctos.", true);
            return;
        }

        formRecuperar.reset();
        bloquePregunta.classList.add("oculto");
        bloqueCampos.classList.add("oculto");
        campoUsuarioRecuperar.disabled = false;
        btnBuscarPregunta.disabled = false;

        mostrarMensaje("Contraseña actualizada correctamente.", false);
        mostrarCajaCodigo(nuevoCodigo, () => {
            cambiarTab("login");
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    inicializarPaginaCuenta();
    actualizarEnlaceNav();
});