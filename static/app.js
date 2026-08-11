async function iniciarSesion(event) {
    event.preventDefault();

    const usuarioInput = document.getElementById('usuario').value.trim();
    const passwordInput = document.getElementById('password').value;
    const mensajeError = document.getElementById('mensaje-error');
    const btnLogin = document.getElementById('btn-login');
    let inicioExitoso = false;

    mensajeError.classList.add('oculto');
    btnLogin.innerText = "Verificando...";
    btnLogin.disabled = true;

    try {
        const respuesta = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: usuarioInput, password: passwordInput })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.mensaje || 'El servidor rechazó la solicitud de inicio de sesión.');
        }

        if (datos.exito) {
            if (!datos.datos_usuario || !datos.datos_usuario.id_empresa) {
                throw new Error('El servidor no devolvió los datos de empresa requeridos.');
            }

            inicioExitoso = true;
            btnLogin.style.backgroundColor = "#10b981";
            btnLogin.innerText = "Bienvenido";
            
            localStorage.setItem("bizpilot_sesion", JSON.stringify(datos.datos_usuario));
            
            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 1000);

        } else {
            mensajeError.innerText = datos.mensaje;
            mensajeError.classList.remove('oculto');
            btnLogin.innerText = "Ingresar al Sistema";
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        mensajeError.innerText = error.message || "Error de conexión con el servidor.";
        mensajeError.classList.remove('oculto');
        btnLogin.innerText = "Ingresar al Sistema";
    } finally {
        if (!inicioExitoso) {
            btnLogin.disabled = false;
        }
    }
}