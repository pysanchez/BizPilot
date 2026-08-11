async function iniciarSesion(event) {
    event.preventDefault();

    const usuarioInput = document.getElementById('usuario').value;
    const passwordInput = document.getElementById('password').value;
    const mensajeError = document.getElementById('mensaje-error');
    const btnLogin = document.getElementById('btn-login');

    mensajeError.classList.add('oculto');
    btnLogin.innerText = "Verificando...";

    try {
        const respuesta = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: usuarioInput, password: passwordInput })
        });

        const datos = await respuesta.json();

        if (datos.exito) {
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
        mensajeError.innerText = "Error de conexion con el servidor.";
        mensajeError.classList.remove('oculto');
        btnLogin.innerText = "Ingresar al Sistema";
    }
}