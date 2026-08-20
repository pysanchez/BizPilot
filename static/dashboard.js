// ==========================================
// SESIÓN Y NAVEGACIÓN POR ÁREA Y MÓDULO
// ==========================================
const configuracionAreas = {
    operacion: {
        nombre: 'Operación',
        moduloInicial: 'erp-ventas',
        modulos: [
            'erp-ventas',
            'erp-historial-ventas',
            'erp-inventario',
            'erp-nueva-compra',
            'erp-proveedores',
            'erp-clientes'
        ]
    },
    finanzas: {
        nombre: 'Finanzas',
        moduloInicial: 'fin-resumen',
        modulos: [
            'fin-resumen',
            'fin-ingresos',
            'fin-gastos',
            'fin-cxp',
            'fin-cxc',
            'fin-comprobantes'
        ]
    },
    crm: {
        nombre: 'CRM',
        moduloInicial: 'crm-dashboard',
        modulos: [
            'crm-dashboard',
            'crm-prospectos',
            'crm-embudo',
            'crm-negociaciones'
        ]
    },
    rrhh: {
        nombre: 'RR. HH.',
        moduloInicial: 'rrhh-empleados',
        modulos: [
            'rrhh-empleados',
            'rrhh-administrativo'
        ]
    },
    copilot: {
        nombre: 'BizPilot IA',
        moduloInicial: 'ia-copilot',
        modulos: ['ia-copilot']
    }
};

const configuracionModulos = {
    'erp-ventas': { nombre: 'Punto de venta', area: 'operacion', vistaId: 'vista-ventas', alCargar: iniciarPOS },
    'erp-historial-ventas': { nombre: 'Historial de ventas', area: 'operacion', vistaId: 'vista-historial-ventas', alCargar: obtenerHistorialVentasAPI },
    'erp-inventario': { nombre: 'Inventario y almacén', area: 'operacion', vistaId: 'vista-inventario', alCargar: obtenerProductosAPI },
    'erp-nueva-compra': { nombre: 'Registrar compra', area: 'operacion', vistaId: 'vista-nueva-compra', alCargar: iniciarNuevaCompra },
    'erp-proveedores': { nombre: 'Proveedores', area: 'operacion', vistaId: 'vista-proveedores', alCargar: obtenerProveedoresAPI },
    'erp-clientes': { nombre: 'Clientes', area: 'operacion', vistaId: 'vista-clientes', alCargar: obtenerClientesAPI },

    'fin-resumen': { nombre: 'Dashboard financiero', area: 'finanzas', vistaId: 'vista-fin-resumen', alCargar: obtenerDashboardFinanciero },
    'fin-ingresos': { nombre: 'Analisis de ingresos', area: 'finanzas', vistaId: 'vista-fin-ingresos', alCargar: obtenerAnalisisIngresos },
    'fin-gastos': { nombre: 'Gastos', area: 'finanzas', vistaId: 'vista-fin-gastos', alCargar: obtenerGastosAPI },
    'fin-cxp': { nombre: 'Cuentas por pagar', area: 'finanzas', vistaId: 'vista-fin-cxp', alCargar: obtenerCXPAPI },
    'fin-cxc': { nombre: 'Cuentas por cobrar', area: 'finanzas', vistaId: 'vista-fin-cxc', alCargar: obtenerCXCAPI },
    'fin-comprobantes': { nombre: 'Comprobantes', area: 'finanzas', vistaId: 'vista-fin-comprobantes', alCargar: obtenerComprobantesPago },

    'crm-dashboard': { nombre: 'Dashboard comercial', area: 'crm', vistaId: 'vista-crm-dashboard', alCargar: obtenerDashboardComercial },
    'crm-prospectos': { nombre: 'Prospectos y seguimientos', area: 'crm', vistaId: 'vista-crm-prospectos', alCargar: obtenerProspectosAPI },
    'crm-embudo': { nombre: 'Embudo y cotizaciones', area: 'crm', vistaId: 'vista-crm-embudo', alCargar: obtenerEmbudoCRM },
    'crm-negociaciones': { nombre: 'Negociaciones cerradas', area: 'crm', vistaId: 'vista-crm-negociaciones', alCargar: obtenerNegociacionesCerradasCRM },

    'rrhh-empleados': { nombre: 'Empleados', area: 'rrhh', vistaId: 'vista-rrhh-empleados', alCargar: obtenerEmpleadosRRHH },
    'rrhh-administrativo': { nombre: 'Administrativo', area: 'rrhh', vistaId: 'vista-rrhh-administrativo', alCargar: iniciarAdministrativoRRHH },

    'ia-copilot': { nombre: 'BizPilot IA', area: 'copilot', vistaId: 'vista-ia-copilot', alCargar: inicializarBizPilotIA }
};

let areaActiva = null;

document.addEventListener('DOMContentLoaded', () => {
    const sesion = obtenerSesion();

    if (!sesion || !sesion.id_empresa) {
        cerrarSesion();
        return;
    }

    mostrarNombreEmpresa(sesion);
    configurarNavegacionPrincipal();
    seleccionarArea('operacion');
});

async function mostrarNombreEmpresa(sesion) {
    const elemento = document.getElementById('empresa-nombre');
    if (!elemento || !sesion || !sesion.id_empresa) return;

    if (Object.prototype.hasOwnProperty.call(sesion, 'password')) {
        delete sesion.password;
        localStorage.setItem(
            'bizpilot_sesion',
            JSON.stringify(sesion)
        );
    }

    const nombreGuardado = String(
        sesion.nombre_empresa
        || sesion.nombre_comercial
        || sesion.razon_social
        || ''
    ).trim();

    elemento.textContent = nombreGuardado
        || 'Empresa sin nombre';

    try {
        const respuesta = await fetch(
            `/api/empresas/${sesion.id_empresa}/nombre`,
            { cache: 'no-store' }
        );
        const resultado = await respuesta.json();

        if (
            !respuesta.ok
            || !resultado.exito
            || !resultado.nombre_empresa
        ) {
            return;
        }

        elemento.textContent = resultado.nombre_empresa;
        sesion.nombre_empresa = resultado.nombre_empresa;
        localStorage.setItem(
            'bizpilot_sesion',
            JSON.stringify(sesion)
        );
    } catch (error) {
        console.error('Error al cargar el nombre de la empresa:', error);
    }
}

function obtenerSesion() {
    try {
        const sesionGuardada = localStorage.getItem('bizpilot_sesion');
        return sesionGuardada ? JSON.parse(sesionGuardada) : null;
    } catch (error) {
        console.error('La sesión guardada no tiene un formato JSON válido.', error);
        return null;
    }
}

function cerrarSesion() {
    localStorage.removeItem("bizpilot_sesion");
    window.location.href = "/";
}

function escaparHTML(valor) {
    return String(valor ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatearMoneda(valor) {
    return Number(valor || 0).toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN'
    });
}

function configurarNavegacionPrincipal() {
    const tabs = Array.from(document.querySelectorAll('.area-tab[data-area]'));
    const selectorModulo = document.getElementById('selector-modulo');

    tabs.forEach((tab, indice) => {
        tab.addEventListener('click', () => seleccionarArea(tab.dataset.area));

        tab.addEventListener('keydown', evento => {
            if (evento.key !== 'ArrowLeft' && evento.key !== 'ArrowRight') return;

            evento.preventDefault();
            const desplazamiento = evento.key === 'ArrowRight' ? 1 : -1;
            const siguienteIndice = (indice + desplazamiento + tabs.length) % tabs.length;
            const siguienteTab = tabs[siguienteIndice];

            siguienteTab.focus();
            seleccionarArea(siguienteTab.dataset.area);
        });
    });

    selectorModulo.addEventListener('change', evento => {
        cargarModulo(evento.target.value);
    });
}

function seleccionarArea(areaId, moduloPreferido = null) {
    const area = configuracionAreas[areaId];

    if (!area) {
        console.error(`No existe configuración para el área: ${areaId}`);
        return;
    }

    const modulosDisponibles = area.modulos.filter(moduloId => configuracionModulos[moduloId]);
    if (modulosDisponibles.length === 0) {
        console.error(`El área ${areaId} no tiene módulos configurados.`);
        return;
    }

    areaActiva = areaId;

    document.querySelectorAll('.area-tab[data-area]').forEach(tab => {
        const estaActiva = tab.dataset.area === areaId;
        tab.classList.toggle('active', estaActiva);
        tab.setAttribute('aria-pressed', String(estaActiva));
    });

    const selectorModulo = document.getElementById('selector-modulo');
    selectorModulo.innerHTML = modulosDisponibles.map(moduloId => {
        const modulo = configuracionModulos[moduloId];
        return `<option value="${moduloId}">${modulo.nombre}</option>`;
    }).join('');

    const moduloInicial = modulosDisponibles.includes(moduloPreferido)
        ? moduloPreferido
        : area.moduloInicial;

    selectorModulo.value = moduloInicial;
    cargarModulo(moduloInicial);
}

function cargarModulo(moduloId) {
    const configuracion = configuracionModulos[moduloId];

    if (!configuracion) {
        console.error(`No existe configuración para el módulo: ${moduloId}`);
        return;
    }

    if (configuracion.area !== areaActiva) {
        seleccionarArea(configuracion.area, moduloId);
        return;
    }

    document.querySelectorAll('.module-container').forEach(vista => {
        vista.classList.add('oculto');
        vista.setAttribute('aria-hidden', 'true');
    });

    const vistaActiva = document.getElementById(configuracion.vistaId);
    if (!vistaActiva) {
        console.error(`No se encontró la vista HTML: ${configuracion.vistaId}`);
        return;
    }

    vistaActiva.classList.remove('oculto');
    vistaActiva.setAttribute('aria-hidden', 'false');

    document.getElementById('selector-modulo').value = moduloId;
    document.getElementById('area-actual').textContent = configuracionAreas[configuracion.area].nombre;
    document.getElementById('modulo-actual').textContent = configuracion.nombre;

    if (configuracion.alCargar) {
        configuracion.alCargar();
    }
}

// ==========================================
// LÓGICA DE INVENTARIO (Lectura de Stock)
// ==========================================
async function obtenerProductosAPI() {
    const sesion = JSON.parse(localStorage.getItem("bizpilot_sesion"));
    const tablaBody = document.getElementById('tabla-productos-body');

    try {
        const respuesta = await fetch(`/api/productos/${sesion.id_empresa}`);
        const resultado = await respuesta.json();

        if (resultado.data.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="8" style="text-align: center;">No hay productos en inventario. Registra una compra para ingresar mercancía.</td></tr>`;
            return;
        }

        tablaBody.innerHTML = resultado.data.map(p => {
            const nombreProveedor = p.proveedores ? p.proveedores.nombre : 'Sin Proveedor';
            
            return `
            <tr>
                <td>${p.sku || '-'}</td>
                <td><strong>${p.nombre}</strong></td>
                <td><span style="color: #6b7280; font-size: 0.85rem;">${nombreProveedor}</span></td>
                <td>${p.categoria || '-'}</td>
                <td>$${p.precio_compra.toFixed(2)}</td>
                <td>$${p.precio_venta.toFixed(2)}</td>
                <td>${p.stock}</td>
                <td>
                    <span class="${p.stock <= p.stock_minimo ? 'badge-danger' : 'badge-success'}">
                        ${p.stock <= p.stock_minimo ? 'Stock Bajo' : 'Normal'}
                    </span>
                </td>
            </tr>
        `}).join('');

    } catch (error) {
        tablaBody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Error al cargar inventario.</td></tr>`;
    }
}

// ==========================================
// LÓGICA DEL PUNTO DE VENTA (POS)
// ==========================================
let productosCatalogo = [];
let carritoVenta = [];
let totalVenta = 0;
let proveedoresPOS = [];
let consecutivoVentaRapida = 0;

async function iniciarPOS() {
    await Promise.all([
        cargarProductosPOS(),
        cargarClientesPOS(),
        cargarProveedoresPOS()
    ]);
}

async function cargarProductosPOS() {
    const sesion = JSON.parse(localStorage.getItem("bizpilot_sesion"));
    const gridPOS = document.getElementById('pos-grid-productos');
    
    gridPOS.innerHTML = "<p>Cargando catálogo...</p>";
    
    try {
        const respuesta = await fetch(`/api/productos/${sesion.id_empresa}`);
        const resultado = await respuesta.json();
        
        productosCatalogo = resultado.data.filter(p => p.stock > 0);
        renderizarCatalogoPOS(productosCatalogo);
    } catch (error) {
        gridPOS.innerHTML = "<p>Error al cargar el catálogo.</p>";
    }
}

async function cargarClientesPOS() {
    const sesion = obtenerSesion();
    const selector = document.getElementById('pos-cliente');
    const selectorRapido = document.getElementById('venta-rapida-cliente');

    if (!selector || !sesion) return;

    selector.disabled = true;
    if (selectorRapido) selectorRapido.disabled = true;
    selector.innerHTML = '<option value="">Cargando clientes...</option>';

    try {
        const respuesta = await fetch(`/api/clientes/${sesion.id_empresa}`);
        const resultado = await respuesta.json();

        if (!respuesta.ok || resultado.status !== 'success') {
            throw new Error(resultado.detail || resultado.mensaje || 'No se pudieron cargar los clientes.');
        }

        const clientesActivos = (resultado.data || []).filter(cliente => cliente.activo);
        const opciones = [
            '<option value="">Público general</option>',
            ...clientesActivos.map(cliente => {
                const telefono = cliente.telefono
                    ? escaparHTML(cliente.telefono)
                    : 'Sin teléfono';
                return `<option
                    value="${cliente.id_cliente}"
                    data-nombre="${escaparHTML(cliente.nombre)}"
                    data-limite-credito="${Number(cliente.limite_credito || 0)}"
                    data-dias-credito="${Number(cliente.dias_credito || 0)}"
                >${escaparHTML(cliente.nombre)} · ${telefono}</option>`;
            })
        ].join('');
        selector.innerHTML = opciones;
        if (selectorRapido) selectorRapido.innerHTML = opciones;
    } catch (error) {
        console.error('Error al cargar clientes en el punto de venta:', error);
        selector.innerHTML = '<option value="">Público general</option>';
        if (selectorRapido) selectorRapido.innerHTML = '<option value="">Público general</option>';
    } finally {
        selector.disabled = false;
        if (selectorRapido) selectorRapido.disabled = false;
        actualizarCondicionesVenta();
    }
}

function sincronizarClienteVentaRapida(origen) {
    const selectorPOS = document.getElementById('pos-cliente');
    const selectorRapido = document.getElementById('venta-rapida-cliente');
    if (!selectorPOS || !selectorRapido) return;

    if (origen === 'rapida') {
        selectorPOS.value = selectorRapido.value;
        actualizarCondicionesVenta();
    } else {
        selectorRapido.value = selectorPOS.value;
    }
}

function mostrarAltaClienteRapido() {
    const panel = document.getElementById('venta-rapida-alta-cliente');
    panel.classList.remove('oculto');
    document.getElementById('venta-rapida-cliente-nombre').focus();
}

function ocultarAltaClienteRapido() {
    document.getElementById('venta-rapida-alta-cliente').classList.add('oculto');
    document.getElementById('venta-rapida-cliente-nombre').value = '';
}

async function guardarClienteRapido() {
    const sesion = obtenerSesion();
    const inputNombre = document.getElementById('venta-rapida-cliente-nombre');
    const boton = document.getElementById('btn-guardar-cliente-rapido');
    const nombre = inputNombre.value.trim();

    if (!sesion || !sesion.id_empresa) {
        alert('La sesión no es válida. Inicia sesión nuevamente.');
        return;
    }
    if (nombre.length < 2) {
        alert('Escribe un nombre de al menos 2 caracteres.');
        inputNombre.focus();
        return;
    }

    boton.disabled = true;
    boton.textContent = 'Guardando...';

    try {
        const respuesta = await fetch('/api/clientes/alta-rapida', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_empresa: sesion.id_empresa,
                nombre
            })
        });
        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.exito || !resultado.data?.id_cliente) {
            throw new Error(
                mensajeErrorAPI(resultado, 'No se pudo agregar el cliente al directorio.')
            );
        }

        const idCliente = String(resultado.data.id_cliente);
        await cargarClientesPOS();
        document.getElementById('pos-cliente').value = idCliente;
        document.getElementById('venta-rapida-cliente').value = idCliente;
        actualizarCondicionesVenta();
        ocultarAltaClienteRapido();
    } catch (error) {
        alert(error.message || 'Error de conexión al guardar el cliente.');
    } finally {
        boton.disabled = false;
        boton.textContent = 'Guardar cliente';
    }
}

async function cargarProveedoresPOS() {
    const sesion = obtenerSesion();
    const selector = document.getElementById('venta-rapida-proveedor');

    if (!sesion || !selector) return;

    selector.disabled = true;
    selector.innerHTML = '<option value="">Cargando proveedores...</option>';

    try {
        const respuesta = await fetch(`/api/proveedores/${sesion.id_empresa}`);
        const resultado = await respuesta.json();

        if (!respuesta.ok || resultado.status !== 'success') {
            throw new Error('No se pudieron cargar los proveedores.');
        }

        proveedoresPOS = resultado.data || [];
        selector.innerHTML = [
            '<option value="">Sin proveedor registrado</option>',
            ...proveedoresPOS.map(proveedor => (
                `<option value="${Number(proveedor.id_proveedor)}">${escaparHTML(proveedor.nombre)}</option>`
            ))
        ].join('');
    } catch (error) {
        console.error('Error al cargar proveedores para venta rápida:', error);
        proveedoresPOS = [];
        selector.innerHTML = '<option value="">Sin proveedor registrado</option>';
    } finally {
        selector.disabled = false;
    }
}

function mostrarVentaRapida() {
    const formulario = document.getElementById('form-venta-rapida');
    sincronizarClienteVentaRapida('pos');
    formulario.classList.remove('oculto');
    document.getElementById('venta-rapida-nombre').focus();
    formulario.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function ocultarVentaRapida() {
    document.getElementById('form-venta-rapida').classList.add('oculto');
    document.getElementById('formVentaRapida').reset();
    ocultarAltaClienteRapido();
    document.getElementById('venta-rapida-cantidad').value = '1';
    document.getElementById('venta-rapida-costo').value = '0';
    document.getElementById('venta-rapida-guardar-producto').checked = true;
    document.getElementById('venta-rapida-producto-estado').textContent =
        'Se guardará con SKU automático y existencia inicial de 0.';
}

async function agregarVentaRapida(event) {
    event.preventDefault();

    const sesion = obtenerSesion();
    const nombre = document.getElementById('venta-rapida-nombre').value.trim();
    const cantidad = Number(document.getElementById('venta-rapida-cantidad').value);
    const precioVenta = Number(document.getElementById('venta-rapida-precio').value);
    const costoUnitario = Number(document.getElementById('venta-rapida-costo').value || 0);
    const proveedorValor = document.getElementById('venta-rapida-proveedor').value;
    const idProveedor = proveedorValor ? Number(proveedorValor) : null;
    const lugarCompra = document.getElementById('venta-rapida-lugar').value.trim() || null;
    const guardarEnInventario = document.getElementById('venta-rapida-guardar-producto').checked;
    const botonAgregar = document.getElementById('btn-agregar-venta-rapida');
    const estadoProducto = document.getElementById('venta-rapida-producto-estado');

    if (!sesion || !sesion.id_empresa) {
        alert('La sesión no es válida. Inicia sesión nuevamente.');
        return;
    }
    if (!nombre) {
        alert('Escribe el nombre del producto.');
        return;
    }
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
        alert('La cantidad debe ser un número entero mayor a cero.');
        return;
    }
    if (!Number.isFinite(precioVenta) || precioVenta <= 0) {
        alert('El precio de venta debe ser mayor a cero.');
        return;
    }
    if (!Number.isFinite(costoUnitario) || costoUnitario < 0) {
        alert('El costo unitario no es válido.');
        return;
    }

    botonAgregar.disabled = true;
    botonAgregar.textContent = guardarEnInventario
        ? 'Guardando producto...'
        : 'Agregando...';

    try {
        let productoCatalogado = false;
        let productoCreado = false;

        if (guardarEnInventario) {
            const respuesta = await fetch('/api/productos/alta-rapida', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_empresa: sesion.id_empresa,
                    nombre,
                    precio_venta: precioVenta,
                    precio_compra: costoUnitario,
                    id_proveedor: idProveedor
                })
            });
            const resultado = await respuesta.json();

            if (!respuesta.ok || !resultado.exito || !resultado.data?.id_producto) {
                throw new Error(
                    mensajeErrorAPI(resultado, 'No se pudo agregar el producto al inventario.')
                );
            }

            const stockExistente = Number(resultado.data.stock || 0);
            if (!resultado.creado && stockExistente > 0) {
                throw new Error(
                    `El producto ya existe con ${stockExistente} unidad(es). Agrégalo desde el catálogo para descontar su inventario.`
                );
            }

            productoCatalogado = true;
            productoCreado = Boolean(resultado.creado);
            estadoProducto.textContent = productoCreado
                ? 'Producto agregado al inventario con existencia 0.'
                : 'El producto ya estaba en inventario con existencia 0.';
        }

        sincronizarClienteVentaRapida('rapida');

        consecutivoVentaRapida += 1;
        const proveedor = proveedoresPOS.find(
            item => Number(item.id_proveedor) === idProveedor
        );

        carritoVenta.push({
            clave_item: `rapida-${consecutivoVentaRapida}`,
            tipo_item: 'Rapida',
            id_producto: null,
            nombre,
            cantidad,
            precio_venta: precioVenta,
            costo_unitario: costoUnitario,
            id_proveedor: idProveedor,
            proveedor_nombre: proveedor?.nombre || null,
            lugar_compra: lugarCompra,
            subtotal: cantidad * precioVenta,
            stock_maximo: null,
            catalogado_en_inventario: productoCatalogado,
            producto_recien_creado: productoCreado
        });

        ocultarVentaRapida();
        actualizarVistaCarrito();
    } catch (error) {
        alert(error.message || 'No se pudo agregar la venta rápida.');
    } finally {
        botonAgregar.disabled = false;
        botonAgregar.textContent = 'Agregar al ticket';
    }
}

function renderizarCatalogoPOS(productos) {
    const gridPOS = document.getElementById('pos-grid-productos');
    
    if(productos.length === 0) {
        gridPOS.innerHTML = "<p style='grid-column: 1 / -1; text-align: center; color: #6b7280;'>No hay productos con stock disponible.</p>";
        return;
    }

    gridPOS.innerHTML = productos.map(p => {
        const nombreProveedor = p.proveedores ? p.proveedores.nombre : 'Sin proveedor';
        return `
        <div class="pos-card" onclick="agregarAlCarrito(${Number(p.id_producto)})">
            <h4>${escaparHTML(p.nombre)}</h4>
            <p style="font-size: 0.75rem; color: #6b7280; margin: 0 0 0.5rem 0;">Prov: ${escaparHTML(nombreProveedor)}</p>
            <p>$${Number(p.precio_venta).toFixed(2)}</p>
            <small>Stock: ${Number(p.stock)} | ${escaparHTML(p.sku || 'Sin SKU')}</small>
        </div>
    `}).join('');
}

function filtrarPOS() {
    const texto = document.getElementById('pos-buscador').value.toLowerCase();
    const filtrados = productosCatalogo.filter(p => 
        p.nombre.toLowerCase().includes(texto) || (p.sku && p.sku.toLowerCase().includes(texto))
    );
    renderizarCatalogoPOS(filtrados);
}

function agregarAlCarrito(idProducto) {
    const producto = productosCatalogo.find(
        item => Number(item.id_producto) === Number(idProducto)
    );
    if (!producto) {
        alert('El producto ya no está disponible. Actualiza el catálogo.');
        return;
    }

    const existe = carritoVenta.find(
        item => item.tipo_item === 'Inventario'
            && Number(item.id_producto) === Number(idProducto)
    );
    const stockMaximo = Number(producto.stock);
    
    if (existe) {
        if(existe.cantidad < stockMaximo) {
            existe.cantidad += 1;
            existe.subtotal = existe.cantidad * existe.precio_venta;
        } else {
            alert("No hay suficiente stock en almacén.");
        }
    } else {
        carritoVenta.push({
            clave_item: `inventario-${Number(producto.id_producto)}`,
            tipo_item: 'Inventario',
            id_producto: Number(producto.id_producto),
            nombre: producto.nombre,
            cantidad: 1,
            precio_venta: Number(producto.precio_venta),
            costo_unitario: Number(producto.precio_compra || 0),
            id_proveedor: null,
            lugar_compra: null,
            subtotal: Number(producto.precio_venta),
            stock_maximo: stockMaximo
        });
    }
    
    actualizarVistaCarrito();
}

function cambiarCantidadManual(claveItem, nuevaCantidad) {
    const item = carritoVenta.find(i => i.clave_item === claveItem);
    if (!item) return;

    let cant = parseInt(nuevaCantidad);
    if (isNaN(cant) || cant <= 0) {
        carritoVenta = carritoVenta.filter(i => i.clave_item !== claveItem);
    } else if (item.tipo_item === 'Inventario' && cant > item.stock_maximo) {
        alert("La cantidad ingresada supera el stock disponible (" + item.stock_maximo + ")");
        item.cantidad = item.stock_maximo;
        item.subtotal = item.cantidad * item.precio_venta;
    } else {
        item.cantidad = cant;
        item.subtotal = item.cantidad * item.precio_venta;
    }
    
    actualizarVistaCarrito();
}

function ajustarCantidad(claveItem, delta) {
    const item = carritoVenta.find(i => i.clave_item === claveItem);
    if (item) {
        cambiarCantidadManual(claveItem, item.cantidad + delta);
    }
}

function actualizarCondicionesVenta() {
    const tipoVenta = document.getElementById('pos-tipo-venta')?.value || 'Contado';
    const clienteSelect = document.getElementById('pos-cliente');
    const opcionCliente = clienteSelect?.options[clienteSelect.selectedIndex];
    const zonaCredito = document.getElementById('zona-credito-venta');
    const etiquetaMetodo = document.getElementById('pos-metodo-pago-label');

    if (tipoVenta === 'Credito') {
        zonaCredito.classList.remove('oculto');
        etiquetaMetodo.textContent = 'Método del abono inicial';

        const nombre = opcionCliente?.dataset.nombre;
        const limite = Number(opcionCliente?.dataset.limiteCredito || 0);
        const dias = Number(opcionCliente?.dataset.diasCredito || 0);

        document.getElementById('pos-credito-cliente').textContent = nombre
            ? nombre
            : 'Selecciona un cliente con crédito autorizado';
        document.getElementById('pos-credito-condiciones').textContent = nombre
            ? `Límite configurado: ${formatearMoneda(limite)} · Plazo: ${dias} días`
            : 'Público general no puede comprar a crédito.';
    } else {
        zonaCredito.classList.add('oculto');
        etiquetaMetodo.textContent = 'Método de pago';
    }

    toggleCambio();
    actualizarResumenCreditoVenta();
}

function actualizarResumenCreditoVenta() {
    const abonoInicial = Number(document.getElementById('pos-abono-inicial')?.value || 0);
    const saldo = Math.max(totalVenta - abonoInicial, 0);
    const resumen = document.getElementById('pos-credito-resumen');
    if (resumen) resumen.textContent = `Saldo por cobrar: ${formatearMoneda(saldo)}`;
}

function toggleCambio() {
    const metodoPago = document.getElementById('pos-metodo-pago').value;
    const tipoVenta = document.getElementById('pos-tipo-venta')?.value || 'Contado';
    const zonaCambio = document.getElementById('zona-cambio');
    const inputEfectivo = document.getElementById('pos-efectivo-recibido');
    const spanCambio = document.getElementById('pos-cambio-monto');

    if (tipoVenta === 'Contado' && metodoPago === 'Efectivo') {
        zonaCambio.style.display = 'block';
    } else {
        zonaCambio.style.display = 'none';
        if(inputEfectivo) inputEfectivo.value = '';
        if(spanCambio) spanCambio.innerText = '0.00';
    }
}

function calcularCambio() {
    const inputEfectivo = document.getElementById('pos-efectivo-recibido');
    if (!inputEfectivo) return;
    
    const recibido = parseFloat(inputEfectivo.value) || 0;
    const spanCambio = document.getElementById('pos-cambio-monto');
    
    let cambio = recibido - totalVenta;
    
    if (cambio < 0 || totalVenta === 0) {
        cambio = 0;
    }
    
    spanCambio.innerText = cambio.toFixed(2);
}

function actualizarVistaCarrito() {
    const listaCarrito = document.getElementById('pos-lista-carrito');
    const labelTotal = document.getElementById('pos-total-monto');
    
    if (carritoVenta.length === 0) {
        listaCarrito.innerHTML = '<p style="text-align:center; color:#9ca3af; margin-top:2rem;">El carrito está vacío</p>';
        labelTotal.innerText = "0.00";
        totalVenta = 0;
        calcularCambio();
        actualizarResumenCreditoVenta();
        return;
    }

    totalVenta = carritoVenta.reduce((sum, item) => sum + item.subtotal, 0);
    labelTotal.innerText = totalVenta.toFixed(2);
    calcularCambio(); 
    actualizarResumenCreditoVenta();

    listaCarrito.innerHTML = carritoVenta.map(item => {
        const esRapida = item.tipo_item === 'Rapida';
        const origen = item.proveedor_nombre
            || item.lugar_compra
            || 'Sin origen registrado';

        return `
            <div class="carrito-item ${esRapida ? 'quick-cart-item' : ''}">
                <div class="carrito-info">
                    <div class="cart-item-heading">
                        <h4>${escaparHTML(item.nombre)}</h4>
                        <span class="${esRapida ? 'badge-warning' : 'badge-neutral'}">
                            ${esRapida ? 'Venta rápida' : 'Inventario'}
                        </span>
                    </div>
                    ${esRapida ? `<p>Origen: ${escaparHTML(origen)}</p>` : ''}
                    ${esRapida && item.catalogado_en_inventario
                        ? `<p>Inventario: ${item.producto_recien_creado ? 'producto nuevo con existencia 0' : 'producto ya registrado con existencia 0'}</p>`
                        : ''}
                    <div class="carrito-cantidad-control">
                        <button type="button" class="btn-cant" onclick="ajustarCantidad('${item.clave_item}', -1)">-</button>
                        <input type="number" min="1" step="1" class="input-cant-manual" value="${item.cantidad}" onchange="cambiarCantidadManual('${item.clave_item}', this.value)">
                        <button type="button" class="btn-cant" onclick="ajustarCantidad('${item.clave_item}', 1)">+</button>
                        <small style="margin-left: 5px; color: #6b7280;">x $${Number(item.precio_venta).toFixed(2)}</small>
                    </div>
                </div>
                <div class="carrito-precio">
                    $${Number(item.subtotal).toFixed(2)}
                </div>
            </div>
        `;
    }).join('');
}

function limpiarCarrito() {
    carritoVenta = [];
    ocultarVentaRapida();
    document.getElementById('pos-cliente').value = '';
    document.getElementById('pos-tipo-venta').value = 'Contado';
    document.getElementById('pos-metodo-pago').value = 'Efectivo';
    document.getElementById('pos-abono-inicial').value = '0';
    if(document.getElementById('pos-efectivo-recibido')) {
        document.getElementById('pos-efectivo-recibido').value = '';
    }
    actualizarCondicionesVenta();
    actualizarVistaCarrito();
}

async function procesarVenta() {
    if (carritoVenta.length === 0) {
        alert("El ticket está vacío.");
        return;
    }

    const metodoPagoInput = document.getElementById('pos-metodo-pago').value;
    const tipoVenta = document.getElementById('pos-tipo-venta').value;
    const clienteSelect = document.getElementById('pos-cliente');
    const idCliente = clienteSelect.value ? Number(clienteSelect.value) : null;
    const opcionCliente = clienteSelect.options[clienteSelect.selectedIndex];
    const clienteNombre = idCliente ? opcionCliente.dataset.nombre : null;
    let montoInicial = tipoVenta === 'Credito'
        ? Number(document.getElementById('pos-abono-inicial').value || 0)
        : totalVenta;

    if (tipoVenta === 'Contado' && metodoPagoInput === 'Efectivo') {
        const recibido = parseFloat(document.getElementById('pos-efectivo-recibido').value);
        if (!Number.isFinite(recibido) || recibido < totalVenta) {
            alert("Ingresa un monto de efectivo igual o mayor al total de la venta.");
            return;
        }
    }

    if (tipoVenta === 'Credito') {
        const limiteCredito = Number(opcionCliente?.dataset.limiteCredito || 0);
        const diasCredito = Number(opcionCliente?.dataset.diasCredito || 0);

        if (!idCliente) {
            alert("Para vender a crédito debes seleccionar un cliente.");
            return;
        }

        if (limiteCredito <= 0 || diasCredito <= 0) {
            alert("El cliente seleccionado no tiene una línea de crédito configurada.");
            return;
        }

        if (!Number.isFinite(montoInicial) || montoInicial < 0) {
            alert("El abono inicial no es válido.");
            return;
        }

        if (montoInicial >= totalVenta) {
            alert("Si se pagará el total, registra la venta como Contado.");
            return;
        }
    }

    const sesion = JSON.parse(localStorage.getItem("bizpilot_sesion"));
    const btnCobrar = document.querySelector('#vista-ventas .pos-btn-cobrar');

    btnCobrar.innerText = "Procesando...";
    btnCobrar.disabled = true;
    
    const carritoAPI = carritoVenta.map(item => ({
        tipo_item: item.tipo_item,
        id_producto: item.id_producto,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio_venta: item.precio_venta,
        costo_unitario: item.costo_unitario || 0,
        id_proveedor: item.id_proveedor || null,
        lugar_compra: item.lugar_compra || null,
        subtotal: item.subtotal
    }));

    const datosVenta = {
        id_empresa: sesion.id_empresa,
        total: totalVenta,
        id_cliente: idCliente,
        cliente: clienteNombre,
        tipo_venta: tipoVenta,
        monto_inicial: montoInicial,
        metodo_pago: metodoPagoInput,
        carrito: carritoAPI
    };

    try {
        const respuesta = await fetch('/api/ventas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosVenta)
        });

        const resultado = await respuesta.json();

        if (resultado.exito) {
            const contieneVentaRapida = carritoVenta.some(
                item => item.tipo_item === 'Rapida'
            );
            const mensaje = tipoVenta === 'Credito'
                ? "Venta a crédito registrada. La cuenta ya aparece en Finanzas → Cuentas por cobrar."
                : contieneVentaRapida
                    ? "Venta procesada. Solo los productos de inventario descontaron existencias."
                    : "Venta procesada con éxito. El stock se ha descontado.";
            alert(mensaje);
            limpiarCarrito();
            iniciarPOS(); 
        } else {
            alert(resultado.mensaje);
        }
    } catch (error) {
        alert("Error de conexión al procesar el cobro.");
    } finally {
        btnCobrar.innerText = "Vender";
        btnCobrar.disabled = false;
    }
}

// ==========================================
// LÓGICA DE HISTORIAL DE VENTAS
// ==========================================
async function obtenerHistorialVentasAPI() {
    const sesion = JSON.parse(localStorage.getItem("bizpilot_sesion"));
    const tablaBody = document.getElementById('tabla-historial-body');
    
    tablaBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Cargando historial...</td></tr>`;

    try {
        const respuesta = await fetch(`/api/ventas/${sesion.id_empresa}`);
        const resultado = await respuesta.json();

        if (resultado.data && resultado.data.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No hay ventas registradas.</td></tr>`;
            return;
        }

        tablaBody.innerHTML = resultado.data.map(v => {
            const fechaObj = new Date(v.fecha);
            const fechaFmt = fechaObj.toLocaleDateString() + ' ' + fechaObj.toLocaleTimeString();
            const esCreditoPendiente = v.tipo_venta === 'Credito' && v.estado_pago !== 'Pagado';
            const estado = esCreditoPendiente ? 'Crédito pendiente' : 'Completada';
            const claseEstado = esCreditoPendiente ? 'badge-danger' : 'badge-success';
            
            return `
            <tr>
                <td><strong># ${v.id_venta}</strong></td>
                <td>${fechaFmt}</td>
                <td>${v.cliente ? escaparHTML(v.cliente) : 'Público general'}</td>
                <td><strong>${formatearMoneda(v.total)}</strong></td>
                <td><span class="${claseEstado}">${estado}</span></td>
            </tr>
        `}).join('');

    } catch (error) {
        tablaBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Error al cargar el historial.</td></tr>`;
    }
}

// ==========================================
// LÓGICA DE CLIENTES
// ==========================================
let clientesCatalogo = [];
let clienteEditandoId = null;
let comprasClientesGlobal = [];

function normalizarBusqueda(valor) {
    return String(valor ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function mensajeErrorAPI(resultado, mensajePredeterminado) {
    if (resultado && typeof resultado.mensaje === 'string') return resultado.mensaje;
    if (resultado && typeof resultado.detail === 'string') return resultado.detail;
    if (resultado && Array.isArray(resultado.detail)) {
        return resultado.detail.map(error => error.msg).join('\n');
    }
    return mensajePredeterminado;
}

function mostrarFormularioCliente(idCliente = null) {
    const contenedor = document.getElementById('form-cliente-container');
    const formulario = document.getElementById('formCliente');
    const titulo = document.getElementById('form-cliente-titulo');
    const botonGuardar = document.getElementById('btn-guardar-cliente');

    formulario.reset();
    clienteEditandoId = idCliente === null ? null : Number(idCliente);

    if (clienteEditandoId === null) {
        titulo.textContent = 'Registrar Cliente';
        botonGuardar.textContent = 'Guardar Cliente';
        document.getElementById('cliente-limite-credito').value = '0';
        document.getElementById('cliente-dias-credito').value = '0';
        document.getElementById('cliente-activo').value = 'true';
    } else {
        const cliente = clientesCatalogo.find(item => item.id_cliente === clienteEditandoId);
        if (!cliente) {
            alert('No se encontró el cliente seleccionado. Actualiza el directorio e inténtalo de nuevo.');
            return;
        }

        titulo.textContent = `Editar Cliente #${cliente.id_cliente}`;
        botonGuardar.textContent = 'Guardar Cambios';
        document.getElementById('cliente-nombre').value = cliente.nombre || '';
        document.getElementById('cliente-telefono').value = cliente.telefono || '';
        document.getElementById('cliente-email').value = cliente.email || '';
        document.getElementById('cliente-rfc').value = cliente.rfc || '';
        document.getElementById('cliente-tipo').value = cliente.tipo_cliente || 'Minorista';
        document.getElementById('cliente-limite-credito').value = Number(cliente.limite_credito || 0);
        document.getElementById('cliente-dias-credito').value = String(cliente.dias_credito || 0);
        document.getElementById('cliente-activo').value = String(Boolean(cliente.activo));
    }

    contenedor.classList.remove('oculto');
    document.getElementById('cliente-nombre').focus();
    contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function ocultarFormularioCliente() {
    document.getElementById('form-cliente-container').classList.add('oculto');
    document.getElementById('formCliente').reset();
    clienteEditandoId = null;
}

async function obtenerClientesAPI() {
    const sesion = obtenerSesion();
    const tablaBody = document.getElementById('tabla-clientes-body');

    if (!sesion || !tablaBody) return;

    tablaBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Cargando clientes...</td></tr>';

    try {
        const respuesta = await fetch(`/api/clientes/${sesion.id_empresa}`);
        const resultado = await respuesta.json();

        if (!respuesta.ok || resultado.status !== 'success') {
            throw new Error(mensajeErrorAPI(resultado, 'No se pudieron consultar los clientes.'));
        }

        clientesCatalogo = resultado.data || [];
        filtrarClientes();
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        clientesCatalogo = [];
        tablaBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #991b1b;">No se pudo cargar el directorio de clientes.</td></tr>';
        document.getElementById('clientes-resumen').textContent = '';
    }

    actualizarSelectorComprasClientes();
    await obtenerComprasClientesAPI();
}

function filtrarClientes() {
    const texto = normalizarBusqueda(document.getElementById('cliente-busqueda').value);
    const tipo = document.getElementById('cliente-filtro-tipo').value;
    const estado = document.getElementById('cliente-filtro-estado').value;

    const filtrados = clientesCatalogo.filter(cliente => {
        const coincideTexto = !texto || [
            cliente.nombre,
            cliente.telefono,
            cliente.email,
            cliente.rfc
        ].some(valor => normalizarBusqueda(valor).includes(texto));

        const coincideTipo = tipo === 'todos' || cliente.tipo_cliente === tipo;
        const coincideEstado = estado === 'todos'
            || (estado === 'activos' && cliente.activo)
            || (estado === 'inactivos' && !cliente.activo);

        return coincideTexto && coincideTipo && coincideEstado;
    });

    renderizarClientes(filtrados);
}

function renderizarClientes(clientes) {
    const tablaBody = document.getElementById('tabla-clientes-body');
    const resumen = document.getElementById('clientes-resumen');

    resumen.textContent = `${clientes.length} de ${clientesCatalogo.length} cliente(s)`;

    if (clientes.length === 0) {
        tablaBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No hay clientes que coincidan con los filtros.</td></tr>';
        return;
    }

    tablaBody.innerHTML = clientes.map(cliente => {
        const limite = Number(cliente.limite_credito || 0).toLocaleString('es-MX', {
            style: 'currency',
            currency: 'MXN'
        });
        const condicionCredito = cliente.dias_credito > 0 && Number(cliente.limite_credito) > 0
            ? `${limite} · ${cliente.dias_credito} días`
            : 'Sin crédito';
        const accionEstado = cliente.activo ? 'Desactivar' : 'Activar';

        return `
            <tr>
                <td><strong>#${cliente.id_cliente}</strong></td>
                <td><strong>${escaparHTML(cliente.nombre)}</strong></td>
                <td>
                    <div class="client-contact">
                        <span>${cliente.telefono ? escaparHTML(cliente.telefono) : 'Sin teléfono'}</span>
                        <small>${cliente.email ? escaparHTML(cliente.email) : 'Sin correo'}</small>
                    </div>
                </td>
                <td>${cliente.rfc ? escaparHTML(cliente.rfc) : '-'}</td>
                <td>${escaparHTML(cliente.tipo_cliente)}</td>
                <td>${escaparHTML(condicionCredito)}</td>
                <td><span class="${cliente.activo ? 'badge-success' : 'badge-neutral'}">${cliente.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <div class="table-actions">
                        <button type="button" class="btn-table btn-table-edit" onclick="mostrarFormularioCliente(${cliente.id_cliente})">Editar</button>
                        <button type="button" class="btn-table btn-table-state" onclick="cambiarEstadoCliente(${cliente.id_cliente})">${accionEstado}</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function actualizarSelectorComprasClientes() {
    const selector = document.getElementById('compras-clientes-filtro-cliente');
    if (!selector) return;

    const seleccionAnterior = selector.value;
    const clientes = new Map();

    clientesCatalogo.forEach(cliente => {
        clientes.set(String(cliente.id_cliente), cliente.nombre);
    });

    comprasClientesGlobal.forEach(venta => {
        if (venta.id_cliente) {
            clientes.set(
                String(venta.id_cliente),
                venta.cliente || `Cliente ${venta.id_cliente}`
            );
        }
    });

    selector.innerHTML = [
        '<option value="todos">Todos los clientes</option>',
        ...Array.from(clientes.entries())
            .sort((a, b) => String(a[1]).localeCompare(String(b[1]), 'es'))
            .map(([idCliente, nombre]) => (
                `<option value="${idCliente}">${escaparHTML(nombre)}</option>`
            ))
    ].join('');

    selector.value = Array.from(selector.options).some(
        opcion => opcion.value === seleccionAnterior
    ) ? seleccionAnterior : 'todos';
}

function productosDeCompraCliente(venta) {
    return (venta.ventas_detalle || []).map(detalle => ({
        nombre: detalle.nombre_producto
            || detalle.productos?.nombre
            || 'Producto histórico',
        cantidad: Number(detalle.cantidad || 0),
        tipo: detalle.tipo_item || 'Inventario',
        precio_unitario: Number(detalle.precio_unitario || 0),
        subtotal: Number(
            detalle.subtotal
            || Number(detalle.cantidad || 0) * Number(detalle.precio_unitario || 0)
        )
    }));
}

async function obtenerComprasClientesAPI() {
    const sesion = obtenerSesion();
    const tabla = document.getElementById('tabla-compras-clientes-body');

    if (!sesion || !tabla) return;

    tabla.innerHTML = '<tr><td colspan="6" style="text-align:center;">Cargando compras de clientes...</td></tr>';

    try {
        const respuesta = await fetch(`/api/clientes/${sesion.id_empresa}/compras`);
        const resultado = await respuesta.json();

        if (!respuesta.ok || resultado.status !== 'success') {
            throw new Error(
                mensajeErrorAPI(resultado, 'No se pudieron consultar las compras de clientes.')
            );
        }

        comprasClientesGlobal = resultado.data || [];
        actualizarSelectorComprasClientes();
        filtrarComprasClientes();
    } catch (error) {
        console.error('Error al cargar compras de clientes:', error);
        comprasClientesGlobal = [];
        actualizarResumenComprasClientes([]);
        document.getElementById('compras-clientes-resumen').textContent = '';
        tabla.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; color:#991b1b;">
                    No se pudo cargar el historial. Ejecuta migracion_operaciones_finanzas_20260810.sql.
                </td>
            </tr>
        `;
    }
}

function filtrarComprasClientes() {
    const selector = document.getElementById('compras-clientes-filtro-cliente');
    if (!selector) return;

    const idCliente = selector.value;
    const fechaInicio = document.getElementById('compras-clientes-fecha-inicio').value;
    const fechaFin = document.getElementById('compras-clientes-fecha-fin').value;
    const texto = normalizarBusqueda(
        document.getElementById('compras-clientes-busqueda').value
    );

    const filtradas = comprasClientesGlobal.filter(venta => {
        const fechaVenta = String(venta.fecha || '').slice(0, 10);
        const productos = productosDeCompraCliente(venta);
        const contenido = [
            venta.id_venta,
            venta.cliente,
            ...productos.map(producto => producto.nombre)
        ].map(normalizarBusqueda).join(' ');

        return (
            (idCliente === 'todos' || String(venta.id_cliente) === idCliente)
            && (!fechaInicio || fechaVenta >= fechaInicio)
            && (!fechaFin || fechaVenta <= fechaFin)
            && (!texto || contenido.includes(texto))
        );
    });

    actualizarResumenComprasClientes(filtradas);
    renderizarComprasClientes(filtradas);
}

function actualizarResumenComprasClientes(ventas) {
    const hoy = claveFechaLocalCXC(new Date());
    const resumen = ventas.reduce(
        (acumulado, venta) => {
            acumulado.total += Number(venta.total || 0);
            if (claveFechaLocalCXC(venta.fecha) === hoy) {
                acumulado.totalHoy += Number(venta.total || 0);
            }
            acumulado.articulos += productosDeCompraCliente(venta).reduce(
                (suma, producto) => suma + producto.cantidad,
                0
            );
            return acumulado;
        },
        { total: 0, totalHoy: 0, articulos: 0 }
    );

    document.getElementById('compras-clientes-total').textContent = formatearMoneda(resumen.total);
    document.getElementById('compras-clientes-tickets').textContent = ventas.length;
    document.getElementById('compras-clientes-articulos').textContent = resumen.articulos;
    document.getElementById('compras-clientes-hoy').textContent = formatearMoneda(resumen.totalHoy);
}

function renderizarComprasClientes(ventas) {
    const tabla = document.getElementById('tabla-compras-clientes-body');
    const resumen = document.getElementById('compras-clientes-resumen');

    resumen.textContent = `${ventas.length} de ${comprasClientesGlobal.length} compra(s)`;

    if (ventas.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    No hay compras que coincidan con los filtros.
                </td>
            </tr>
        `;
        return;
    }

    tabla.innerHTML = ventas.map(venta => {
        const productos = productosDeCompraCliente(venta);
        const listaProductos = productos.length
            ? productos.map(producto => `
                <span class="client-product-line">
                    <strong>${escaparHTML(producto.nombre)}</strong>
                    <span>${producto.cantidad} × ${formatearMoneda(producto.precio_unitario)} = <strong>${formatearMoneda(producto.subtotal)}</strong></span>
                    ${producto.tipo === 'Rapida' ? '<small>Venta rápida</small>' : ''}
                </span>
            `).join('')
            : '<span>Sin detalle disponible</span>';

        return `
            <tr>
                <td>${formatearFechaCXC(venta.fecha, true)}</td>
                <td><strong>${escaparHTML(venta.cliente || 'Cliente sin nombre')}</strong></td>
                <td>#${Number(venta.id_venta)}</td>
                <td><div class="client-product-list">${listaProductos}</div></td>
                <td>
                    <span class="${venta.tipo_venta === 'Credito' ? 'badge-warning' : 'badge-success'}">
                        ${venta.tipo_venta === 'Credito' ? 'Crédito' : 'Contado'}
                    </span>
                </td>
                <td><strong>${formatearMoneda(venta.total)}</strong></td>
            </tr>
        `;
    }).join('');
}

function restablecerFiltrosComprasClientes() {
    document.getElementById('compras-clientes-filtro-cliente').value = 'todos';
    document.getElementById('compras-clientes-fecha-inicio').value = '';
    document.getElementById('compras-clientes-fecha-fin').value = '';
    document.getElementById('compras-clientes-busqueda').value = '';
    filtrarComprasClientes();
}

async function guardarCliente(event) {
    event.preventDefault();

    const sesion = obtenerSesion();
    const limiteCredito = Number(document.getElementById('cliente-limite-credito').value || 0);
    const diasCredito = Number(document.getElementById('cliente-dias-credito').value || 0);

    if ((limiteCredito > 0) !== (diasCredito > 0)) {
        alert('Para autorizar crédito debes indicar tanto un límite mayor a cero como un plazo. Para contado, deja ambos en cero.');
        return;
    }

    const datosCliente = {
        id_empresa: sesion.id_empresa,
        nombre: document.getElementById('cliente-nombre').value.trim(),
        telefono: document.getElementById('cliente-telefono').value.trim(),
        email: document.getElementById('cliente-email').value.trim() || null,
        rfc: document.getElementById('cliente-rfc').value.trim().toUpperCase() || null,
        tipo_cliente: document.getElementById('cliente-tipo').value,
        limite_credito: limiteCredito,
        dias_credito: diasCredito,
        activo: document.getElementById('cliente-activo').value === 'true'
    };

    const esEdicion = clienteEditandoId !== null;
    const ruta = esEdicion ? `/api/clientes/${clienteEditandoId}` : '/api/clientes';
    const metodo = esEdicion ? 'PUT' : 'POST';
    const botonGuardar = document.getElementById('btn-guardar-cliente');
    const textoOriginal = botonGuardar.textContent;

    botonGuardar.disabled = true;
    botonGuardar.textContent = esEdicion ? 'Actualizando...' : 'Guardando...';

    try {
        const respuesta = await fetch(ruta, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosCliente)
        });
        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.exito) {
            throw new Error(mensajeErrorAPI(resultado, 'No se pudo guardar el cliente.'));
        }

        ocultarFormularioCliente();
        await obtenerClientesAPI();
    } catch (error) {
        alert(error.message || 'Error de conexión al guardar el cliente.');
    } finally {
        botonGuardar.disabled = false;
        botonGuardar.textContent = textoOriginal;
    }
}

async function cambiarEstadoCliente(idCliente) {
    const cliente = clientesCatalogo.find(item => item.id_cliente === Number(idCliente));
    const sesion = obtenerSesion();

    if (!cliente || !sesion) return;

    const nuevoEstado = !cliente.activo;
    const verbo = nuevoEstado ? 'activar' : 'desactivar';

    if (!window.confirm(`¿Deseas ${verbo} a ${cliente.nombre}?`)) return;

    try {
        const respuesta = await fetch(`/api/clientes/${cliente.id_cliente}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_empresa: sesion.id_empresa,
                activo: nuevoEstado
            })
        });
        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.exito) {
            throw new Error(mensajeErrorAPI(resultado, `No se pudo ${verbo} el cliente.`));
        }

        await obtenerClientesAPI();
    } catch (error) {
        alert(error.message || `Error de conexión al ${verbo} el cliente.`);
    }
}

// ==========================================
// LÓGICA DE PROVEEDORES
// ==========================================
function mostrarFormularioProveedor() {
    document.getElementById('form-proveedor-container').classList.remove('oculto');
}

function ocultarFormularioProveedor() {
    document.getElementById('form-proveedor-container').classList.add('oculto');
    document.getElementById('formProveedor').reset();
}

async function obtenerProveedoresAPI() {
    const sesion = JSON.parse(localStorage.getItem("bizpilot_sesion"));
    const tablaBody = document.getElementById('tabla-proveedores-body');
    
    tablaBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Cargando proveedores...</td></tr>`;

    try {
        const respuesta = await fetch(`/api/proveedores/${sesion.id_empresa}`);
        const resultado = await respuesta.json();

        if (resultado.data.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No hay proveedores registrados.</td></tr>`;
            return;
        }

        tablaBody.innerHTML = resultado.data.map(p => `
            <tr>
                <td><strong>#${p.id_proveedor}</strong></td>
                <td>${p.nombre}</td>
                <td>${p.contacto || '-'}</td>
                <td>${p.telefono || '-'}</td>
                <td>${p.email || '-'}</td>
                <td><span class="${p.permite_credito ? 'badge-success' : 'badge-neutral'}">${p.permite_credito ? 'Crédito' : 'Contado'}</span></td>
            </tr>
        `).join('');

    } catch (error) {
        tablaBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Error al cargar proveedores.</td></tr>`;
    }
}

async function guardarProveedor(event) {
    event.preventDefault();
    const sesion = JSON.parse(localStorage.getItem("bizpilot_sesion"));
    
    // Capturamos si permite crédito o no
    const provCreditoSelect = document.getElementById('prov-credito');
    const permiteCredito = provCreditoSelect ? (provCreditoSelect.value === 'true') : false;

    const nuevoProveedor = {
        id_empresa: sesion.id_empresa,
        nombre: document.getElementById('prov-nombre').value,
        contacto: document.getElementById('prov-contacto').value,
        telefono: document.getElementById('prov-telefono').value,
        email: document.getElementById('prov-email').value,
        permite_credito: permiteCredito
    };

    try {
        const respuesta = await fetch('/api/proveedores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoProveedor)
        });

        const resultado = await respuesta.json();

        if (resultado.exito) {
            ocultarFormularioProveedor();
            obtenerProveedoresAPI();
        } else {
            alert(resultado.mensaje);
        }
    } catch (error) {
        alert("Error de conexión al guardar el proveedor.");
    }
}

// ==========================================
// LÓGICA DE REGISTRO DE COMPRAS
// ==========================================
let compraProductosCatalogo = [];
let compraCarrito = [];
let compraTotal = 0;

function toggleCamposCreditoCompra() {
    const tipoSelect = document.getElementById('compra-tipo');
    if (!tipoSelect) return;
    
    const tipo = tipoSelect.value;
    const divsCredito = document.querySelectorAll('#vista-nueva-compra .div-credito-compra');
    
    divsCredito.forEach(div => {
        if (tipo === 'Credito') {
            div.classList.remove('oculto');
        } else {
            div.classList.add('oculto');
        }
    });
}

function limpiarCarritoCompra() {
    compraCarrito = [];
    const selectProv = document.getElementById('compra-proveedor');
    const selectTipo = document.getElementById('compra-tipo');
    
    if (selectProv) selectProv.value = '';
    if (selectTipo) selectTipo.value = 'Contado';
    if (document.getElementById('compra-lugar')) {
        document.getElementById('compra-lugar').value = '';
    }
    
    toggleCamposCreditoCompra(); // Fuerza a ocultar casillas
    actualizarOrigenCompra();
    actualizarVistaCarritoCompra();
}

function actualizarOrigenCompra() {
    const proveedor = document.getElementById('compra-proveedor');
    const lugar = document.getElementById('compra-lugar');
    if (!proveedor || !lugar) return;

    lugar.required = !proveedor.value;
    lugar.placeholder = proveedor.value
        ? 'Tienda, sucursal o referencia (opcional)'
        : 'Obligatorio si no seleccionas proveedor';
}

async function iniciarNuevaCompra() {
    limpiarCarritoCompra(); 
    const sesion = JSON.parse(localStorage.getItem("bizpilot_sesion"));
    const gridProductos = document.getElementById('compra-grid-productos');
    const selectProveedor = document.getElementById('compra-proveedor');
    
    gridProductos.innerHTML = "<p>Cargando catálogo...</p>";
    
    try {
        const resProv = await fetch(`/api/proveedores/${sesion.id_empresa}`);
        const dataProv = await resProv.json();
        
        selectProveedor.innerHTML = [
            '<option value="">Sin proveedor registrado</option>',
            ...(dataProv.data || []).map(p => (
                `<option value="${Number(p.id_proveedor)}">${escaparHTML(p.nombre)}</option>`
            ))
        ].join('');
        actualizarOrigenCompra();

        const resProd = await fetch(`/api/productos/${sesion.id_empresa}`);
        const dataProd = await resProd.json();
        
        compraProductosCatalogo = dataProd.data;
        renderizarCatalogoCompra(compraProductosCatalogo);
    } catch (error) {
        gridProductos.innerHTML = "<p>Error al cargar los datos.</p>";
    }
}

function renderizarCatalogoCompra(productos) {
    const grid = document.getElementById('compra-grid-productos');
    
    if(productos.length === 0) {
        grid.innerHTML = "<p style='grid-column: 1 / -1; text-align: center; color: #6b7280;'>No hay productos registrados aún.</p>";
        return;
    }

    grid.innerHTML = productos.map(p => {
        const nombreProveedor = p.proveedores ? p.proveedores.nombre : 'N/A';
        return `
        <div class="pos-card" onclick="agregarAlCarritoCompra(${p.id_producto}, '${p.nombre}', ${p.precio_compra})">
            <h4>${p.nombre}</h4>
            <p style="font-size: 0.75rem; color: #6b7280; margin: 0 0 0.5rem 0;">Prov: ${nombreProveedor}</p>
            <p>Costo: $${p.precio_compra.toFixed(2)}</p>
            <small>Stock actual: ${p.stock}</small>
        </div>
    `}).join('');
}

function filtrarCompraProductos() {
    const texto = document.getElementById('compra-buscador').value.toLowerCase();
    const filtrados = compraProductosCatalogo.filter(p => 
        p.nombre.toLowerCase().includes(texto) || (p.sku && p.sku.toLowerCase().includes(texto))
    );
    renderizarCatalogoCompra(filtrados);
}

function toggleFormNuevoProductoCompra() {
    document.getElementById('form-nuevo-prod-compra').classList.toggle('oculto');
}

function agregarNuevoProductoACompra() {
    const nombre = document.getElementById('nuevo-compra-nombre').value;
    const costo = parseFloat(document.getElementById('nuevo-compra-costo').value);
    const venta = parseFloat(document.getElementById('nuevo-compra-venta').value) || 0;
    const cantidad = parseInt(document.getElementById('nuevo-compra-cantidad').value);
    const sku = document.getElementById('nuevo-compra-sku').value;
    const categoria = document.getElementById('nuevo-compra-categoria').value;

    if (!nombre || isNaN(costo) || isNaN(cantidad)) {
        alert("Por favor completa nombre, costo y cantidad del nuevo producto.");
        return;
    }

    compraCarrito.push({
        id_producto: null,
        sku: sku,
        nombre: nombre,
        categoria: categoria,
        cantidad: cantidad,
        precio_compra: costo,
        precio_venta: venta,
        subtotal: costo * cantidad
    });

    document.getElementById('nuevo-compra-nombre').value = '';
    document.getElementById('nuevo-compra-costo').value = '';
    document.getElementById('nuevo-compra-venta').value = '';
    document.getElementById('nuevo-compra-sku').value = '';
    document.getElementById('nuevo-compra-categoria').value = '';
    toggleFormNuevoProductoCompra();

    actualizarVistaCarritoCompra();
}

function agregarAlCarritoCompra(id_producto, nombre, precio_costo) {
    const existe = compraCarrito.find(item => item.id_producto === id_producto);
    
    if (existe) {
        existe.cantidad += 1;
        existe.subtotal = existe.cantidad * existe.precio_compra;
    } else {
        compraCarrito.push({
            id_producto: id_producto,
            nombre: nombre,
            cantidad: 1,
            precio_compra: precio_costo,
            precio_venta: 0, 
            subtotal: precio_costo
        });
    }
    
    actualizarVistaCarritoCompra();
}

function cambiarCantidadCompraManual(index, nuevaCantidad) {
    const item = compraCarrito[index];
    if (!item) return;

    let cant = parseInt(nuevaCantidad);
    if (isNaN(cant) || cant <= 0) {
        compraCarrito.splice(index, 1);
    } else {
        item.cantidad = cant;
        item.subtotal = item.cantidad * item.precio_compra;
    }
    
    actualizarVistaCarritoCompra();
}

function actualizarVistaCarritoCompra() {
    const listaCarrito = document.getElementById('compra-lista-carrito');
    const labelTotal = document.getElementById('compra-total-monto');
    
    if (compraCarrito.length === 0) {
        listaCarrito.innerHTML = '<p style="text-align:center; color:#9ca3af; margin-top:2rem;">La orden está vacía</p>';
        labelTotal.innerText = "0.00";
        compraTotal = 0;
        return;
    }

    compraTotal = compraCarrito.reduce((sum, item) => sum + item.subtotal, 0);
    labelTotal.innerText = compraTotal.toFixed(2);

    listaCarrito.innerHTML = compraCarrito.map((item, idx) => `
        <div class="carrito-item">
            <div class="carrito-info">
                <h4>${item.nombre} ${item.id_producto === null ? '<small style="color:#10b981;">(Nuevo)</small>' : ''}</h4>
                <div class="carrito-cantidad-control">
                    <input type="number" class="input-cant-manual" style="width: 60px;" value="${item.cantidad}" onchange="cambiarCantidadCompraManual(${idx}, this.value)">
                    <small style="margin-left: 5px; color: #6b7280;">x Costo: $${item.precio_compra.toFixed(2)}</small>
                </div>
            </div>
            <div class="carrito-precio">
                $${item.subtotal.toFixed(2)}
            </div>
        </div>
    `).join('');
}

async function procesarOrdenCompra() {
    const proveedorId = document.getElementById('compra-proveedor').value;
    const lugarCompra = document.getElementById('compra-lugar').value.trim();

    if (!proveedorId && !lugarCompra) {
        alert("Selecciona un proveedor o escribe dónde se compró.");
        return;
    }

    if (compraCarrito.length === 0) {
        alert("La orden de compra está vacía.");
        return;
    }

    const sesion = JSON.parse(localStorage.getItem("bizpilot_sesion"));
    const btnCobrar = document.querySelector('#vista-nueva-compra .pos-btn-cobrar');
    const tipoCompra = document.getElementById('compra-tipo').value;
    
    btnCobrar.innerText = "Procesando Entrada...";
    btnCobrar.disabled = true;
    
    const datosCompra = {
        id_empresa: sesion.id_empresa,
        id_proveedor: proveedorId ? parseInt(proveedorId) : null,
        lugar_compra: lugarCompra || null,
        total: compraTotal,
        tipo_compra: tipoCompra,
        metodo_pago: document.getElementById('compra-medio-pago').value,
        dias_credito: tipoCompra === 'Credito' ? parseInt(document.getElementById('compra-dias-credito').value) || 0 : 0,
        monto_pagado: tipoCompra === 'Credito' ? parseFloat(document.getElementById('compra-monto-pagado').value) || 0 : compraTotal,
        carrito: compraCarrito
    };

    try {
        const respuesta = await fetch('/api/compras', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosCompra)
        });

        const resultado = await respuesta.json();

        if (resultado.exito) {
            alert("Compra registrada correctamente. Los productos y el inventario se han actualizado.");
            limpiarCarritoCompra();
            iniciarNuevaCompra(); 
        } else {
            alert(resultado.mensaje);
        }
    } catch (error) {
        alert("Error de conexión al procesar la compra.");
    } finally {
        btnCobrar.innerText = "Confirmar Entrada a Almacén";
        btnCobrar.disabled = false;
    }
}

// ==========================================
// LÓGICA DE CXP Y ABONOS (CUENTAS POR PAGAR)
// ==========================================
let deudasCXPGlobal = [];
let deudaSeleccionadaId = null;

async function obtenerCXPAPI() {
    const sesion = JSON.parse(localStorage.getItem("bizpilot_sesion"));
    const tablaBody = document.getElementById('tabla-cxp-body');
    
    tablaBody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Cargando deudas...</td></tr>`;

    try {
        console.log("Buscando CXP para la empresa:", sesion.id_empresa);
        
        const respuesta = await fetch(`/api/cxp/${sesion.id_empresa}`);
        const resultado = await respuesta.json();
        
        console.log("El servidor contestó:", resultado);

        if (!resultado.data) {
            throw new Error("FastAPI no devolvió los datos correctamente. Posible error 404 o 500.");
        }
        
        deudasCXPGlobal = resultado.data; 

        if (deudasCXPGlobal.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Excelente. No tienes deudas con proveedores.</td></tr>`;
            return;
        }

        tablaBody.innerHTML = deudasCXPGlobal.map(c => {
            const esPendiente = c.estado_pago === 'Pendiente';
            const badge = esPendiente ? 'badge-danger' : 'badge-success';
            
            const abonado = c.monto_pagado || 0;
            const saldoPendiente = c.total - abonado;
            
            return `
            <tr>
                <td><strong>#${c.id_compra}</strong></td>
                <td>${escaparHTML(c.proveedores?.nombre || c.lugar_compra || 'Sin proveedor')}</td>
                <td>${c.dias_credito ? c.dias_credito + ' días' : 'Contado'}</td>
                <td>$${c.total.toFixed(2)}</td>
                <td><span style="color:#10b981;">$${abonado.toFixed(2)}</span></td>
                <td><strong>$${saldoPendiente > 0 ? saldoPendiente.toFixed(2) : '0.00'}</strong></td>
                <td><span class="${badge}">${c.estado_pago}</span></td>
                <td>
                    <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="abrirModalCXP(${c.id_compra})">
                        Ver Detalles / Abonar
                    </button>
                </td>
            </tr>
        `}).join('');

    } catch (error) {
        console.error("¡ERROR DETECTADO EN CXP! ->", error);
        tablaBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Error al cargar CXP. Revisa la consola para más detalles.</td></tr>`;
    }
}

function abrirModalCXP(id_compra) {
    deudaSeleccionadaId = id_compra;
    const compra = deudasCXPGlobal.find(c => c.id_compra === id_compra);
    
    document.getElementById('cxp-detalle-id').innerText = id_compra;
    document.getElementById('modal-pagos-cxp').classList.remove('oculto');
    
    if(compra.estado_pago === 'Pagado') {
        document.getElementById('caja-nuevo-abono').style.display = 'none';
    } else {
        document.getElementById('caja-nuevo-abono').style.display = 'block';
        document.getElementById('abono-monto').value = '';
    }

    const tbody = document.getElementById('cxp-historial-body');
    if(compra.pagos_cxp && compra.pagos_cxp.length > 0) {
        tbody.innerHTML = compra.pagos_cxp.map(p => {
            const fecha = new Date(p.fecha_pago).toLocaleDateString() + ' ' + new Date(p.fecha_pago).toLocaleTimeString();
            return `<tr>
                <td>${fecha}</td>
                <td>${p.metodo_pago}</td>
                <td><strong>$${p.monto.toFixed(2)}</strong></td>
            </tr>`;
        }).join('');
    } else {
        tbody.innerHTML = `<tr><td colspan="3">No hay abonos registrados.</td></tr>`;
    }
}

function cerrarModalCXP() {
    document.getElementById('modal-pagos-cxp').classList.add('oculto');
    deudaSeleccionadaId = null;
}

async function procesarAbonoCXP() {
    const monto = parseFloat(document.getElementById('abono-monto').value);
    const metodo = document.getElementById('abono-medio').value;

    if(!monto || monto <= 0) {
        alert("Ingresa un monto válido."); return;
    }

    try {
        const respuesta = await fetch('/api/cxp/abonar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_compra: deudaSeleccionadaId,
                monto: monto,
                metodo_pago: metodo
            })
        });

        const resultado = await respuesta.json();
        if(resultado.exito) {
            alert("Abono registrado correctamente.");
            cerrarModalCXP();
            obtenerCXPAPI(); 
        } else {
            alert(resultado.mensaje);
        }
    } catch(error) {
        alert("Error de conexión al abonar.");
    }
}

// ==========================================
// CUENTAS POR COBRAR (CXC)
// ==========================================
let cuentasCXCGlobal = [];
let clientesCXCGlobal = [];
let clienteCXCSeleccionadoId = null;
let cuentaCXCSeleccionadaId = null;

function saldoCuentaCXC(cuenta) {
    return Math.max(Number(cuenta.total || 0) - Number(cuenta.monto_pagado || 0), 0);
}

function estadoCuentaCXC(cuenta) {
    if (saldoCuentaCXC(cuenta) <= 0.009 || cuenta.estado_pago === 'Pagado') return 'Pagado';
    if (!cuenta.fecha_vencimiento) return 'Pendiente';

    const vencimiento = new Date(`${String(cuenta.fecha_vencimiento).slice(0, 10)}T00:00:00`);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return vencimiento < hoy ? 'Vencido' : 'Pendiente';
}

function formatearFechaCXC(valor, incluirHora = false) {
    if (!valor) return 'Sin fecha';
    const texto = String(valor);
    const fecha = texto.length === 10
        ? new Date(`${texto}T00:00:00`)
        : new Date(texto);

    if (Number.isNaN(fecha.getTime())) return 'Sin fecha';
    return incluirHora
        ? `${fecha.toLocaleDateString('es-MX')} ${fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`
        : fecha.toLocaleDateString('es-MX');
}

function claveFechaLocalCXC(valor) {
    if (!valor) return '';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return String(valor).slice(0, 10);
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

function nombreClienteCXC(cuenta) {
    return cuenta.cliente || cuenta.clientes?.nombre || `Cliente ${cuenta.id_cliente}`;
}

function productosCuentaCXC(cuenta) {
    return (cuenta.ventas_detalle || []).map(detalle => ({
        nombre: detalle.nombre_producto || detalle.productos?.nombre || 'Producto histórico',
        cantidad: Number(detalle.cantidad || 0),
        precio_unitario: Number(detalle.precio_unitario || 0),
        subtotal: Number(
            detalle.subtotal
            || Number(detalle.cantidad || 0) * Number(detalle.precio_unitario || 0)
        )
    }));
}

function pagosConSaldosCXC(cuenta) {
    const pagos = [...(cuenta.pagos_cxc || [])]
        .sort((a, b) => {
            const diferencia = new Date(a.fecha_pago) - new Date(b.fecha_pago);
            return diferencia || Number(a.id_pago_cxc || 0) - Number(b.id_pago_cxc || 0);
        });
    let saldoCalculado = Number(cuenta.total || 0);

    return pagos.map(pago => {
        const saldoAntes = pago.saldo_antes === null || pago.saldo_antes === undefined
            ? saldoCalculado
            : Number(pago.saldo_antes);
        const saldoDespues = pago.saldo_despues === null || pago.saldo_despues === undefined
            ? Math.max(saldoAntes - Number(pago.monto || 0), 0)
            : Number(pago.saldo_despues);
        saldoCalculado = saldoDespues;
        return { ...pago, saldo_antes_calculado: saldoAntes, saldo_despues_calculado: saldoDespues };
    });
}

function consolidarClientesCXC(cuentas) {
    const hoy = claveFechaLocalCXC(new Date());
    const mapa = new Map();

    cuentas.forEach(cuenta => {
        const idCliente = Number(cuenta.id_cliente);
        if (!Number.isInteger(idCliente) || idCliente <= 0) return;

        if (!mapa.has(idCliente)) {
            mapa.set(idCliente, {
                id_cliente: idCliente,
                nombre: nombreClienteCXC(cuenta),
                telefono: cuenta.clientes?.telefono || '',
                cuentas: [],
                total: 0,
                cobrado: 0,
                saldo: 0,
                vencido: 0,
                por_vencer: 0,
                cobrado_hoy: 0,
                estado: 'Pagado'
            });
        }

        const cliente = mapa.get(idCliente);
        const saldo = saldoCuentaCXC(cuenta);
        const estado = estadoCuentaCXC(cuenta);
        cliente.cuentas.push(cuenta);
        cliente.total += Number(cuenta.total || 0);
        cliente.cobrado += Number(cuenta.monto_pagado || 0);
        cliente.saldo += saldo;
        if (estado === 'Vencido') cliente.vencido += saldo;
        if (estado === 'Pendiente') cliente.por_vencer += saldo;
        cliente.cobrado_hoy += (cuenta.pagos_cxc || []).reduce(
            (total, pago) => total + (
                claveFechaLocalCXC(pago.fecha_pago) === hoy ? Number(pago.monto || 0) : 0
            ),
            0
        );
    });

    return Array.from(mapa.values()).map(cliente => {
        cliente.estado = cliente.saldo <= 0.009
            ? 'Pagado'
            : cliente.vencido > 0.009 ? 'Vencido' : 'Pendiente';
        cliente.cuentas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        return cliente;
    }).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

async function obtenerCXCAPI() {
    const sesion = obtenerSesion();
    const tabla = document.getElementById('tabla-cxc-body');
    if (!sesion || !tabla) return;

    cerrarModalCXC();
    tabla.innerHTML = '<tr><td colspan="9" style="text-align:center;">Cargando cartera...</td></tr>';

    try {
        const respuesta = await fetch(`/api/cxc/${sesion.id_empresa}`);
        const resultado = await respuesta.json();

        if (!respuesta.ok || resultado.status !== 'success') {
            throw new Error(resultado.detail || resultado.mensaje || 'No se pudo consultar la cartera.');
        }

        cuentasCXCGlobal = resultado.data || [];
        clientesCXCGlobal = consolidarClientesCXC(cuentasCXCGlobal);
        actualizarFiltroClientesCXC();
        filtrarCXC();
    } catch (error) {
        console.error('Error al cargar CxC:', error);
        cuentasCXCGlobal = [];
        clientesCXCGlobal = [];
        actualizarResumenCXC([]);
        document.getElementById('cxc-resumen-registros').textContent = '';
        tabla.innerHTML = '<tr><td colspan="9" style="text-align:center; color:#991b1b;">No se pudo cargar la cartera. Ejecuta migracion_operaciones_finanzas_20260810.sql y revisa la conexión.</td></tr>';
    }
}

function actualizarFiltroClientesCXC() {
    const selector = document.getElementById('cxc-filtro-cliente');
    const seleccionAnterior = selector.value;
    const clientes = new Map();

    clientesCXCGlobal.forEach(cliente => {
        clientes.set(String(cliente.id_cliente), cliente.nombre);
    });

    selector.innerHTML = [
        '<option value="todos">Todos</option>',
        ...Array.from(clientes.entries())
            .sort((a, b) => String(a[1]).localeCompare(String(b[1]), 'es'))
            .map(([id, nombre]) => `<option value="${id}">${escaparHTML(nombre)}</option>`)
    ].join('');

    selector.value = Array.from(selector.options).some(opcion => opcion.value === seleccionAnterior)
        ? seleccionAnterior
        : 'todos';
}

function actualizarResumenCXC(clientes) {
    const resumen = clientes.reduce((acumulado, cliente) => {
        acumulado.pendiente += cliente.saldo;
        acumulado.vencido += cliente.vencido;
        acumulado.porVencer += cliente.por_vencer;
        acumulado.cobrado += cliente.cobrado;
        acumulado.cobradoHoy += cliente.cobrado_hoy;
        if (cliente.saldo > 0.009) acumulado.clientesConSaldo += 1;
        return acumulado;
    }, { pendiente: 0, vencido: 0, porVencer: 0, cobrado: 0, cobradoHoy: 0, clientesConSaldo: 0 });

    document.getElementById('cxc-resumen-pendiente').textContent = formatearMoneda(resumen.pendiente);
    document.getElementById('cxc-resumen-vencido').textContent = formatearMoneda(resumen.vencido);
    document.getElementById('cxc-resumen-por-vencer').textContent = formatearMoneda(resumen.porVencer);
    document.getElementById('cxc-resumen-cobrado-hoy').textContent = formatearMoneda(resumen.cobradoHoy);
    document.getElementById('cxc-resumen-cobrado').textContent = formatearMoneda(resumen.cobrado);
    document.getElementById('cxc-resumen-clientes').textContent = resumen.clientesConSaldo;
}

function filtrarCXC() {
    const texto = normalizarBusqueda(document.getElementById('cxc-busqueda').value);
    const estadoFiltro = document.getElementById('cxc-filtro-estado').value;
    const clienteFiltro = document.getElementById('cxc-filtro-cliente').value;
    const fechaInicio = document.getElementById('cxc-fecha-inicio').value;
    const fechaFin = document.getElementById('cxc-fecha-fin').value;

    const cuentasFiltradas = cuentasCXCGlobal.filter(cuenta => {
        const fechaVenta = claveFechaLocalCXC(cuenta.fecha);
        const contenido = [
            cuenta.id_venta,
            nombreClienteCXC(cuenta),
            ...productosCuentaCXC(cuenta).map(producto => producto.nombre),
            ...(cuenta.pagos_cxc || []).flatMap(pago => [
                pago.descripcion,
                pago.referencia,
                pago.notas
            ])
        ].map(normalizarBusqueda).join(' ');
        const coincideCliente = clienteFiltro === 'todos' || String(cuenta.id_cliente) === clienteFiltro;
        return (
            (!texto || contenido.includes(texto))
            && coincideCliente
            && (!fechaInicio || fechaVenta >= fechaInicio)
            && (!fechaFin || fechaVenta <= fechaFin)
        );
    });

    const clientesFiltrados = consolidarClientesCXC(cuentasFiltradas).filter(cliente => (
        estadoFiltro === 'todos' || cliente.estado.toLowerCase() === estadoFiltro
    ));

    actualizarResumenCXC(clientesFiltrados);
    renderizarCXC(clientesFiltrados);
}

function renderizarCXC(clientes) {
    const tabla = document.getElementById('tabla-cxc-body');
    document.getElementById('cxc-resumen-registros').textContent = `${clientes.length} de ${clientesCXCGlobal.length} cliente(s)`;

    if (clientes.length === 0) {
        tabla.innerHTML = '<tr><td colspan="9" style="text-align:center;">No hay cuentas que coincidan con los filtros.</td></tr>';
        return;
    }

    tabla.innerHTML = clientes.map(cliente => {
        const clase = cliente.estado === 'Pagado'
            ? 'badge-success'
            : cliente.estado === 'Vencido' ? 'badge-danger' : 'badge-warning';

        return `
            <tr>
                <td>
                    <strong>${escaparHTML(cliente.nombre)}</strong>
                    <small class="cxc-client-phone">${escaparHTML(cliente.telefono || 'Sin teléfono')}</small>
                </td>
                <td>${cliente.cuentas.length}</td>
                <td>${formatearMoneda(cliente.total)}</td>
                <td class="amount-positive">${formatearMoneda(cliente.cobrado)}</td>
                <td><strong>${formatearMoneda(cliente.saldo)}</strong></td>
                <td class="${cliente.vencido > 0 ? 'amount-negative' : ''}">${formatearMoneda(cliente.vencido)}</td>
                <td class="amount-positive">${formatearMoneda(cliente.cobrado_hoy)}</td>
                <td><span class="${clase}">${cliente.estado}</span></td>
                <td><button type="button" class="btn-table btn-table-edit" onclick="abrirClienteCXC(${cliente.id_cliente})">Desglosar movimientos</button></td>
            </tr>
        `;
    }).join('');
}

function abrirClienteCXC(idCliente) {
    const cliente = clientesCXCGlobal.find(item => Number(item.id_cliente) === Number(idCliente));
    if (!cliente) return;

    clienteCXCSeleccionadoId = Number(idCliente);
    cuentaCXCSeleccionadaId = null;
    document.getElementById('cxc-detalle-cliente').textContent = cliente.nombre;
    document.getElementById('cxc-detalle-resumen').innerHTML = `
        <div><span>Créditos</span><strong>${cliente.cuentas.length}</strong></div>
        <div><span>Total vendido</span><strong>${formatearMoneda(cliente.total)}</strong></div>
        <div><span>Cobrado</span><strong>${formatearMoneda(cliente.cobrado)}</strong></div>
        <div><span>Saldo actual</span><strong>${formatearMoneda(cliente.saldo)}</strong></div>
        <div><span>Saldo vencido</span><strong>${formatearMoneda(cliente.vencido)}</strong></div>
        <div><span>Cobrado hoy</span><strong>${formatearMoneda(cliente.cobrado_hoy)}</strong></div>
    `;

    document.getElementById('cxc-cuentas-cliente-body').innerHTML = cliente.cuentas.map(cuenta => {
        const saldo = saldoCuentaCXC(cuenta);
        const estado = estadoCuentaCXC(cuenta);
        const clase = estado === 'Pagado'
            ? 'badge-success'
            : estado === 'Vencido' ? 'badge-danger' : 'badge-warning';
        const accion = estado === 'Pagado'
            ? '<span class="badge-success">Liquidada</span>'
            : `<button type="button" class="btn-table btn-table-edit" onclick="seleccionarCuentaParaCobro(${Number(cuenta.id_venta)})">Cobrar</button>`;
        return `
            <tr>
                <td><strong>#${Number(cuenta.id_venta)}</strong></td>
                <td>${formatearFechaCXC(cuenta.fecha, true)}</td>
                <td>${formatearFechaCXC(cuenta.fecha_vencimiento)}</td>
                <td>${formatearMoneda(cuenta.total)}</td>
                <td class="amount-positive">${formatearMoneda(cuenta.monto_pagado)}</td>
                <td><strong>${formatearMoneda(saldo)}</strong></td>
                <td><span class="${clase}">${estado}</span></td>
                <td>${accion}</td>
            </tr>
        `;
    }).join('');

    renderizarMovimientosClienteCXC(cliente);
    cancelarCobroCXC();
    document.getElementById('modal-pagos-cxc').classList.remove('oculto');
    document.getElementById('modal-pagos-cxc').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderizarMovimientosClienteCXC(cliente) {
    const movimientos = [];

    cliente.cuentas.forEach(cuenta => {
        movimientos.push({
            tipo: 'Venta',
            id_movimiento: Number(cuenta.id_venta),
            id_venta: Number(cuenta.id_venta),
            fecha: cuenta.fecha,
            importe: Number(cuenta.total || 0),
            metodo_pago: cuenta.metodo_pago || 'Crédito',
            productos: productosCuentaCXC(cuenta)
        });

        pagosConSaldosCXC(cuenta).forEach(pago => movimientos.push({
            tipo: 'Pago',
            id_movimiento: Number(pago.id_pago_cxc),
            id_venta: Number(cuenta.id_venta),
            fecha: pago.fecha_pago,
            importe: Number(pago.monto || 0),
            metodo_pago: pago.metodo_pago || 'No especificado',
            descripcion: pago.descripcion || pago.notas || `Abono a venta #${cuenta.id_venta}`,
            referencia: pago.referencia,
            notas: pago.notas,
            saldo_antes: pago.saldo_antes_calculado,
            saldo_despues: pago.saldo_despues_calculado
        }));
    });

    movimientos.sort((a, b) => {
        const diferencia = new Date(b.fecha) - new Date(a.fecha);
        return diferencia || b.id_movimiento - a.id_movimiento;
    });

    const tabla = document.getElementById('cxc-historial-body');
    tabla.innerHTML = movimientos.length ? movimientos.map(movimiento => {
        const esVenta = movimiento.tipo === 'Venta';
        const clase = esVenta ? 'badge-warning' : 'badge-success';
        const descripcion = esVenta
            ? movimiento.productos.length
                ? `<div class="cxc-product-breakdown">${movimiento.productos.map(producto => `
                    <span>
                        <strong>${escaparHTML(producto.nombre)}</strong>:
                        ${producto.cantidad} × ${formatearMoneda(producto.precio_unitario)}
                        = <strong>${formatearMoneda(producto.subtotal)}</strong>
                    </span>
                `).join('')}</div>`
                : '<span>Venta sin detalle disponible</span>'
            : `<div class="cxc-movement-description">
                <strong>${escaparHTML(movimiento.descripcion)}</strong>
                <span>${escaparHTML(movimiento.metodo_pago)}${movimiento.referencia ? ` · Ref. ${escaparHTML(movimiento.referencia)}` : ''}</span>
                ${movimiento.notas && movimiento.notas !== movimiento.descripcion ? `<small>${escaparHTML(movimiento.notas)}</small>` : ''}
            </div>`;

        return `
            <tr>
                <td>${formatearFechaCXC(movimiento.fecha, true)}</td>
                <td><span class="${clase}">${movimiento.tipo}</span></td>
                <td>#${movimiento.id_venta}</td>
                <td>${descripcion}</td>
                <td class="${esVenta ? 'amount-negative' : 'amount-positive'}"><strong>${esVenta ? '' : '+'}${formatearMoneda(movimiento.importe)}</strong></td>
                <td>${esVenta ? '—' : formatearMoneda(movimiento.saldo_antes)}</td>
                <td>${esVenta ? '—' : `<strong>${formatearMoneda(movimiento.saldo_despues)}</strong>`}</td>
                <td><button type="button" class="btn-table btn-table-state" onclick="editarFechaMovimientoCXC('${movimiento.tipo}', ${movimiento.id_movimiento})">Editar fecha</button></td>
            </tr>
        `;
    }).join('') : '<tr><td colspan="8">No hay movimientos registrados.</td></tr>';
}

function seleccionarCuentaParaCobro(idVenta) {
    const cuenta = cuentasCXCGlobal.find(item => Number(item.id_venta) === Number(idVenta));
    if (!cuenta || Number(cuenta.id_cliente) !== clienteCXCSeleccionadoId) return;

    const saldo = saldoCuentaCXC(cuenta);
    if (saldo <= 0.009) {
        alert('La cuenta ya está pagada.');
        return;
    }

    cuentaCXCSeleccionadaId = Number(idVenta);
    document.getElementById('cxc-abono-cuenta').textContent = `#${idVenta}`;
    document.getElementById('cxc-abono-saldo').textContent = `Saldo antes de pagar: ${formatearMoneda(saldo)}`;
    document.getElementById('cxc-abono-monto').value = '';
    document.getElementById('cxc-abono-monto').max = saldo.toFixed(2);
    document.getElementById('cxc-abono-descripcion').value = `Abono a venta #${idVenta}`;
    document.getElementById('cxc-abono-referencia').value = '';
    document.getElementById('cxc-abono-notas').value = '';
    document.getElementById('caja-nuevo-abono-cxc').classList.remove('oculto');
    document.getElementById('caja-nuevo-abono-cxc').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function cancelarCobroCXC() {
    cuentaCXCSeleccionadaId = null;
    document.getElementById('caja-nuevo-abono-cxc')?.classList.add('oculto');
}

function movimientoCXC(tipoMovimiento, idMovimiento) {
    for (const cuenta of cuentasCXCGlobal) {
        if (tipoMovimiento === 'Venta' && Number(cuenta.id_venta) === Number(idMovimiento)) {
            return { fecha: cuenta.fecha, id_cliente: Number(cuenta.id_cliente) };
        }
        if (tipoMovimiento === 'Pago') {
            const pago = (cuenta.pagos_cxc || []).find(
                item => Number(item.id_pago_cxc) === Number(idMovimiento)
            );
            if (pago) return { fecha: pago.fecha_pago, id_cliente: Number(cuenta.id_cliente) };
        }
    }
    return null;
}

function fechaParaEdicionCXC(valor) {
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '';
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minuto = String(fecha.getMinutes()).padStart(2, '0');
    return `${anio}-${mes}-${dia}T${hora}:${minuto}`;
}

async function editarFechaMovimientoCXC(tipoMovimiento, idMovimiento) {
    const movimiento = movimientoCXC(tipoMovimiento, idMovimiento);
    if (!movimiento) return;

    const nuevaFechaTexto = prompt(
        `Nueva fecha y hora para ${tipoMovimiento.toLowerCase()} (AAAA-MM-DDTHH:MM):`,
        fechaParaEdicionCXC(movimiento.fecha)
    );
    if (nuevaFechaTexto === null) return;

    const nuevaFecha = new Date(nuevaFechaTexto);
    if (!nuevaFechaTexto || Number.isNaN(nuevaFecha.getTime())) {
        alert('La fecha no es válida. Usa el formato AAAA-MM-DDTHH:MM.');
        return;
    }

    const sesion = obtenerSesion();
    try {
        const respuesta = await fetch('/api/cxc/movimientos/fecha', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_empresa: sesion.id_empresa,
                tipo_movimiento: tipoMovimiento,
                id_movimiento: Number(idMovimiento),
                fecha: nuevaFecha.toISOString()
            })
        });
        const resultado = await respuesta.json();
        if (!respuesta.ok || !resultado.exito) {
            throw new Error(resultado.detail || resultado.mensaje || 'No se pudo actualizar la fecha.');
        }

        const idCliente = movimiento.id_cliente;
        await obtenerCXCAPI();
        abrirClienteCXC(idCliente);
    } catch (error) {
        alert(error.message || 'No se pudo actualizar la fecha.');
    }
}

function restablecerFiltrosCXC() {
    document.getElementById('cxc-busqueda').value = '';
    document.getElementById('cxc-filtro-estado').value = 'todos';
    document.getElementById('cxc-filtro-cliente').value = 'todos';
    document.getElementById('cxc-fecha-inicio').value = '';
    document.getElementById('cxc-fecha-fin').value = '';
    filtrarCXC();
}

function cerrarModalCXC() {
    document.getElementById('modal-pagos-cxc')?.classList.add('oculto');
    clienteCXCSeleccionadoId = null;
    cuentaCXCSeleccionadaId = null;
}

async function procesarAbonoCXC() {
    const cuenta = cuentasCXCGlobal.find(item => Number(item.id_venta) === cuentaCXCSeleccionadaId);
    if (!cuenta) return;

    const monto = Number(document.getElementById('cxc-abono-monto').value);
    const saldo = saldoCuentaCXC(cuenta);

    if (!Number.isFinite(monto) || monto <= 0) {
        alert('Ingresa un monto mayor a cero.');
        return;
    }

    if (monto > saldo + 0.009) {
        alert(`El cobro no puede superar el saldo de ${formatearMoneda(saldo)}.`);
        return;
    }

    const descripcion = document.getElementById('cxc-abono-descripcion').value.trim();
    if (!descripcion) {
        alert('Escribe la descripción del movimiento.');
        return;
    }

    const sesion = obtenerSesion();
    const boton = document.querySelector('#caja-nuevo-abono-cxc .btn-primary');
    boton.disabled = true;
    boton.textContent = 'Guardando...';

    try {
        const respuesta = await fetch('/api/cxc/abonar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_empresa: sesion.id_empresa,
                id_venta: cuentaCXCSeleccionadaId,
                monto,
                metodo_pago: document.getElementById('cxc-abono-metodo').value,
                descripcion,
                referencia: document.getElementById('cxc-abono-referencia').value.trim() || null,
                notas: document.getElementById('cxc-abono-notas').value.trim() || null
            })
        });

        const resultado = await respuesta.json();
        if (!respuesta.ok || !resultado.exito) {
            throw new Error(resultado.detail || resultado.mensaje || 'No se pudo registrar el cobro.');
        }

        const idCliente = Number(cuenta.id_cliente);
        const saldoDespues = Math.max(saldo - monto, 0);
        alert(`Cobro registrado. Saldo antes: ${formatearMoneda(saldo)} · Saldo después: ${formatearMoneda(saldoDespues)}.`);
        await obtenerCXCAPI();
        abrirClienteCXC(idCliente);
    } catch (error) {
        alert(error.message || 'Error de conexión al registrar el cobro.');
    } finally {
        boton.disabled = false;
        boton.textContent = 'Guardar cobro';
    }
}

// ==========================================
// DASHBOARD FINANCIERO
// ==========================================
let solicitudDashboardFinanciero = 0;

function etiquetaPeriodoFinanciero(periodo, tipo) {
    if (!periodo) return '';

    const fecha = tipo === 'mes'
        ? new Date(`${periodo}-01T00:00:00`)
        : new Date(`${periodo}T00:00:00`);

    if (Number.isNaN(fecha.getTime())) return String(periodo);

    if (tipo === 'mes') {
        return fecha.toLocaleDateString('es-MX', {
            month: 'short',
            year: '2-digit'
        }).replace('.', '');
    }

    return fecha.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short'
    }).replace('.', '');
}

function etiquetaMesCompleto(periodo) {
    if (!periodo) return 'Mes actual';
    const fecha = new Date(`${periodo}-01T00:00:00`);
    if (Number.isNaN(fecha.getTime())) return 'Mes actual';

    const etiqueta = fecha.toLocaleDateString('es-MX', {
        month: 'long',
        year: 'numeric'
    });
    return etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1);
}

function formatearMonedaCompacta(valor) {
    return Number(valor || 0).toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
        notation: 'compact',
        maximumFractionDigits: 1
    });
}

function actualizarResumenDashboardFinanciero(resumen) {
    const ingresos = Number(resumen?.ingresos || 0);
    const gastos = Number(resumen?.gastos || 0);
    const utilidad = Number(resumen?.utilidad_neta || 0);

    document.getElementById('fin-dashboard-ingresos').textContent = formatearMoneda(ingresos);
    document.getElementById('fin-dashboard-gastos').textContent = formatearMoneda(gastos);
    document.getElementById('fin-dashboard-utilidad').textContent = formatearMoneda(utilidad);
    document.getElementById('fin-dashboard-periodo').textContent = etiquetaMesCompleto(resumen?.periodo);

    const tarjetaUtilidad = document.getElementById('fin-dashboard-utilidad-card');
    tarjetaUtilidad.classList.toggle('negative', utilidad < 0);
}

function renderizarGraficaFinanciera(contenedorId, datos, tipo) {
    const contenedor = document.getElementById(contenedorId);
    const registros = Array.isArray(datos) ? datos : [];
    if (!contenedor) return;

    const series = [
        { clave: 'ingresos', nombre: 'Ingresos', color: '#10b981' },
        { clave: 'gastos', nombre: 'Gastos', color: '#ef4444' },
        { clave: 'utilidad_neta', nombre: 'Resultado neto', color: '#2563eb' }
    ];

    const valores = registros.flatMap(registro => (
        series.map(serie => Number(registro[serie.clave] || 0))
    ));
    const hayMovimientos = valores.some(valor => Math.abs(valor) > 0.009);

    if (registros.length === 0 || !hayMovimientos) {
        contenedor.innerHTML = `
            <p class="financial-chart-empty">
                No hay ingresos ni gastos registrados en este periodo.
            </p>
        `;
        return;
    }

    const margen = { superior: 24, derecho: 24, inferior: 54, izquierdo: 76 };
    const altoGrafica = 240;
    const alto = margen.superior + altoGrafica + margen.inferior;
    const anchoGrupo = tipo === 'dia' ? 36 : 66;
    const ancho = Math.max(
        720,
        margen.izquierdo + margen.derecho + registros.length * anchoGrupo
    );
    const anchoBarra = tipo === 'dia' ? 8 : 14;
    const separacionBarras = tipo === 'dia' ? 2 : 4;
    const anchoBarras = series.length * anchoBarra + (series.length - 1) * separacionBarras;

    let maximo = Math.max(0, ...valores);
    let minimo = Math.min(0, ...valores);
    maximo = maximo > 0 ? maximo * 1.12 : 1;
    minimo = minimo < 0 ? minimo * 1.12 : 0;
    const rango = maximo - minimo || 1;
    const anchoArea = ancho - margen.izquierdo - margen.derecho;

    const posicionY = valor => (
        margen.superior + ((maximo - valor) / rango) * altoGrafica
    );
    const lineaCero = posicionY(0);

    const divisiones = 4;
    const rejilla = Array.from({ length: divisiones + 1 }, (_, indice) => {
        const proporcion = indice / divisiones;
        const valor = maximo - rango * proporcion;
        const y = margen.superior + altoGrafica * proporcion;
        return `
            <line x1="${margen.izquierdo}" y1="${y}" x2="${ancho - margen.derecho}" y2="${y}" class="financial-chart-grid-line"></line>
            <text x="${margen.izquierdo - 10}" y="${y + 4}" text-anchor="end" class="financial-chart-axis-text">${escaparHTML(formatearMonedaCompacta(valor))}</text>
        `;
    }).join('');

    const intervaloEtiquetas = tipo === 'dia'
        ? Math.max(1, Math.ceil(registros.length / 7))
        : Math.max(1, Math.ceil(registros.length / 12));

    const grupos = registros.map((registro, indice) => {
        const centro = margen.izquierdo + (indice + 0.5) * (anchoArea / registros.length);
        const inicio = centro - anchoBarras / 2;
        const etiqueta = etiquetaPeriodoFinanciero(registro.periodo, tipo);
        const mostrarEtiqueta = indice % intervaloEtiquetas === 0 || indice === registros.length - 1;

        const barras = series.map((serie, indiceSerie) => {
            const valor = Number(registro[serie.clave] || 0);
            const yValor = posicionY(valor);
            const y = valor >= 0 ? yValor : lineaCero;
            const alturaCalculada = Math.abs(lineaCero - yValor);
            const altura = valor === 0 ? 0 : Math.max(alturaCalculada, 1);
            const x = inicio + indiceSerie * (anchoBarra + separacionBarras);

            return `
                <rect x="${x}" y="${y}" width="${anchoBarra}" height="${altura}" rx="2" fill="${serie.color}" class="financial-chart-bar">
                    <title>${escaparHTML(etiqueta)} · ${serie.nombre}: ${escaparHTML(formatearMoneda(valor))}</title>
                </rect>
            `;
        }).join('');

        const textoEje = mostrarEtiqueta
            ? `<text x="${centro}" y="${alto - 20}" text-anchor="middle" class="financial-chart-axis-text">${escaparHTML(etiqueta)}</text>`
            : '';

        return barras + textoEje;
    }).join('');

    const descripcion = tipo === 'dia'
        ? 'Ingresos, gastos y resultado neto de los últimos 30 días'
        : 'Ingresos, gastos y resultado neto de los últimos 12 meses';

    contenedor.innerHTML = `
        <svg class="financial-chart-svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="${descripcion}">
            ${rejilla}
            <line x1="${margen.izquierdo}" y1="${lineaCero}" x2="${ancho - margen.derecho}" y2="${lineaCero}" class="financial-chart-zero-line"></line>
            ${grupos}
        </svg>
    `;
}

async function obtenerDashboardFinanciero() {
    const sesion = obtenerSesion();
    const boton = document.getElementById('btn-actualizar-dashboard-financiero');
    const estado = document.getElementById('fin-dashboard-estado');
    if (!sesion || !estado) return;

    const numeroSolicitud = ++solicitudDashboardFinanciero;
    if (boton) {
        boton.disabled = true;
        boton.textContent = 'Actualizando...';
    }
    estado.classList.remove('error');
    estado.textContent = 'Calculando resumen financiero...';

    try {
        const respuesta = await fetch(`/api/finanzas/dashboard/${sesion.id_empresa}`, {
            cache: 'no-store'
        });
        const resultado = await respuesta.json();

        if (!respuesta.ok || resultado.status !== 'success' || !resultado.data) {
            throw new Error(
                mensajeErrorAPI(resultado, 'No se pudo cargar el dashboard financiero.')
            );
        }
        if (numeroSolicitud !== solicitudDashboardFinanciero) return;

        actualizarResumenDashboardFinanciero(resultado.data.resumen || {});
        renderizarGraficaFinanciera(
            'fin-dashboard-grafica-diaria',
            resultado.data.diario,
            'dia'
        );
        renderizarGraficaFinanciera(
            'fin-dashboard-grafica-mensual',
            resultado.data.mensual,
            'mes'
        );

        const fechaCorte = resultado.data.fecha_corte
            ? formatearFechaCXC(resultado.data.fecha_corte)
            : 'hoy';
        estado.textContent = `Información calculada hasta ${fechaCorte}.`;
    } catch (error) {
        if (numeroSolicitud !== solicitudDashboardFinanciero) return;
        console.error('Error al cargar el dashboard financiero:', error);
        estado.classList.add('error');
        estado.textContent = error.message || 'No se pudo cargar el dashboard financiero.';
    } finally {
        if (numeroSolicitud === solicitudDashboardFinanciero && boton) {
            boton.disabled = false;
            boton.textContent = 'Actualizar';
        }
    }
}

// ==========================================
// ANÁLISIS DE INGRESOS
// ==========================================
let ventasAnalisisIngresosGlobal = [];
let ventasAnalisisIngresosFiltradas = [];
let gruposClientesIngresosGlobal = new Map();
let filtrosAnalisisIngresosInicializados = false;
let solicitudAnalisisIngresos = 0;

function fechaISOIngresos(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
}

function inicializarAnalisisIngresos() {
    if (filtrosAnalisisIngresosInicializados) return;

    const inicio = document.getElementById('ingresos-fecha-inicio');
    const fin = document.getElementById('ingresos-fecha-fin');
    const hoy = new Date();

    inicio.value = fechaISOIngresos(
        new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    );

    fin.value = fechaISOIngresos(hoy);

    document
        .getElementById('btn-actualizar-analisis-ingresos')
        .addEventListener('click', obtenerAnalisisIngresos);

    document
        .getElementById('btn-restablecer-filtros-ingresos')
        .addEventListener('click', () => {
            const fechaActual = new Date();

            inicio.value = fechaISOIngresos(
                new Date(
                    fechaActual.getFullYear(),
                    fechaActual.getMonth(),
                    1
                )
            );

            fin.value = fechaISOIngresos(fechaActual);

            document.getElementById('ingresos-busqueda').value = '';

            obtenerAnalisisIngresos();
        });

    inicio.addEventListener('change', obtenerAnalisisIngresos);
    fin.addEventListener('change', obtenerAnalisisIngresos);

    document
        .getElementById('ingresos-busqueda')
        .addEventListener('input', aplicarBusquedaAnalisisIngresos);

    document
        .getElementById('btn-cerrar-detalle-ingresos')
        .addEventListener('click', cerrarDetalleClienteIngresos);

    filtrosAnalisisIngresosInicializados = true;
}

function montosVentaAnalisisIngresos(venta) {
    const total = Math.max(Number(venta.total || 0), 0);

    const esCredito =
        normalizarBusqueda(venta.tipo_venta) === 'credito';

    const montoRegistrado = Number(venta.monto_pagado || 0);

    const cobrado = esCredito
        ? Math.min(Math.max(montoRegistrado, 0), total)
        : total;

    return {
        total,
        cobrado,
        pendiente: Math.max(total - cobrado, 0)
    };
}

function nombreClienteAnalisisIngresos(venta) {
    if (
        venta.id_cliente === null
        || venta.id_cliente === undefined
    ) {
        return 'Público general';
    }

    return venta.cliente || `Cliente #${venta.id_cliente}`;
}

function claveClienteAnalisisIngresos(venta) {
    if (
        venta.id_cliente === null
        || venta.id_cliente === undefined
    ) {
        return 'publico-general';
    }

    return `cliente-${Number(venta.id_cliente)}`;
}

function detallesVentaAnalisisIngresos(venta) {
    return (venta.ventas_detalle || []).map(detalle => {
        const cantidad = Math.max(
            Number(detalle.cantidad || 0),
            0
        );

        const precio = Math.max(
            Number(detalle.precio_unitario || 0),
            0
        );

        const subtotal = Math.max(
            Number(detalle.subtotal || cantidad * precio),
            0
        );

        const esVentaRapida =
            detalle.id_producto === null
            || detalle.id_producto === undefined;

        return {
            id_producto: detalle.id_producto,

            nombre:
                detalle.nombre_producto
                || detalle.productos?.nombre
                || 'Producto sin nombre',

            sku:
                detalle.productos?.sku
                || (
                    esVentaRapida
                        ? 'Venta rápida'
                        : 'Sin SKU'
                ),

            tipo:
                detalle.tipo_item
                || (
                    esVentaRapida
                        ? 'Venta rápida'
                        : 'Inventario'
                ),

            cantidad,
            precio,
            subtotal
        };
    });
}

function textoBusquedaVentaIngresos(venta) {
    const productos = detallesVentaAnalisisIngresos(venta)
        .flatMap(producto => [
            producto.nombre,
            producto.sku,
            producto.tipo
        ]);

    return normalizarBusqueda([
        venta.id_venta,
        nombreClienteAnalisisIngresos(venta),
        venta.tipo_venta,
        venta.metodo_pago,
        ...productos
    ].join(' '));
}

function agruparClientesAnalisisIngresos(ventas) {
    const grupos = new Map();

    ventas.forEach(venta => {
        const clave = claveClienteAnalisisIngresos(venta);
        const montos = montosVentaAnalisisIngresos(venta);

        if (!grupos.has(clave)) {
            grupos.set(clave, {
                clave,
                nombre: nombreClienteAnalisisIngresos(venta),
                esPublicoGeneral: clave === 'publico-general',
                ventas: [],
                total: 0,
                cobrado: 0,
                pendiente: 0,
                ultimaCompra: null
            });
        }

        const grupo = grupos.get(clave);

        grupo.ventas.push(venta);
        grupo.total += montos.total;
        grupo.cobrado += montos.cobrado;
        grupo.pendiente += montos.pendiente;

        const fechaActual = new Date(venta.fecha).getTime();

        const fechaAnterior = grupo.ultimaCompra
            ? new Date(grupo.ultimaCompra).getTime()
            : Number.NEGATIVE_INFINITY;

        if (
            Number.isFinite(fechaActual)
            && fechaActual > fechaAnterior
        ) {
            grupo.ultimaCompra = venta.fecha;
        }
    });

    return grupos;
}

function actualizarResumenAnalisisIngresos(ventas) {
    const resumen = ventas.reduce((acumulado, venta) => {
        const montos = montosVentaAnalisisIngresos(venta);

        acumulado.vendido += montos.total;
        acumulado.cobrado += montos.cobrado;
        acumulado.pendiente += montos.pendiente;

        return acumulado;
    }, {
        vendido: 0,
        cobrado: 0,
        pendiente: 0
    });

    const ticketPromedio = ventas.length > 0
        ? resumen.vendido / ventas.length
        : 0;

    document
        .getElementById('ingresos-total-vendido')
        .textContent = formatearMoneda(resumen.vendido);

    document
        .getElementById('ingresos-total-cobrado')
        .textContent = formatearMoneda(resumen.cobrado);

    document
        .getElementById('ingresos-total-pendiente')
        .textContent = formatearMoneda(resumen.pendiente);

    document
        .getElementById('ingresos-ticket-promedio')
        .textContent = formatearMoneda(ticketPromedio);
}

function renderizarClientesAnalisisIngresos(ventas) {
    const tabla = document.getElementById(
        'tabla-ingresos-clientes-body'
    );

    const grupos = agruparClientesAnalisisIngresos(ventas);

    gruposClientesIngresosGlobal = grupos;

    const clientes = [...grupos.values()].sort((a, b) => {
        if (a.esPublicoGeneral !== b.esPublicoGeneral) {
            return a.esPublicoGeneral ? 1 : -1;
        }

        return b.total - a.total;
    });

    document
        .getElementById('ingresos-clientes-resumen')
        .textContent =
            `${clientes.length} cliente(s) o grupo(s) · `
            + `${ventas.length} venta(s)`;

    if (clientes.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    style="text-align:center; color:#6b7280;"
                >
                    No hay clientes ni ventas para mostrar.
                </td>
            </tr>
        `;

        cerrarDetalleClienteIngresos();
        return;
    }

    tabla.innerHTML = clientes.map(cliente => `
        <tr>
            <td>
                <strong>
                    ${escaparHTML(cliente.nombre)}
                </strong>

                ${
                    cliente.esPublicoGeneral
                        ? `
                            <br>
                            <span class="badge-neutral">
                                Sin cliente registrado
                            </span>
                        `
                        : ''
                }
            </td>

            <td>${cliente.ventas.length}</td>

            <td>
                <strong>
                    ${formatearMoneda(cliente.total)}
                </strong>
            </td>

            <td class="amount-positive">
                ${formatearMoneda(cliente.cobrado)}
            </td>

            <td class="amount-negative">
                ${formatearMoneda(cliente.pendiente)}
            </td>

            <td>
                ${formatearFechaCXC(cliente.ultimaCompra)}
            </td>

            <td>
                <button
                    type="button"
                    class="btn-secondary"
                    onclick="abrirDetalleClienteIngresos(
                        '${cliente.clave}'
                    )"
                >
                    Ver compras
                </button>
            </td>
        </tr>
    `).join('');
}

function abrirDetalleClienteIngresos(clave) {
    const grupo = gruposClientesIngresosGlobal.get(clave);

    if (!grupo) return;

    const contenedor = document.getElementById(
        'ingresos-detalle-cliente'
    );

    const dias = new Map();

    grupo.ventas.forEach(venta => {
        const fecha =
            claveFechaLocalCXC(venta.fecha)
            || 'Sin fecha';

        const montos = montosVentaAnalisisIngresos(venta);

        if (!dias.has(fecha)) {
            dias.set(fecha, {
                fecha,
                ventas: 0,
                productos: new Map(),
                total: 0,
                cobrado: 0,
                pendiente: 0
            });
        }

        const dia = dias.get(fecha);

        dia.ventas += 1;
        dia.total += montos.total;
        dia.cobrado += montos.cobrado;
        dia.pendiente += montos.pendiente;

        detallesVentaAnalisisIngresos(venta)
            .forEach(producto => {
                const claveProducto = normalizarBusqueda(
                    producto.nombre
                );

                const anterior = dia.productos.get(
                    claveProducto
                ) || {
                    nombre: producto.nombre,
                    cantidad: 0
                };

                anterior.cantidad += producto.cantidad;

                dia.productos.set(
                    claveProducto,
                    anterior
                );
            });
    });

    const registros = [...dias.values()].sort((a, b) =>
        String(b.fecha).localeCompare(String(a.fecha))
    );

    document
        .getElementById('ingresos-detalle-cliente-tipo')
        .textContent = grupo.esPublicoGeneral
            ? 'Público general'
            : 'Cliente registrado';

    document
        .getElementById('ingresos-detalle-cliente-nombre')
        .textContent = grupo.nombre;

    document
        .getElementById('ingresos-detalle-dias')
        .textContent = registros.length;

    document
        .getElementById('ingresos-detalle-total')
        .textContent = formatearMoneda(grupo.total);

    document
        .getElementById('ingresos-detalle-cobrado')
        .textContent = formatearMoneda(grupo.cobrado);

    document
        .getElementById('ingresos-detalle-pendiente')
        .textContent = formatearMoneda(grupo.pendiente);

    document
        .getElementById(
            'tabla-ingresos-detalle-cliente-body'
        )
        .innerHTML = registros.map(dia => {
            const productos = [...dia.productos.values()];

            const descripcion = productos.length > 0
                ? productos.map(producto =>
                    `${escaparHTML(producto.nombre)} × `
                    + `${producto.cantidad}`
                ).join('<br>')
                : `
                    <span style="color:#6b7280;">
                        Sin detalle de productos
                    </span>
                `;

            return `
                <tr>
                    <td>
                        ${formatearFechaCXC(dia.fecha)}
                    </td>

                    <td>${dia.ventas}</td>

                    <td>${descripcion}</td>

                    <td>
                        <strong>
                            ${formatearMoneda(dia.total)}
                        </strong>
                    </td>

                    <td class="amount-positive">
                        ${formatearMoneda(dia.cobrado)}
                    </td>

                    <td class="amount-negative">
                        ${formatearMoneda(dia.pendiente)}
                    </td>
                </tr>
            `;
        }).join('');

    contenedor.classList.remove('oculto');

    contenedor.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function cerrarDetalleClienteIngresos() {
    const contenedor = document.getElementById(
        'ingresos-detalle-cliente'
    );

    if (contenedor) {
        contenedor.classList.add('oculto');
    }
}

function renderizarProductosAnalisisIngresos(ventas) {
    const tabla = document.getElementById(
        'tabla-ingresos-productos-body'
    );

    const productos = new Map();

    ventas.forEach(venta => {
        detallesVentaAnalisisIngresos(venta)
            .forEach(producto => {
                const tieneProducto =
                    producto.id_producto !== null
                    && producto.id_producto !== undefined;

                const clave = tieneProducto
                    ? `producto-${producto.id_producto}`
                    : `rapido-${normalizarBusqueda(
                        producto.nombre
                    )}`;

                if (!productos.has(clave)) {
                    productos.set(clave, {
                        nombre: producto.nombre,
                        sku: producto.sku,
                        tipo: producto.tipo,
                        unidades: 0,
                        ventas: new Set(),
                        total: 0
                    });
                }

                const registro = productos.get(clave);

                registro.unidades += producto.cantidad;
                registro.ventas.add(venta.id_venta);
                registro.total += producto.subtotal;
            });
    });

    const lista = [...productos.values()]
        .sort((a, b) => b.total - a.total);

    const totalProductos = lista.reduce(
        (suma, producto) => suma + producto.total,
        0
    );

    const unidades = lista.reduce(
        (suma, producto) => suma + producto.unidades,
        0
    );

    document
        .getElementById('ingresos-productos-resumen')
        .textContent =
            `${lista.length} producto(s) · `
            + `${unidades} unidad(es) vendida(s)`;

    if (lista.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    style="text-align:center; color:#6b7280;"
                >
                    No hay productos vendidos en este periodo.
                </td>
            </tr>
        `;

        return;
    }

    tabla.innerHTML = lista.map(producto => {
        const precioPromedio = producto.unidades > 0
            ? producto.total / producto.unidades
            : 0;

        const participacion = totalProductos > 0
            ? (producto.total / totalProductos) * 100
            : 0;

        return `
            <tr>
                <td>
                    <strong>
                        ${escaparHTML(producto.nombre)}
                    </strong>
                </td>

                <td>
                    ${escaparHTML(producto.sku)}
                    <br>
                    <small>
                        ${escaparHTML(producto.tipo)}
                    </small>
                </td>

                <td>${producto.unidades}</td>
                <td>${producto.ventas.size}</td>

                <td>
                    ${formatearMoneda(precioPromedio)}
                </td>

                <td>
                    <strong>
                        ${formatearMoneda(producto.total)}
                    </strong>
                </td>

                <td>
                    ${participacion.toFixed(1)}%
                </td>
            </tr>
        `;
    }).join('');
}

function renderizarResumenDiarioAnalisisIngresos(ventas) {
    const tabla = document.getElementById(
        'tabla-ingresos-diario-body'
    );

    const dias = new Map();

    ventas.forEach(venta => {
        const fecha =
            claveFechaLocalCXC(venta.fecha)
            || 'Sin fecha';

        const montos = montosVentaAnalisisIngresos(venta);

        if (!dias.has(fecha)) {
            dias.set(fecha, {
                fecha,
                ventas: 0,
                clientes: new Set(),
                vendido: 0,
                cobrado: 0,
                pendiente: 0
            });
        }

        const dia = dias.get(fecha);

        dia.ventas += 1;

        dia.clientes.add(
            claveClienteAnalisisIngresos(venta)
        );

        dia.vendido += montos.total;
        dia.cobrado += montos.cobrado;
        dia.pendiente += montos.pendiente;
    });

    const registros = [...dias.values()].sort((a, b) =>
        String(b.fecha).localeCompare(String(a.fecha))
    );

    document
        .getElementById('ingresos-diario-resumen')
        .textContent =
            `${registros.length} día(s) con movimientos`;

    if (registros.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="text-align:center; color:#6b7280;"
                >
                    No hay movimientos diarios para mostrar.
                </td>
            </tr>
        `;

        return;
    }

    tabla.innerHTML = registros.map(dia => `
        <tr>
            <td>
                ${formatearFechaCXC(dia.fecha)}
            </td>

            <td>${dia.ventas}</td>
            <td>${dia.clientes.size}</td>

            <td>
                <strong>
                    ${formatearMoneda(dia.vendido)}
                </strong>
            </td>

            <td class="amount-positive">
                ${formatearMoneda(dia.cobrado)}
            </td>

            <td class="amount-negative">
                ${formatearMoneda(dia.pendiente)}
            </td>
        </tr>
    `).join('');
}

function renderizarAnalisisIngresos(ventas) {
    actualizarResumenAnalisisIngresos(ventas);
    renderizarClientesAnalisisIngresos(ventas);
    renderizarProductosAnalisisIngresos(ventas);
    renderizarResumenDiarioAnalisisIngresos(ventas);
}

function aplicarBusquedaAnalisisIngresos() {
    const busqueda = normalizarBusqueda(
        document.getElementById('ingresos-busqueda').value
    );

    ventasAnalisisIngresosFiltradas = busqueda
        ? ventasAnalisisIngresosGlobal.filter(venta =>
            textoBusquedaVentaIngresos(venta)
                .includes(busqueda)
        )
        : [...ventasAnalisisIngresosGlobal];

    cerrarDetalleClienteIngresos();

    renderizarAnalisisIngresos(
        ventasAnalisisIngresosFiltradas
    );
}

async function obtenerAnalisisIngresos() {
    inicializarAnalisisIngresos();

    const sesion = obtenerSesion();

    const inicio = document
        .getElementById('ingresos-fecha-inicio')
        .value;

    const fin = document
        .getElementById('ingresos-fecha-fin')
        .value;

    const estado = document.getElementById(
        'ingresos-estado'
    );

    const boton = document.getElementById(
        'btn-actualizar-analisis-ingresos'
    );

    if (!sesion || !sesion.id_empresa || !estado) {
        return;
    }

    if (!inicio || !fin) {
        estado.classList.add('error');
        estado.textContent =
            'Selecciona la fecha inicial y la fecha final.';
        return;
    }

    if (inicio > fin) {
        estado.classList.add('error');
        estado.textContent =
            'La fecha inicial no puede ser posterior a la final.';
        return;
    }

    const numeroSolicitud = ++solicitudAnalisisIngresos;

    boton.disabled = true;
    boton.textContent = 'Actualizando...';

    estado.classList.remove('error');
    estado.textContent =
        'Consultando ventas y cobros...';

    cerrarDetalleClienteIngresos();

    try {
        const parametros = new URLSearchParams({
            fecha_inicio: inicio,
            fecha_fin: fin
        });

        const respuesta = await fetch(
            `/api/finanzas/ingresos/`
            + `${sesion.id_empresa}?`
            + parametros.toString(),
            {
                cache: 'no-store'
            }
        );

        const resultado = await respuesta.json();

        if (
            !respuesta.ok
            || resultado.status !== 'success'
            || !resultado.data
        ) {
            throw new Error(
                mensajeErrorAPI(
                    resultado,
                    'No se pudo cargar el análisis de ingresos.'
                )
            );
        }

        if (
            numeroSolicitud !== solicitudAnalisisIngresos
        ) {
            return;
        }

        ventasAnalisisIngresosGlobal =
            Array.isArray(resultado.data.ventas)
                ? resultado.data.ventas
                : [];

        aplicarBusquedaAnalisisIngresos();

        estado.textContent =
            ventasAnalisisIngresosGlobal.length > 0
                ? (
                    `${ventasAnalisisIngresosGlobal.length} `
                    + 'venta(s) encontrada(s) en el periodo.'
                )
                : (
                    'No hay ventas registradas en '
                    + 'el periodo seleccionado.'
                );
    } catch (error) {
        if (
            numeroSolicitud !== solicitudAnalisisIngresos
        ) {
            return;
        }

        console.error(
            'Error al cargar el análisis de ingresos:',
            error
        );

        ventasAnalisisIngresosGlobal = [];
        ventasAnalisisIngresosFiltradas = [];

        renderizarAnalisisIngresos([]);

        estado.classList.add('error');

        estado.textContent =
            error.message
            || 'No se pudo cargar el análisis de ingresos.';
    } finally {
        if (
            numeroSolicitud === solicitudAnalisisIngresos
        ) {
            boton.disabled = false;
            boton.textContent = 'Actualizar';
        }
    }
}

// ==========================================
// COMPROBANTES DE PAGO
// ==========================================
let comprobantesPagoGlobal = [];
let comprobantesPagoFiltrados = [];
let comprobantePagoSeleccionado = null;
let comprobantesPagoInicializados = false;
let solicitudComprobantesPago = 0;

function fechaISOComprobante(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
}

function folioComprobante(prefijo, id) {
    return (
        `${prefijo}-`
        + String(Number(id) || 0).padStart(6, '0')
    );
}

function ventaDePagoComprobante(pago) {
    return Array.isArray(pago.ventas)
        ? pago.ventas[0] || {}
        : pago.ventas || {};
}

function productosDeComprobante(venta) {
    return (venta?.ventas_detalle || []).map(detalle => ({
        nombre:
            detalle.nombre_producto
            || detalle.productos?.nombre
            || 'Producto sin nombre',

        sku:
            detalle.productos?.sku
            || 'Sin SKU',

        cantidad: Math.max(
            Number(detalle.cantidad || 0),
            0
        ),

        precio: Math.max(
            Number(detalle.precio_unitario || 0),
            0
        ),

        subtotal: Math.max(
            Number(detalle.subtotal || 0),
            0
        )
    }));
}

function normalizarVentaComoComprobante(venta, tipo) {
    const productos = productosDeComprobante(venta);

    const cliente = tipo === 'publico'
        ? 'Público general'
        : venta.cliente || 'Cliente registrado';

    const comprobante = {
        clave: `${tipo}-${Number(venta.id_venta)}`,
        tipo,
        folio: folioComprobante(
            'V',
            venta.id_venta
        ),
        id_venta: Number(venta.id_venta),
        fecha: venta.fecha,
        cliente,
        concepto:
            `Pago de venta de contado #${venta.id_venta}`,
        metodo:
            venta.metodo_pago
            || 'No especificado',
        importe: Number(venta.total || 0),
        saldo_antes: null,
        saldo_despues: null,
        referencia: null,
        notas: null,
        productos
    };

    comprobante.busqueda = normalizarBusqueda([
        comprobante.folio,
        comprobante.id_venta,
        comprobante.cliente,
        comprobante.metodo,

        ...productos.flatMap(producto => [
            producto.nombre,
            producto.sku
        ])
    ].join(' '));

    return comprobante;
}

function normalizarPagoCXCComoComprobante(pago) {
    const venta = ventaDePagoComprobante(pago);
    const productos = productosDeComprobante(venta);

    const comprobante = {
        clave: `cxc-${Number(pago.id_pago_cxc)}`,
        tipo: 'cxc',

        folio: folioComprobante(
            'CXC',
            pago.id_pago_cxc
        ),

        id_venta: Number(pago.id_venta),
        fecha: pago.fecha_pago,

        cliente:
            venta.cliente
            || 'Cliente registrado',

        concepto:
            pago.descripcion
            || `Abono a venta #${pago.id_venta}`,

        metodo:
            pago.metodo_pago
            || 'No especificado',

        importe: Number(pago.monto || 0),

        saldo_antes: Number(
            pago.saldo_antes || 0
        ),

        saldo_despues: Number(
            pago.saldo_despues || 0
        ),

        referencia: pago.referencia || null,
        notas: pago.notas || null,
        productos
    };

    comprobante.busqueda = normalizarBusqueda([
        comprobante.folio,
        comprobante.id_venta,
        comprobante.cliente,
        comprobante.concepto,
        comprobante.metodo,
        comprobante.referencia,
        comprobante.notas,

        ...productos.flatMap(producto => [
            producto.nombre,
            producto.sku
        ])
    ].join(' '));

    return comprobante;
}

function inicializarComprobantesPago() {
    if (comprobantesPagoInicializados) {
        return;
    }

    const inicio = document.getElementById(
        'comprobantes-fecha-inicio'
    );

    const fin = document.getElementById(
        'comprobantes-fecha-fin'
    );

    const hoy = new Date();

    inicio.value = fechaISOComprobante(
        new Date(
            hoy.getFullYear(),
            hoy.getMonth(),
            1
        )
    );

    fin.value = fechaISOComprobante(hoy);

    document
        .getElementById('btn-actualizar-comprobantes')
        .addEventListener(
            'click',
            obtenerComprobantesPago
        );

    inicio.addEventListener(
        'change',
        obtenerComprobantesPago
    );

    fin.addEventListener(
        'change',
        obtenerComprobantesPago
    );

    document
        .getElementById('comprobantes-busqueda')
        .addEventListener(
            'input',
            filtrarComprobantesPago
        );

    document
        .getElementById('btn-cerrar-comprobante')
        .addEventListener(
            'click',
            cerrarVistaPreviaComprobante
        );

    document
        .getElementById('btn-descargar-comprobante')
        .addEventListener(
            'click',
            imprimirComprobantePago
        );

    document
        .getElementById(
            'btn-restablecer-comprobantes'
        )
        .addEventListener('click', () => {
            const ahora = new Date();

            inicio.value = fechaISOComprobante(
                new Date(
                    ahora.getFullYear(),
                    ahora.getMonth(),
                    1
                )
            );

            fin.value = fechaISOComprobante(ahora);

            document.getElementById(
                'comprobantes-busqueda'
            ).value = '';

            obtenerComprobantesPago();
        });

    comprobantesPagoInicializados = true;
}

function resumenProductosComprobante(productos) {
    if (!productos.length) {
        return `
            <span style="color:#6b7280;">
                Sin detalle
            </span>
        `;
    }

    const lineas = productos
        .slice(0, 2)
        .map(producto =>
            `${escaparHTML(producto.nombre)} × `
            + `${producto.cantidad}`
        );

    if (productos.length > 2) {
        lineas.push(
            `y ${productos.length - 2} producto(s) más`
        );
    }

    return lineas.join('<br>');
}

function renderizarTablaVentasComprobantes(
    lista,
    tablaId,
    mostrarCliente
) {
    const tabla = document.getElementById(tablaId);
    const columnas = mostrarCliente ? 7 : 6;

    if (!lista.length) {
        tabla.innerHTML = `
            <tr>
                <td
                    colspan="${columnas}"
                    style="text-align:center; color:#6b7280;"
                >
                    No hay comprobantes para mostrar.
                </td>
            </tr>
        `;

        return;
    }

    tabla.innerHTML = lista.map(item => `
        <tr>
            <td>
                <strong>${item.folio}</strong>
            </td>

            <td>
                ${formatearFechaCXC(item.fecha, true)}
            </td>

            ${
                mostrarCliente
                    ? `
                        <td>
                            ${escaparHTML(item.cliente)}
                        </td>
                    `
                    : ''
            }

            <td>
                ${resumenProductosComprobante(
                    item.productos
                )}
            </td>

            <td>
                ${escaparHTML(item.metodo)}
            </td>

            <td>
                <strong>
                    ${formatearMoneda(item.importe)}
                </strong>
            </td>

            <td>
                <button
                    type="button"
                    class="btn-table btn-table-edit"
                    onclick="abrirComprobantePago(
                        '${item.clave}'
                    )"
                >
                    Ver comprobante
                </button>
            </td>
        </tr>
    `).join('');
}

function renderizarTablaCXCComprobantes(lista) {
    const tabla = document.getElementById(
        'tabla-comprobantes-cxc-body'
    );

    if (!lista.length) {
        tabla.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    style="text-align:center; color:#6b7280;"
                >
                    No hay anticipos ni abonos para mostrar.
                </td>
            </tr>
        `;

        return;
    }

    tabla.innerHTML = lista.map(item => `
        <tr>
            <td>
                <strong>${item.folio}</strong>
            </td>

            <td>
                ${formatearFechaCXC(item.fecha, true)}
            </td>

            <td>
                ${escaparHTML(item.cliente)}
            </td>

            <td>
                #${item.id_venta}
            </td>

            <td>
                ${escaparHTML(item.concepto)}
            </td>

            <td>
                ${escaparHTML(item.metodo)}
            </td>

            <td class="amount-positive">
                <strong>
                    ${formatearMoneda(item.importe)}
                </strong>
            </td>

            <td>
                ${formatearMoneda(item.saldo_despues)}
            </td>

            <td>
                <button
                    type="button"
                    class="btn-table btn-table-edit"
                    onclick="abrirComprobantePago(
                        '${item.clave}'
                    )"
                >
                    Ver comprobante
                </button>
            </td>
        </tr>
    `).join('');
}

function renderizarComprobantesPago() {
    const publico = comprobantesPagoFiltrados.filter(
        item => item.tipo === 'publico'
    );

    const clientes = comprobantesPagoFiltrados.filter(
        item => item.tipo === 'clientes'
    );

    const cxc = comprobantesPagoFiltrados.filter(
        item => item.tipo === 'cxc'
    );

    const importeTotal =
        comprobantesPagoFiltrados.reduce(
            (suma, item) => suma + item.importe,
            0
        );

    document
        .getElementById('comprobantes-total-registros')
        .textContent = comprobantesPagoFiltrados.length;

    document
        .getElementById('comprobantes-importe-total')
        .textContent = formatearMoneda(importeTotal);

    document
        .getElementById('comprobantes-total-ventas')
        .textContent =
            publico.length + clientes.length;

    document
        .getElementById('comprobantes-total-cxc')
        .textContent = cxc.length;

    document
        .getElementById('comprobantes-conteo-publico')
        .textContent = publico.length;

    document
        .getElementById('comprobantes-conteo-clientes')
        .textContent = clientes.length;

    document
        .getElementById('comprobantes-conteo-cxc')
        .textContent = cxc.length;

    const importePublico = publico.reduce(
        (suma, item) => suma + item.importe,
        0
    );

    const importeClientes = clientes.reduce(
        (suma, item) => suma + item.importe,
        0
    );

    const importeCXC = cxc.reduce(
        (suma, item) => suma + item.importe,
        0
    );

    document
        .getElementById('comprobantes-resumen-publico')
        .textContent =
            `${publico.length} comprobante(s) · `
            + formatearMoneda(importePublico);

    document
        .getElementById('comprobantes-resumen-clientes')
        .textContent =
            `${clientes.length} comprobante(s) · `
            + formatearMoneda(importeClientes);

    document
        .getElementById('comprobantes-resumen-cxc')
        .textContent =
            `${cxc.length} pago(s) · `
            + formatearMoneda(importeCXC);

    renderizarTablaVentasComprobantes(
        publico,
        'tabla-comprobantes-publico-body',
        false
    );

    renderizarTablaVentasComprobantes(
        clientes,
        'tabla-comprobantes-clientes-body',
        true
    );

    renderizarTablaCXCComprobantes(cxc);
}

function filtrarComprobantesPago() {
    const busqueda = normalizarBusqueda(
        document.getElementById(
            'comprobantes-busqueda'
        ).value
    );

    comprobantesPagoFiltrados = busqueda
        ? comprobantesPagoGlobal.filter(item =>
            item.busqueda.includes(busqueda)
        )
        : [...comprobantesPagoGlobal];

    cerrarVistaPreviaComprobante();
    renderizarComprobantesPago();
}

function cambiarPestanaComprobantes(tipo) {
    const pestanas = {
        publico: [
            'btn-comprobantes-publico',
            'comprobantes-panel-publico'
        ],

        clientes: [
            'btn-comprobantes-clientes',
            'comprobantes-panel-clientes'
        ],

        cxc: [
            'btn-comprobantes-cxc',
            'comprobantes-panel-cxc'
        ]
    };

    if (!pestanas[tipo]) {
        return;
    }

    Object.entries(pestanas).forEach(
        ([clave, elementos]) => {
            const [botonId, panelId] = elementos;
            const activo = clave === tipo;

            const boton =
                document.getElementById(botonId);

            document
                .getElementById(panelId)
                .classList.toggle(
                    'oculto',
                    !activo
                );

            boton.classList.toggle(
                'btn-primary',
                activo
            );

            boton.classList.toggle(
                'btn-secondary',
                !activo
            );

            boton.setAttribute(
                'aria-selected',
                String(activo)
            );
        }
    );

    cerrarVistaPreviaComprobante();
}

function nombreEmpresaComprobante() {
    const sesion = obtenerSesion() || {};

    return (
        sesion.nombre_empresa
        || sesion.razon_social
        || sesion.empresa
        || `Empresa #${sesion.id_empresa || ''}`
    );
}

function filasProductosComprobante(productos) {
    if (!productos.length) {
        return `
            <tr>
                <td
                    colspan="4"
                    style="text-align:center;"
                >
                    Sin detalle de productos
                </td>
            </tr>
        `;
    }

    return productos.map(producto => `
        <tr>
            <td>
                ${escaparHTML(producto.nombre)}
            </td>

            <td>
                ${producto.cantidad}
            </td>

            <td>
                ${formatearMoneda(producto.precio)}
            </td>

            <td>
                ${formatearMoneda(producto.subtotal)}
            </td>
        </tr>
    `).join('');
}

function contenidoDocumentoComprobante(item) {
    const saldos = item.tipo === 'cxc'
        ? `
            <div>
                <span>Saldo anterior</span>
                <strong>
                    ${formatearMoneda(item.saldo_antes)}
                </strong>
            </div>

            <div>
                <span>Saldo posterior</span>
                <strong>
                    ${formatearMoneda(item.saldo_despues)}
                </strong>
            </div>
        `
        : '';

    const referencia = item.referencia
        ? `
            <div>
                <span>Referencia</span>
                <strong>
                    ${escaparHTML(item.referencia)}
                </strong>
            </div>
        `
        : '';

    return `
        <article class="comprobante-recibo">
            <div class="comprobante-recibo-header">
                <div>
                    <p class="eyebrow">
                        Comprobante interno de pago
                    </p>

                    <h2>
                        ${escaparHTML(
                            nombreEmpresaComprobante()
                        )}
                    </h2>

                    <p>
                        Generado mediante BizPilot
                    </p>
                </div>

                <div>
                    <span>Folio interno</span>
                    <strong>${item.folio}</strong>
                </div>
            </div>

            <div class="cxc-account-summary">
                <div>
                    <span>Fecha del pago</span>

                    <strong>
                        ${formatearFechaCXC(
                            item.fecha,
                            true
                        )}
                    </strong>
                </div>

                <div>
                    <span>Recibido de</span>

                    <strong>
                        ${escaparHTML(item.cliente)}
                    </strong>
                </div>

                <div>
                    <span>Método</span>

                    <strong>
                        ${escaparHTML(item.metodo)}
                    </strong>
                </div>

                <div>
                    <span>Importe recibido</span>

                    <strong>
                        ${formatearMoneda(item.importe)}
                    </strong>
                </div>

                ${saldos}
                ${referencia}
            </div>

            <p>
                <strong>Concepto:</strong>
                ${escaparHTML(item.concepto)}
            </p>

            <div class="tabla-container">
                <table class="tabla-custom">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${filasProductosComprobante(
                            item.productos
                        )}
                    </tbody>
                </table>
            </div>

            ${
                item.notas
                    ? `
                        <p>
                            <strong>Notas:</strong>
                            ${escaparHTML(item.notas)}
                        </p>
                    `
                    : ''
            }

            <p class="financial-dashboard-note">
                Documento informativo sin validez fiscal.
                No sustituye un CFDI.
            </p>
        </article>
    `;
}

function abrirComprobantePago(clave) {
    const item = comprobantesPagoFiltrados.find(
        comprobante =>
            comprobante.clave === clave
    );

    if (!item) {
        return;
    }

    comprobantePagoSeleccionado = item;

    document
        .getElementById(
            'comprobante-vista-previa-titulo'
        )
        .textContent =
            `Comprobante ${item.folio}`;

    document
        .getElementById('comprobante-contenido')
        .innerHTML =
            contenidoDocumentoComprobante(item);

    const vista = document.getElementById(
        'comprobante-vista-previa'
    );

    vista.classList.remove('oculto');

    vista.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function cerrarVistaPreviaComprobante() {
    comprobantePagoSeleccionado = null;

    document
        .getElementById('comprobante-vista-previa')
        ?.classList.add('oculto');
}

function imprimirComprobantePago() {
    const item = comprobantePagoSeleccionado;

    if (!item) {
        alert(
            'Selecciona un comprobante primero.'
        );

        return;
    }

    const ventana = window.open(
        '',
        '_blank',
        'width=900,height=720'
    );

    if (!ventana) {
        alert(
            'Permite ventanas emergentes para '
            + 'guardar el comprobante.'
        );

        return;
    }

    ventana.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">

            <title>
                Comprobante ${item.folio}
            </title>

            <style>
                @page {
                    size: A4;
                    margin: 14mm;
                }

                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                    color: #111827;
                    font-family:
                        Arial,
                        sans-serif;
                }

                .comprobante-recibo {
                    max-width: 760px;
                    margin: auto;
                    padding: 24px;
                    border: 1px solid #d1d5db;
                    border-radius: 14px;
                }

                .comprobante-recibo-header {
                    display: flex;
                    justify-content: space-between;
                    gap: 24px;
                    padding-bottom: 18px;
                    margin-bottom: 18px;
                    border-bottom: 2px solid #111827;
                }

                .comprobante-recibo-header h2,
                .comprobante-recibo-header p {
                    margin: 4px 0;
                }

                .comprobante-recibo-header
                > div:last-child {
                    text-align: right;
                }

                span {
                    display: block;
                    margin-bottom: 5px;
                    color: #6b7280;
                    font-size: 12px;
                }

                .eyebrow {
                    color: #059669;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .cxc-account-summary {
                    display: grid;
                    grid-template-columns:
                        repeat(2, 1fr);
                    gap: 12px;
                    margin: 18px 0;
                }

                .cxc-account-summary > div {
                    padding: 12px;
                    border: 1px solid #e5e7eb;
                    border-radius: 9px;
                }

                table {
                    width: 100%;
                    margin-top: 18px;
                    border-collapse: collapse;
                }

                th,
                td {
                    padding: 10px;
                    border: 1px solid #d1d5db;
                    text-align: left;
                    font-size: 13px;
                }

                th {
                    background: #f3f4f6;
                }

                .financial-dashboard-note {
                    margin-top: 22px;
                    padding: 12px;
                    text-align: center;
                    background: #f9fafb;
                    font-size: 12px;
                }

                @media print {
                    .comprobante-recibo {
                        padding: 0;
                        border: 0;
                    }
                }
            </style>
        </head>

        <body>
            ${contenidoDocumentoComprobante(item)}
        </body>
        </html>
    `);

    ventana.document.close();

    setTimeout(() => {
        ventana.focus();
        ventana.print();
    }, 300);
}

async function obtenerComprobantesPago() {
    inicializarComprobantesPago();

    const sesion = obtenerSesion();

    const inicio = document.getElementById(
        'comprobantes-fecha-inicio'
    ).value;

    const fin = document.getElementById(
        'comprobantes-fecha-fin'
    ).value;

    const estado = document.getElementById(
        'comprobantes-estado'
    );

    const boton = document.getElementById(
        'btn-actualizar-comprobantes'
    );

    if (
        !sesion
        || !sesion.id_empresa
        || !estado
    ) {
        return;
    }

    if (!inicio || !fin || inicio > fin) {
        estado.classList.add('error');

        estado.textContent =
            'Selecciona un periodo de fechas válido.';

        return;
    }

    const numeroSolicitud =
        ++solicitudComprobantesPago;

    boton.disabled = true;
    boton.textContent = 'Actualizando...';

    estado.classList.remove('error');

    estado.textContent =
        'Consultando comprobantes...';

    try {
        const parametros = new URLSearchParams({
            fecha_inicio: inicio,
            fecha_fin: fin
        });

        const respuesta = await fetch(
            `/api/finanzas/comprobantes/`
            + `${sesion.id_empresa}?`
            + parametros.toString(),
            {
                cache: 'no-store'
            }
        );

        const resultado = await respuesta.json();

        if (
            !respuesta.ok
            || resultado.status !== 'success'
            || !resultado.data
        ) {
            throw new Error(
                mensajeErrorAPI(
                    resultado,
                    'No se pudieron cargar '
                    + 'los comprobantes.'
                )
            );
        }

        if (
            numeroSolicitud
            !== solicitudComprobantesPago
        ) {
            return;
        }

        const publico =
            resultado.data
                .ventas_publico_general
            || [];

        const clientes =
            resultado.data
                .ventas_clientes
            || [];

        const cxc =
            resultado.data.abonos_cxc
            || [];

        comprobantesPagoGlobal = [
            ...publico.map(venta =>
                normalizarVentaComoComprobante(
                    venta,
                    'publico'
                )
            ),

            ...clientes.map(venta =>
                normalizarVentaComoComprobante(
                    venta,
                    'clientes'
                )
            ),

            ...cxc.map(
                normalizarPagoCXCComoComprobante
            )
        ];

        filtrarComprobantesPago();

        estado.textContent =
            comprobantesPagoGlobal.length
                ? (
                    `${comprobantesPagoGlobal.length} `
                    + 'comprobante(s) encontrado(s).'
                )
                : (
                    'No hay comprobantes en '
                    + 'el periodo seleccionado.'
                );

    } catch (error) {
        if (
            numeroSolicitud
            !== solicitudComprobantesPago
        ) {
            return;
        }

        console.error(
            'Error al cargar comprobantes:',
            error
        );

        comprobantesPagoGlobal = [];
        comprobantesPagoFiltrados = [];

        renderizarComprobantesPago();

        estado.classList.add('error');

        estado.textContent =
            error.message
            || 'No se pudieron cargar los comprobantes.';

    } finally {
        if (
            numeroSolicitud
            === solicitudComprobantesPago
        ) {
            boton.disabled = false;
            boton.textContent = 'Actualizar';
        }
    }
}

// ==========================================
// GASTOS Y SALIDAS
// ==========================================


let movimientosGastosGlobal = [];
let filtrosGastosInicializados = false;

function fechaLocalGastos(valor) {
    if (!valor) return '';

    const texto = String(valor);
    const fecha = texto.length === 10
        ? new Date(`${texto}T00:00:00`)
        : new Date(valor);

    if (Number.isNaN(fecha.getTime())) return '';

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

function establecerMesActualGastos() {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    document.getElementById('gastos-fecha-inicio').value = fechaLocalGastos(primerDia);
    document.getElementById('gastos-fecha-fin').value = fechaLocalGastos(hoy);
}

function establecerFechaNuevoGasto() {
    document.getElementById('gasto-fecha').value = fechaLocalGastos(new Date());
}

function inicializarFiltrosGastos() {
    if (filtrosGastosInicializados) return;
    establecerMesActualGastos();
    establecerFechaNuevoGasto();
    filtrosGastosInicializados = true;
}

function mostrarFormularioGasto() {
    inicializarFiltrosGastos();
    document.getElementById('form-gasto-container').classList.remove('oculto');
    document.getElementById('gasto-concepto').focus();
}

function ocultarFormularioGasto() {
    document.getElementById('form-gasto-container').classList.add('oculto');
    document.getElementById('form-gasto').reset();
    establecerFechaNuevoGasto();
}

async function obtenerGastosAPI() {
    const sesion = obtenerSesion();
    const tabla = document.getElementById('tabla-gastos-body');
    if (!sesion || !tabla) return;

    inicializarFiltrosGastos();
    tabla.innerHTML = '<tr><td colspan="10" style="text-align:center;">Cargando gastos...</td></tr>';

    try {
        const respuesta = await fetch(`/api/gastos/${sesion.id_empresa}`);
        const resultado = await respuesta.json();

        if (!respuesta.ok || resultado.status !== 'success') {
            throw new Error(
                mensajeErrorAPI(resultado, 'No se pudieron consultar los gastos.')
            );
        }

        movimientosGastosGlobal = resultado.data || [];
        actualizarSelectoresGastos();
        filtrarGastos();
    } catch (error) {
        console.error('Error al cargar gastos:', error);
        movimientosGastosGlobal = [];
        actualizarResumenGastos([]);
        document.getElementById('gastos-resumen-registros').textContent = '';
        tabla.innerHTML = `
            <tr>
                <td colspan="10" style="text-align:center; color:#991b1b;">
                    No se pudieron cargar los gastos. Verifica la migración de Gastos.
                </td>
            </tr>
        `;
    }
}

function actualizarSelectoresGastos() {
    function rellenarSelector(selectorId, valores, etiquetaTodos) {
        const selector = document.getElementById(selectorId);
        const seleccionAnterior = selector.value;
        selector.innerHTML = [
            `<option value="todos">${etiquetaTodos}</option>`,
            ...valores.map(valor => (
                `<option value="${escaparHTML(valor)}">${escaparHTML(valor)}</option>`
            ))
        ].join('');

        selector.value = Array.from(selector.options).some(
            opcion => opcion.value === seleccionAnterior
        ) ? seleccionAnterior : 'todos';
    }

    const categorias = [...new Set(
        movimientosGastosGlobal.map(movimiento => movimiento.categoria).filter(Boolean)
    )].sort((a, b) => String(a).localeCompare(String(b), 'es'));

    const metodos = [...new Set(
        movimientosGastosGlobal.map(movimiento => movimiento.metodo_pago).filter(Boolean)
    )].sort((a, b) => String(a).localeCompare(String(b), 'es'));

    rellenarSelector('gastos-filtro-categoria', categorias, 'Todas');
    rellenarSelector('gastos-filtro-metodo', metodos, 'Todos');
}

function filtrarGastos() {
    const texto = document.getElementById('gastos-busqueda').value.trim().toLowerCase();
    const origen = document.getElementById('gastos-filtro-origen').value;
    const tipo = document.getElementById('gastos-filtro-tipo').value;
    const categoria = document.getElementById('gastos-filtro-categoria').value;
    const metodo = document.getElementById('gastos-filtro-metodo').value;
    const fechaInicio = document.getElementById('gastos-fecha-inicio').value;
    const fechaFin = document.getElementById('gastos-fecha-fin').value;

    const filtrados = movimientosGastosGlobal.filter(movimiento => {
        const fechaMovimiento = fechaLocalGastos(movimiento.fecha);
        const contenido = [
            movimiento.id_gasto,
            movimiento.id_compra,
            movimiento.origen,
            movimiento.tipo_gasto,
            movimiento.categoria,
            movimiento.concepto,
            movimiento.metodo_pago,
            movimiento.referencia,
            movimiento.notas
        ].join(' ').toLowerCase();

        return (
            (!texto || contenido.includes(texto))
            && (origen === 'todos' || movimiento.origen === origen)
            && (tipo === 'todos' || movimiento.tipo_gasto === tipo)
            && (categoria === 'todos' || movimiento.categoria === categoria)
            && (metodo === 'todos' || movimiento.metodo_pago === metodo)
            && (!fechaInicio || fechaMovimiento >= fechaInicio)
            && (!fechaFin || fechaMovimiento <= fechaFin)
        );
    });

    actualizarResumenGastos(filtrados);
    renderizarGastos(filtrados);
}

function actualizarResumenGastos(movimientos) {
    const resumen = movimientos.reduce(
        (acumulado, movimiento) => {
            const monto = Number(movimiento.monto || 0);
            acumulado.total += monto;
            if (movimiento.origen === 'Manual') acumulado.operativos += monto;
            else acumulado.compras += monto;
            return acumulado;
        },
        { total: 0, compras: 0, operativos: 0 }
    );

    document.getElementById('gastos-resumen-total').textContent = formatearMoneda(resumen.total);
    document.getElementById('gastos-resumen-compras').textContent = formatearMoneda(resumen.compras);
    document.getElementById('gastos-resumen-operativos').textContent = formatearMoneda(resumen.operativos);
    document.getElementById('gastos-resumen-movimientos').textContent = movimientos.length;
}

function renderizarGastos(movimientos) {
    const tabla = document.getElementById('tabla-gastos-body');
    document.getElementById('gastos-resumen-registros').textContent = (
        `${movimientos.length} de ${movimientosGastosGlobal.length} movimiento(s)`
    );

    if (movimientos.length === 0) {
        tabla.innerHTML = '<tr><td colspan="10" style="text-align:center;">No hay gastos que coincidan con los filtros.</td></tr>';
        return;
    }

    tabla.innerHTML = movimientos.map(movimiento => {
        let claseOrigen = 'badge-warning';
        if (movimiento.origen === 'Compras') claseOrigen = 'badge-success';
        if (movimiento.origen === 'Manual') claseOrigen = 'badge-danger';

        const incluirHora = String(movimiento.fecha || '').length > 10;
        const folio = movimiento.referencia
            || (movimiento.id_gasto ? `Gasto #${movimiento.id_gasto}` : '—');
        const accion = movimiento.anulable
            ? `<button type="button" class="btn-table btn-table-state" onclick="anularGastoManual(${Number(movimiento.id_gasto)})">Anular</button>`
            : '<span class="badge-neutral">Automático</span>';

        return `
            <tr>
                <td>${formatearFechaCXC(movimiento.fecha, incluirHora)}</td>
                <td><span class="${claseOrigen}">${escaparHTML(movimiento.origen)}</span></td>
                <td>${escaparHTML(movimiento.tipo_gasto)}</td>
                <td>${escaparHTML(movimiento.categoria)}</td>
                <td>${escaparHTML(movimiento.concepto)}</td>
                <td>${escaparHTML(folio)}</td>
                <td>${escaparHTML(movimiento.metodo_pago)}</td>
                <td>${escaparHTML(movimiento.notas || '—')}</td>
                <td><strong>-${formatearMoneda(movimiento.monto)}</strong></td>
                <td>${accion}</td>
            </tr>
        `;
    }).join('');
}

async function guardarGastoManual(event) {
    event.preventDefault();
    const sesion = obtenerSesion();
    const formulario = document.getElementById('form-gasto');
    const boton = formulario.querySelector('button[type="submit"]');
    if (!sesion) return;

    const payload = {
        id_empresa: sesion.id_empresa,
        categoria: document.getElementById('gasto-categoria').value,
        tipo_gasto: document.getElementById('gasto-tipo').value,
        concepto: document.getElementById('gasto-concepto').value.trim(),
        monto: Number(document.getElementById('gasto-monto').value),
        fecha_gasto: document.getElementById('gasto-fecha').value,
        metodo_pago: document.getElementById('gasto-metodo').value,
        referencia: document.getElementById('gasto-referencia').value.trim() || null,
        notas: document.getElementById('gasto-notas').value.trim() || null
    };

    if (!payload.categoria || !payload.concepto || !payload.fecha_gasto
        || !Number.isFinite(payload.monto) || payload.monto <= 0) {
        alert('Completa correctamente los campos obligatorios.');
        return;
    }

    boton.disabled = true;
    boton.textContent = 'Guardando...';
    try {
        const respuesta = await fetch('/api/gastos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const resultado = await respuesta.json();
        if (!respuesta.ok || !resultado.exito) {
            throw new Error(mensajeErrorAPI(resultado, 'No se pudo registrar el gasto.'));
        }

        alert(resultado.mensaje);
        ocultarFormularioGasto();
        await obtenerGastosAPI();
    } catch (error) {
        console.error('Error al registrar gasto:', error);
        alert(error.message);
    } finally {
        boton.disabled = false;
        boton.textContent = 'Guardar gasto';
    }
}

async function anularGastoManual(idGasto) {
    const sesion = obtenerSesion();
    if (!sesion || !idGasto) return;
    if (!window.confirm('¿Anular este gasto? Dejará de contarse en Finanzas.')) return;

    try {
        const respuesta = await fetch(`/api/gastos/${idGasto}/anular`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_empresa: sesion.id_empresa })
        });
        const resultado = await respuesta.json();
        if (!respuesta.ok || !resultado.exito) {
            throw new Error(mensajeErrorAPI(resultado, 'No se pudo anular el gasto.'));
        }

        alert(resultado.mensaje);
        await obtenerGastosAPI();
    } catch (error) {
        console.error('Error al anular gasto:', error);
        alert(error.message);
    }
}

function restablecerFiltrosGastos() {
    document.getElementById('gastos-busqueda').value = '';
    document.getElementById('gastos-filtro-origen').value = 'todos';
    document.getElementById('gastos-filtro-tipo').value = 'todos';
    document.getElementById('gastos-filtro-categoria').value = 'todos';
    document.getElementById('gastos-filtro-metodo').value = 'todos';
    establecerMesActualGastos();
    filtrarGastos();
}

// ==========================================
// CRM: PROSPECTOS
// ==========================================
let prospectosGlobal = [];
let prospectosFiltrados = [];
let prospectoEditandoId = null;
let solicitudProspectos = 0;
let prospectoSeguimientoId = null;
let seguimientosProspectoGlobal = [];
let solicitudSeguimientosProspecto = 0;

const estatusProspectosActivos = new Set([
    'Nuevo',
    'Contactado',
    'Calificado'
]);

function valorFechaLocalProspecto(valor) {
    const fecha = valor instanceof Date
        ? new Date(valor.getTime())
        : new Date(valor);

    if (Number.isNaN(fecha.getTime())) return '';

    const desplazamiento = fecha.getTimezoneOffset() * 60000;
    return new Date(fecha.getTime() - desplazamiento)
        .toISOString()
        .slice(0, 16);
}

function siguienteSeguimientoPredeterminado() {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 1);
    fecha.setHours(10, 0, 0, 0);
    return valorFechaLocalProspecto(fecha);
}

function limitesDiaProspecto() {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 1);

    const proximos = new Date(inicio);
    proximos.setDate(proximos.getDate() + 8);

    return { inicio, fin, proximos };
}

function tipoSeguimientoProspecto(prospecto) {
    if (
        !estatusProspectosActivos.has(prospecto.estatus)
        || !prospecto.proximo_seguimiento
    ) {
        return 'sin-fecha';
    }

    const seguimiento = new Date(prospecto.proximo_seguimiento);
    if (Number.isNaN(seguimiento.getTime())) return 'sin-fecha';

    const ahora = new Date();
    const { inicio, fin, proximos } = limitesDiaProspecto();

    if (seguimiento < ahora) return 'vencidos';
    if (seguimiento >= inicio && seguimiento < fin) return 'hoy';
    if (seguimiento >= fin && seguimiento < proximos) return 'proximos';
    return 'posterior';
}

function actualizarResumenProspectos() {
    const activos = prospectosGlobal.filter(
        prospecto => estatusProspectosActivos.has(prospecto.estatus)
    );

    const vencidos = activos.filter(
        prospecto => tipoSeguimientoProspecto(prospecto) === 'vencidos'
    );

    const hoy = activos.filter(
        prospecto => tipoSeguimientoProspecto(prospecto) === 'hoy'
    );

    const calificados = prospectosGlobal.filter(
        prospecto => prospecto.estatus === 'Calificado'
    );

    document.getElementById('prospectos-resumen-activos').textContent = activos.length;
    document.getElementById('prospectos-resumen-vencidos').textContent = vencidos.length;
    document.getElementById('prospectos-resumen-hoy').textContent = hoy.length;
    document.getElementById('prospectos-resumen-calificados').textContent = calificados.length;
}

function claseEstatusProspecto(estatus) {
    const clases = {
        Nuevo: 'badge-neutral',
        Contactado: 'badge-warning',
        Calificado: 'badge-success',
        Convertido: 'badge-success',
        Descartado: 'badge-danger'
    };

    return clases[estatus] || 'badge-neutral';
}

function renderizarProspectos() {
    const tabla = document.getElementById('tabla-prospectos-body');
    const resumen = document.getElementById('prospectos-resumen-registros');

    resumen.textContent = (
        `${prospectosFiltrados.length} de `
        + `${prospectosGlobal.length} prospecto(s)`
    );

    actualizarResumenProspectos();

    if (!prospectosFiltrados.length) {
        tabla.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;">
                    No hay prospectos que coincidan con los filtros.
                </td>
            </tr>
        `;
        return;
    }

    tabla.innerHTML = prospectosFiltrados.map(prospecto => {
        const tipoSeguimiento = tipoSeguimientoProspecto(prospecto);
        const claseSeguimiento = tipoSeguimiento === 'vencidos'
            ? 'badge-danger'
            : tipoSeguimiento === 'hoy' ? 'badge-warning' : '';

        const seguimiento = prospecto.proximo_seguimiento
            ? formatearFechaCXC(prospecto.proximo_seguimiento, true)
            : 'Sin seguimiento pendiente';

        const contactoPrincipal = prospecto.tipo_prospecto === 'Empresa'
            ? prospecto.contacto_principal || 'Sin contacto principal'
            : prospecto.nombre;

        const idProspecto = Number(prospecto.id_prospecto);
        const botonSeguimiento = `
            <button
                type="button"
                class="btn-table btn-table-view"
                onclick="abrirSeguimientoProspecto(${idProspecto})"
            >
                ${prospecto.estatus === 'Convertido' ? 'Historial' : 'Seguimiento'}
            </button>
        `;

        const botonEditar = prospecto.estatus === 'Convertido'
            ? '<span class="badge-neutral">Cerrado</span>'
            : `
                <button
                    type="button"
                    class="btn-table btn-table-edit"
                    onclick="mostrarFormularioProspecto(${idProspecto})"
                >
                    Editar
                </button>
            `;

        const accion = `
            <div class="form-actions">
                ${botonSeguimiento}
                ${botonEditar}
            </div>
        `;

        return `
            <tr>
                <td>
                    <strong>${escaparHTML(prospecto.nombre)}</strong>
                    <br>
                    <span class="badge-neutral">
                        ${escaparHTML(prospecto.tipo_prospecto)}
                    </span>
                </td>
                <td>
                    <div class="client-contact">
                        <span>${escaparHTML(contactoPrincipal)}</span>
                        <small>
                            ${escaparHTML(prospecto.telefono || 'Sin telefono')}
                            - ${escaparHTML(prospecto.email || 'Sin correo')}
                        </small>
                    </div>
                </td>
                <td>${escaparHTML(prospecto.interes_en)}</td>
                <td>${escaparHTML(prospecto.origen || 'Sin origen')}</td>
                <td>
                    <span class="${claseEstatusProspecto(prospecto.estatus)}">
                        ${escaparHTML(prospecto.estatus)}
                    </span>
                </td>
                <td>
                    ${
                        claseSeguimiento
                            ? `<span class="${claseSeguimiento}">${escaparHTML(seguimiento)}</span>`
                            : escaparHTML(seguimiento)
                    }
                </td>
                <td>${formatearFechaCXC(prospecto.fecha_actualizacion, true)}</td>
                <td>${accion}</td>
            </tr>
        `;
    }).join('');
}

function filtrarProspectos() {
    const busqueda = normalizarBusqueda(
        document.getElementById('prospectos-busqueda').value
    );

    const tipo = document.getElementById('prospectos-filtro-tipo').value;
    const estatus = document.getElementById('prospectos-filtro-estatus').value;
    const seguimiento = document.getElementById(
        'prospectos-filtro-seguimiento'
    ).value;

    prospectosFiltrados = prospectosGlobal.filter(prospecto => {
        const contenido = normalizarBusqueda([
            prospecto.nombre,
            prospecto.contacto_principal,
            prospecto.telefono,
            prospecto.email,
            prospecto.informacion_adicional,
            prospecto.interes_en,
            prospecto.origen,
            prospecto.comentarios,
            prospecto.motivo_descarte
        ].join(' '));

        const coincideSeguimiento = seguimiento === 'todos'
            || tipoSeguimientoProspecto(prospecto) === seguimiento;

        return (
            (!busqueda || contenido.includes(busqueda))
            && (tipo === 'todos' || prospecto.tipo_prospecto === tipo)
            && (estatus === 'todos' || prospecto.estatus === estatus)
            && coincideSeguimiento
        );
    });

    renderizarProspectos();
}

async function obtenerProspectosAPI() {
    const sesion = obtenerSesion();
    const tabla = document.getElementById('tabla-prospectos-body');
    const estado = document.getElementById('prospectos-estado');

    if (!sesion || !sesion.id_empresa || !tabla || !estado) return;

    const numeroSolicitud = ++solicitudProspectos;
    tabla.innerHTML = `
        <tr>
            <td colspan="8" style="text-align:center;">
                Cargando prospectos...
            </td>
        </tr>
    `;
    estado.classList.remove('error');
    estado.textContent = 'Consultando prospectos...';

    try {
        const respuesta = await fetch(
            `/api/prospectos/${sesion.id_empresa}`,
            { cache: 'no-store' }
        );
        const resultado = await respuesta.json();

        if (
            !respuesta.ok
            || resultado.status !== 'success'
            || !Array.isArray(resultado.data)
        ) {
            throw new Error(
                mensajeErrorAPI(
                    resultado,
                    'No se pudieron cargar los prospectos.'
                )
            );
        }

        if (numeroSolicitud !== solicitudProspectos) return;

        prospectosGlobal = resultado.data;
        filtrarProspectos();
        estado.textContent = prospectosGlobal.length
            ? `${prospectosGlobal.length} prospecto(s) cargado(s).`
            : 'Todavia no hay prospectos registrados.';
    } catch (error) {
        if (numeroSolicitud !== solicitudProspectos) return;

        console.error('Error al cargar prospectos:', error);
        prospectosGlobal = [];
        prospectosFiltrados = [];
        renderizarProspectos();
        estado.classList.add('error');
        estado.textContent = error.message
            || 'No se pudieron cargar los prospectos.';
    }
}

function actualizarCamposProspecto() {
    const tipo = document.getElementById('prospecto-tipo').value;
    const estatus = document.getElementById('prospecto-estatus').value;
    const esEmpresa = tipo === 'Empresa';
    const descartado = estatus === 'Descartado';

    const grupoContacto = document.getElementById('prospecto-contacto-grupo');
    const contacto = document.getElementById('prospecto-contacto');
    const etiquetaNombre = document.getElementById('prospecto-nombre-label');
    const grupoSeguimiento = document.getElementById('prospecto-seguimiento-grupo');
    const seguimiento = document.getElementById('prospecto-seguimiento');
    const grupoMotivo = document.getElementById('prospecto-motivo-grupo');
    const motivo = document.getElementById('prospecto-motivo');

    grupoContacto.classList.toggle('oculto', !esEmpresa);
    etiquetaNombre.textContent = esEmpresa
        ? 'Empresa o razon social'
        : 'Nombre completo';

    if (!esEmpresa) contacto.value = '';

    grupoSeguimiento.classList.toggle('oculto', descartado);
    seguimiento.required = !descartado;

    grupoMotivo.classList.toggle('oculto', !descartado);
    motivo.required = descartado;

    if (descartado) {
        seguimiento.value = '';
    } else {
        motivo.value = '';
        if (!seguimiento.value) {
            seguimiento.value = siguienteSeguimientoPredeterminado();
        }
    }
}

function mostrarFormularioProspecto(idProspecto = null) {
    const formulario = document.getElementById('formProspecto');
    const contenedor = document.getElementById('form-prospecto-container');
    const titulo = document.getElementById('form-prospecto-titulo');
    const boton = document.getElementById('btn-guardar-prospecto');
    const estado = document.getElementById('prospecto-form-estado');

    formulario.reset();
    estado.classList.remove('error');
    estado.textContent = '';
    prospectoEditandoId = idProspecto === null
        ? null
        : Number(idProspecto);

    if (prospectoEditandoId === null) {
        titulo.textContent = 'Registrar prospecto';
        boton.textContent = 'Guardar prospecto';
        document.getElementById('prospecto-tipo').value = 'Persona';
        document.getElementById('prospecto-estatus').value = 'Nuevo';
        document.getElementById('prospecto-seguimiento').value = (
            siguienteSeguimientoPredeterminado()
        );
    } else {
        const prospecto = prospectosGlobal.find(
            item => Number(item.id_prospecto) === prospectoEditandoId
        );

        if (!prospecto) {
            alert('No se encontro el prospecto. Actualiza la lista e intentalo de nuevo.');
            return;
        }

        if (prospecto.estatus === 'Convertido') {
            alert('Este prospecto ya se convirtio y debera administrarse desde Negociaciones.');
            return;
        }

        titulo.textContent = `Editar prospecto #${prospecto.id_prospecto}`;
        boton.textContent = 'Guardar cambios';
        document.getElementById('prospecto-tipo').value = prospecto.tipo_prospecto;
        document.getElementById('prospecto-nombre').value = prospecto.nombre || '';
        document.getElementById('prospecto-contacto').value = prospecto.contacto_principal || '';
        document.getElementById('prospecto-telefono').value = prospecto.telefono || '';
        document.getElementById('prospecto-email').value = prospecto.email || '';
        document.getElementById('prospecto-origen').value = prospecto.origen || '';
        document.getElementById('prospecto-estatus').value = prospecto.estatus;
        document.getElementById('prospecto-seguimiento').value = (
            valorFechaLocalProspecto(prospecto.proximo_seguimiento)
        );
        document.getElementById('prospecto-interes').value = prospecto.interes_en || '';
        document.getElementById('prospecto-informacion').value = prospecto.informacion_adicional || '';
        document.getElementById('prospecto-comentarios').value = prospecto.comentarios || '';
        document.getElementById('prospecto-motivo').value = prospecto.motivo_descarte || '';
    }

    actualizarCamposProspecto();
    contenedor.classList.remove('oculto');
    contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('prospecto-nombre').focus();
}

function ocultarFormularioProspecto() {
    document.getElementById('form-prospecto-container').classList.add('oculto');
    document.getElementById('formProspecto').reset();
    document.getElementById('prospecto-form-estado').textContent = '';
    prospectoEditandoId = null;
}

async function guardarProspecto(evento) {
    evento.preventDefault();

    const sesion = obtenerSesion();
    const boton = document.getElementById('btn-guardar-prospecto');
    const estadoFormulario = document.getElementById('prospecto-form-estado');
    const tipo = document.getElementById('prospecto-tipo').value;
    const estatus = document.getElementById('prospecto-estatus').value;
    const seguimientoLocal = document.getElementById('prospecto-seguimiento').value;

    if (!sesion || !sesion.id_empresa) return;

    const payload = {
        id_empresa: Number(sesion.id_empresa),
        tipo_prospecto: tipo,
        nombre: document.getElementById('prospecto-nombre').value.trim(),
        contacto_principal: tipo === 'Empresa'
            ? document.getElementById('prospecto-contacto').value.trim() || null
            : null,
        telefono: document.getElementById('prospecto-telefono').value.trim() || null,
        email: document.getElementById('prospecto-email').value.trim() || null,
        informacion_adicional: document.getElementById('prospecto-informacion').value.trim() || null,
        interes_en: document.getElementById('prospecto-interes').value.trim(),
        origen: document.getElementById('prospecto-origen').value.trim() || null,
        comentarios: document.getElementById('prospecto-comentarios').value.trim() || null,
        proximo_seguimiento: estatus === 'Descartado'
            ? null
            : seguimientoLocal ? new Date(seguimientoLocal).toISOString() : null,
        estatus,
        motivo_descarte: estatus === 'Descartado'
            ? document.getElementById('prospecto-motivo').value.trim() || null
            : null
    };

    if (!payload.nombre || !payload.interes_en) {
        estadoFormulario.classList.add('error');
        estadoFormulario.textContent = 'Completa el nombre y el interes del prospecto.';
        return;
    }

    if (estatus !== 'Descartado' && !payload.proximo_seguimiento) {
        estadoFormulario.classList.add('error');
        estadoFormulario.textContent = 'Indica el proximo seguimiento.';
        return;
    }

    if (estatus === 'Descartado' && !payload.motivo_descarte) {
        estadoFormulario.classList.add('error');
        estadoFormulario.textContent = 'Explica por que se descarto el prospecto.';
        return;
    }

    const editando = prospectoEditandoId !== null;
    const url = editando
        ? `/api/prospectos/${prospectoEditandoId}`
        : '/api/prospectos';

    boton.disabled = true;
    boton.textContent = editando ? 'Actualizando...' : 'Guardando...';
    estadoFormulario.classList.remove('error');
    estadoFormulario.textContent = 'Guardando informacion...';

    try {
        const respuesta = await fetch(url, {
            method: editando ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.exito) {
            throw new Error(
                mensajeErrorAPI(
                    resultado,
                    'No se pudo guardar el prospecto.'
                )
            );
        }

        ocultarFormularioProspecto();
        await obtenerProspectosAPI();
        alert(resultado.mensaje || 'Prospecto guardado exitosamente.');
    } catch (error) {
        console.error('Error al guardar prospecto:', error);
        estadoFormulario.classList.add('error');
        estadoFormulario.textContent = error.message
            || 'No se pudo guardar el prospecto.';
    } finally {
        boton.disabled = false;
        boton.textContent = editando
            ? 'Guardar cambios'
            : 'Guardar prospecto';
    }
}

function restablecerFiltrosProspectos() {
    document.getElementById('prospectos-busqueda').value = '';
    document.getElementById('prospectos-filtro-tipo').value = 'todos';
    document.getElementById('prospectos-filtro-estatus').value = 'todos';
    document.getElementById('prospectos-filtro-seguimiento').value = 'todos';
    filtrarProspectos();
}

function actualizarCamposSeguimientoProspecto() {
    const estatus = document.getElementById('seguimiento-estatus').value;
    const descartado = estatus === 'Descartado';

    const grupoAccion = document.getElementById(
        'seguimiento-proxima-accion-grupo'
    );
    const proximaAccion = document.getElementById(
        'seguimiento-proxima-accion'
    );
    const grupoFecha = document.getElementById(
        'seguimiento-proxima-fecha-grupo'
    );
    const proximaFecha = document.getElementById(
        'seguimiento-proxima-fecha'
    );
    const grupoMotivo = document.getElementById(
        'seguimiento-motivo-grupo'
    );
    const motivo = document.getElementById('seguimiento-motivo');

    grupoAccion.classList.toggle('oculto', descartado);
    grupoFecha.classList.toggle('oculto', descartado);
    grupoMotivo.classList.toggle('oculto', !descartado);

    proximaAccion.required = !descartado;
    proximaFecha.required = !descartado;
    motivo.required = descartado;

    if (descartado) {
        proximaAccion.value = '';
        proximaFecha.value = '';
    } else {
        motivo.value = '';
        if (!proximaFecha.value) {
            proximaFecha.value = siguienteSeguimientoPredeterminado();
        }
    }
}

function limpiarFormularioSeguimientoProspecto() {
    const formulario = document.getElementById(
        'formSeguimientoProspecto'
    );
    const estado = document.getElementById('seguimiento-form-estado');

    formulario.reset();
    estado.classList.remove('error');
    estado.textContent = '';

    const prospecto = prospectosGlobal.find(
        item => Number(item.id_prospecto) === prospectoSeguimientoId
    );

    document.getElementById('seguimiento-fecha').value = (
        valorFechaLocalProspecto(new Date())
    );
    document.getElementById('seguimiento-estatus').value = (
        prospecto && prospecto.estatus !== 'Convertido'
            ? prospecto.estatus
            : 'Nuevo'
    );
    document.getElementById('seguimiento-proxima-fecha').value = (
        prospecto && prospecto.proximo_seguimiento
            ? valorFechaLocalProspecto(prospecto.proximo_seguimiento)
            : siguienteSeguimientoPredeterminado()
    );

    actualizarCamposSeguimientoProspecto();
}

function renderizarSeguimientosProspecto() {
    const tabla = document.getElementById(
        'tabla-seguimientos-prospecto-body'
    );
    const resumen = document.getElementById(
        'seguimientos-resumen-registros'
    );

    resumen.textContent = (
        `${seguimientosProspectoGlobal.length} seguimiento(s) registrado(s)`
    );

    if (!seguimientosProspectoGlobal.length) {
        tabla.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;">
                    Todavia no hay seguimientos para este prospecto.
                </td>
            </tr>
        `;
        return;
    }

    tabla.innerHTML = seguimientosProspectoGlobal.map(item => {
        const cambioEstatus = (
            `${item.estatus_anterior || 'Sin estatus'} -> `
            + `${item.estatus_nuevo || 'Sin estatus'}`
        );

        const proximaAccion = item.estatus_nuevo === 'Descartado'
            ? `Motivo: ${item.motivo_descarte || 'Sin motivo'}`
            : item.proxima_accion || 'Sin accion';

        const proximoContacto = item.proximo_seguimiento
            ? formatearFechaCXC(item.proximo_seguimiento, true)
            : 'Sin proximo contacto';

        return `
            <tr>
                <td>${formatearFechaCXC(item.fecha_seguimiento, true)}</td>
                <td>${escaparHTML(item.tipo || '')}</td>
                <td>${escaparHTML(item.resultado || '')}</td>
                <td>${escaparHTML(cambioEstatus)}</td>
                <td>${escaparHTML(item.comentarios || '')}</td>
                <td>${escaparHTML(proximaAccion)}</td>
                <td>${escaparHTML(proximoContacto)}</td>
            </tr>
        `;
    }).join('');
}

async function obtenerSeguimientosProspecto() {
    const sesion = obtenerSesion();
    const estado = document.getElementById('seguimientos-estado');
    const tabla = document.getElementById(
        'tabla-seguimientos-prospecto-body'
    );

    if (
        !sesion
        || !sesion.id_empresa
        || !prospectoSeguimientoId
        || !estado
        || !tabla
    ) {
        return;
    }

    const idProspectoConsultado = prospectoSeguimientoId;
    const numeroSolicitud = ++solicitudSeguimientosProspecto;

    estado.classList.remove('error');
    estado.textContent = 'Consultando seguimientos...';
    tabla.innerHTML = `
        <tr>
            <td colspan="7" style="text-align:center;">
                Cargando historial...
            </td>
        </tr>
    `;

    try {
        const parametros = new URLSearchParams({
            id_empresa: String(sesion.id_empresa)
        });

        const respuesta = await fetch(
            `/api/prospectos/${idProspectoConsultado}/seguimientos?`
            + parametros.toString(),
            { cache: 'no-store' }
        );
        const resultado = await respuesta.json();

        if (
            !respuesta.ok
            || !resultado.exito
            || !Array.isArray(resultado.data)
        ) {
            throw new Error(
                mensajeErrorAPI(
                    resultado,
                    'No se pudieron cargar los seguimientos.'
                )
            );
        }

        if (
            numeroSolicitud !== solicitudSeguimientosProspecto
            || idProspectoConsultado !== prospectoSeguimientoId
        ) {
            return;
        }

        seguimientosProspectoGlobal = resultado.data;
        renderizarSeguimientosProspecto();
        estado.textContent = seguimientosProspectoGlobal.length
            ? 'Historial actualizado.'
            : 'Este prospecto aun no tiene seguimientos.';
    } catch (error) {
        if (
            numeroSolicitud !== solicitudSeguimientosProspecto
            || idProspectoConsultado !== prospectoSeguimientoId
        ) {
            return;
        }

        console.error('Error al cargar seguimientos:', error);
        seguimientosProspectoGlobal = [];
        renderizarSeguimientosProspecto();
        estado.classList.add('error');
        estado.textContent = error.message
            || 'No se pudieron cargar los seguimientos.';
    }
}

function abrirSeguimientoProspecto(idProspecto) {
    const prospecto = prospectosGlobal.find(
        item => Number(item.id_prospecto) === Number(idProspecto)
    );

    if (!prospecto) {
        alert('No se encontro el prospecto. Actualiza la lista e intentalo de nuevo.');
        return;
    }

    prospectoSeguimientoId = Number(idProspecto);
    seguimientosProspectoGlobal = [];

    document.getElementById('seguimiento-prospecto-titulo').textContent = (
        `Seguimiento: ${prospecto.nombre}`
    );
    document.getElementById('seguimiento-prospecto-resumen').textContent = (
        `${prospecto.tipo_prospecto} - ${prospecto.interes_en}`
    );

    ocultarFormularioProspecto();

    const contenedor = document.getElementById(
        'seguimiento-prospecto-container'
    );
    const formulario = document.getElementById(
        'formSeguimientoProspecto'
    );

    const convertido = prospecto.estatus === 'Convertido';
    formulario.classList.toggle('oculto', convertido);

    limpiarFormularioSeguimientoProspecto();
    contenedor.classList.remove('oculto');
    contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    obtenerSeguimientosProspecto();
}

function cerrarSeguimientoProspecto() {
    solicitudSeguimientosProspecto += 1;
    prospectoSeguimientoId = null;
    seguimientosProspectoGlobal = [];

    document.getElementById(
        'seguimiento-prospecto-container'
    ).classList.add('oculto');
    document.getElementById('formSeguimientoProspecto').reset();
    document.getElementById('seguimiento-form-estado').textContent = '';
    document.getElementById('seguimientos-estado').textContent = '';
    document.getElementById('seguimientos-resumen-registros').textContent = '';
    document.getElementById(
        'tabla-seguimientos-prospecto-body'
    ).innerHTML = '';
}

async function guardarSeguimientoProspecto(evento) {
    evento.preventDefault();

    const sesion = obtenerSesion();
    const estado = document.getElementById('seguimiento-form-estado');
    const boton = document.getElementById('btn-guardar-seguimiento');
    const estatus = document.getElementById('seguimiento-estatus').value;

    if (
        !sesion
        || !sesion.id_empresa
        || !sesion.id_usuario
        || !prospectoSeguimientoId
    ) {
        estado.classList.add('error');
        estado.textContent = 'La sesion no contiene empresa o usuario valido.';
        return;
    }

    const fechaContacto = document.getElementById(
        'seguimiento-fecha'
    ).value;
    const proximaFecha = document.getElementById(
        'seguimiento-proxima-fecha'
    ).value;

    const payload = {
        id_empresa: Number(sesion.id_empresa),
        id_usuario: Number(sesion.id_usuario),
        tipo: document.getElementById('seguimiento-tipo').value,
        fecha_seguimiento: fechaContacto
            ? new Date(fechaContacto).toISOString()
            : null,
        resultado: document.getElementById(
            'seguimiento-resultado'
        ).value,
        comentarios: document.getElementById(
            'seguimiento-comentarios'
        ).value.trim(),
        proxima_accion: estatus === 'Descartado'
            ? null
            : document.getElementById(
                'seguimiento-proxima-accion'
            ).value.trim() || null,
        proximo_seguimiento: estatus === 'Descartado'
            ? null
            : proximaFecha
                ? new Date(proximaFecha).toISOString()
                : null,
        estatus_nuevo: estatus,
        motivo_descarte: estatus === 'Descartado'
            ? document.getElementById(
                'seguimiento-motivo'
            ).value.trim() || null
            : null
    };

    if (!payload.fecha_seguimiento || !payload.comentarios) {
        estado.classList.add('error');
        estado.textContent = 'Completa la fecha y los comentarios del contacto.';
        return;
    }

    if (
        estatus !== 'Descartado'
        && (!payload.proxima_accion || !payload.proximo_seguimiento)
    ) {
        estado.classList.add('error');
        estado.textContent = 'Indica la proxima accion y su fecha.';
        return;
    }

    if (estatus === 'Descartado' && !payload.motivo_descarte) {
        estado.classList.add('error');
        estado.textContent = 'Indica el motivo de descarte.';
        return;
    }

    boton.disabled = true;
    boton.textContent = 'Guardando...';
    estado.classList.remove('error');
    estado.textContent = 'Guardando seguimiento...';

    try {
        const respuesta = await fetch(
            `/api/prospectos/${prospectoSeguimientoId}/seguimientos`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }
        );
        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.exito) {
            throw new Error(
                mensajeErrorAPI(
                    resultado,
                    'No se pudo guardar el seguimiento.'
                )
            );
        }

        await obtenerProspectosAPI();
        await obtenerSeguimientosProspecto();
        limpiarFormularioSeguimientoProspecto();
        estado.textContent = resultado.mensaje
            || 'Seguimiento guardado exitosamente.';
    } catch (error) {
        console.error('Error al guardar seguimiento:', error);
        estado.classList.add('error');
        estado.textContent = error.message
            || 'No se pudo guardar el seguimiento.';
    } finally {
        boton.disabled = false;
        boton.textContent = 'Guardar seguimiento';
    }
}

// ==========================================
// CRM: EMBUDO Y COTIZACIONES
// ==========================================
let oportunidadesCRMGlobal = [];
let oportunidadesCRMFiltradas = [];
let prospectosCalificadosCRM = [];
let oportunidadCRMEditandoId = null;
let oportunidadCotizacionCRMId = null;
let cotizacionCRMSeleccionadaId = null;
let solicitudEmbudoCRM = 0;
let secuenciaPartidaCotizacionCRM = 0;

const etapasEmbudoCRM = [
    'Interes detectado',
    'Preparando cotizacion',
    'Cotizacion enviada',
    'En revision',
    'Esperando decision'
];

const probabilidadEtapaCRM = {
    'Interes detectado': 10,
    'Preparando cotizacion': 30,
    'Cotizacion enviada': 50,
    'En revision': 70,
    'Esperando decision': 85
};

const columnasEmbudoCRM = {
    'Interes detectado': {
        cuerpo: 'embudo-columna-interes',
        conteo: 'embudo-conteo-interes'
    },
    'Preparando cotizacion': {
        cuerpo: 'embudo-columna-preparando',
        conteo: 'embudo-conteo-preparando'
    },
    'Cotizacion enviada': {
        cuerpo: 'embudo-columna-enviada',
        conteo: 'embudo-conteo-enviada'
    },
    'En revision': {
        cuerpo: 'embudo-columna-revision',
        conteo: 'embudo-conteo-revision'
    },
    'Esperando decision': {
        cuerpo: 'embudo-columna-decision',
        conteo: 'embudo-conteo-decision'
    }
};

function oportunidadCRMPorId(idOportunidad) {
    return oportunidadesCRMGlobal.find(
        item => Number(item.id_oportunidad) === Number(idOportunidad)
    ) || null;
}

function cotizacionCRMConOportunidad(idCotizacion) {
    for (const oportunidad of oportunidadesCRMGlobal) {
        const cotizacion = (oportunidad.cotizaciones || []).find(
            item => Number(item.id_cotizacion) === Number(idCotizacion)
        );

        if (cotizacion) return { cotizacion, oportunidad };
    }

    return null;
}

function opcionesEtapaEmbudoCRM(etapaActual) {
    return etapasEmbudoCRM.map(etapa => `
        <option
            value="${escaparHTML(etapa)}"
            ${etapa === etapaActual ? 'selected' : ''}
        >
            ${escaparHTML(etapa)}
        </option>
    `).join('');
}

function actualizarResumenEmbudoCRM() {
    const valor = oportunidadesCRMGlobal.reduce(
        (total, item) => total + Number(item.valor_estimado || 0),
        0
    );

    const enviadas = oportunidadesCRMGlobal.filter(
        item => item.cotizacion_actual?.estado === 'Enviada'
    ).length;

    const esperando = oportunidadesCRMGlobal.filter(
        item => item.etapa === 'Esperando decision'
    ).length;

    document.getElementById(
        'embudo-resumen-oportunidades'
    ).textContent = oportunidadesCRMGlobal.length;
    document.getElementById(
        'embudo-resumen-valor'
    ).textContent = formatearMoneda(valor);
    document.getElementById(
        'embudo-resumen-enviadas'
    ).textContent = enviadas;
    document.getElementById(
        'embudo-resumen-decision'
    ).textContent = esperando;
}

function tarjetaOportunidadCRM(oportunidad) {
    const prospecto = oportunidad.prospecto || {};
    const seguimiento = oportunidad.ultimo_seguimiento || {};
    const cotizacion = oportunidad.cotizacion_actual;

    const nombreProspecto = prospecto.nombre
        || `Prospecto #${oportunidad.id_prospecto}`;
    const interes = prospecto.interes_en || 'Sin interes registrado';
    const proximaAccion = seguimiento.proxima_accion
        || 'Sin proxima accion registrada';
    const proximoContacto = (
        seguimiento.proximo_seguimiento
        || prospecto.proximo_seguimiento
    );

    const resumenCotizacion = cotizacion
        ? `
            <div class="crm-card-quote">
                <strong>${escaparHTML(cotizacion.folio)}</strong>
                <p>
                    ${escaparHTML(cotizacion.estado)} -
                    ${formatearMoneda(cotizacion.total)}
                </p>
                <p>
                    Vigencia: ${formatearFechaCXC(cotizacion.vigencia_hasta)}
                </p>
            </div>
        `
        : `
            <div class="crm-card-quote">
                <p>Sin cotizacion registrada.</p>
            </div>
        `;

    return `
        <article class="crm-opportunity-card">
            <span class="crm-card-prospect">
                ${escaparHTML(nombreProspecto)}
            </span>
            <h4>${escaparHTML(oportunidad.titulo)}</h4>
            <p>${escaparHTML(interes)}</p>

            <div class="crm-card-metrics">
                <div>
                    <span>Valor</span>
                    <strong>${formatearMoneda(oportunidad.valor_estimado)}</strong>
                </div>
                <div>
                    <span>Probabilidad</span>
                    <strong>${Number(oportunidad.probabilidad || 0)}%</strong>
                </div>
            </div>

            <div class="crm-card-next-action">
                <strong>Proxima accion</strong>
                <p>${escaparHTML(proximaAccion)}</p>
                <p>
                    ${
                        proximoContacto
                            ? formatearFechaCXC(proximoContacto, true)
                            : 'Sin fecha programada'
                    }
                </p>
            </div>

            ${resumenCotizacion}

            <div class="crm-card-actions">
                <select
                    aria-label="Cambiar etapa"
                    onchange="cambiarEtapaOportunidadCRM(
                        ${Number(oportunidad.id_oportunidad)},
                        this
                    )"
                >
                    ${opcionesEtapaEmbudoCRM(oportunidad.etapa)}
                </select>
                <button
                    type="button"
                    class="btn-table btn-table-edit"
                    onclick="mostrarFormularioOportunidadCRM(
                        ${Number(oportunidad.id_oportunidad)}
                    )"
                >
                    Editar
                </button>
                <button
                    type="button"
                    class="btn-table btn-table-view"
                    onclick="mostrarFormularioCotizacionCRM(
                        ${Number(oportunidad.id_oportunidad)}
                    )"
                >
                    Cotizar
                </button>
                <button
                    type="button"
                    class="btn-table crm-btn-close-deal"
                    onclick="mostrarFormularioCierreNegociacionCRM(
                        ${Number(oportunidad.id_oportunidad)}
                    )"
                >
                    Cerrar
                </button>
            </div>
        </article>
    `;
}

function renderizarEmbudoCRM() {
    actualizarResumenEmbudoCRM();

    etapasEmbudoCRM.forEach(etapa => {
        const configuracion = columnasEmbudoCRM[etapa];
        const cuerpo = document.getElementById(configuracion.cuerpo);
        const conteo = document.getElementById(configuracion.conteo);
        const oportunidades = oportunidadesCRMFiltradas.filter(
            item => item.etapa === etapa
        );

        conteo.textContent = oportunidades.length;
        cuerpo.innerHTML = oportunidades.length
            ? oportunidades.map(tarjetaOportunidadCRM).join('')
            : '<p class="crm-empty-stage">Sin oportunidades en esta etapa.</p>';
    });
}

function filtrarEmbudoCRM() {
    const busqueda = normalizarBusqueda(
        document.getElementById('embudo-busqueda').value
    );
    const etapa = document.getElementById('embudo-filtro-etapa').value;

    oportunidadesCRMFiltradas = oportunidadesCRMGlobal.filter(item => {
        const prospecto = item.prospecto || {};
        const folios = (item.cotizaciones || [])
            .map(cotizacion => cotizacion.folio)
            .join(' ');

        const contenido = normalizarBusqueda([
            item.titulo,
            item.notas,
            item.etapa,
            prospecto.nombre,
            prospecto.contacto_principal,
            prospecto.interes_en,
            folios
        ].join(' '));

        return (
            (!busqueda || contenido.includes(busqueda))
            && (etapa === 'todas' || item.etapa === etapa)
        );
    });

    renderizarEmbudoCRM();
}

function restablecerFiltrosEmbudoCRM() {
    document.getElementById('embudo-busqueda').value = '';
    document.getElementById('embudo-filtro-etapa').value = 'todas';
    filtrarEmbudoCRM();
}

async function obtenerEmbudoCRM() {
    const sesion = obtenerSesion();
    const estado = document.getElementById('embudo-estado');

    if (!sesion || !sesion.id_empresa || !estado) return;

    const numeroSolicitud = ++solicitudEmbudoCRM;
    estado.classList.remove('error');
    estado.textContent = 'Consultando embudo y cotizaciones...';

    try {
        const respuesta = await fetch(
            `/api/crm/embudo/${sesion.id_empresa}`,
            { cache: 'no-store' }
        );
        const resultado = await respuesta.json();

        if (
            !respuesta.ok
            || !resultado.exito
            || !resultado.data
            || !Array.isArray(resultado.data.oportunidades)
            || !Array.isArray(resultado.data.prospectos_calificados)
        ) {
            throw new Error(
                mensajeErrorAPI(
                    resultado,
                    'No se pudo cargar el embudo.'
                )
            );
        }

        if (numeroSolicitud !== solicitudEmbudoCRM) return;

        oportunidadesCRMGlobal = resultado.data.oportunidades;
        prospectosCalificadosCRM = (
            resultado.data.prospectos_calificados
        );
        filtrarEmbudoCRM();

        estado.textContent = oportunidadesCRMGlobal.length
            ? `${oportunidadesCRMGlobal.length} oportunidad(es) activa(s).`
            : 'Todavia no hay oportunidades activas.';
    } catch (error) {
        if (numeroSolicitud !== solicitudEmbudoCRM) return;

        console.error('Error al cargar el embudo CRM:', error);
        oportunidadesCRMGlobal = [];
        oportunidadesCRMFiltradas = [];
        prospectosCalificadosCRM = [];
        renderizarEmbudoCRM();
        estado.classList.add('error');
        estado.textContent = error.message
            || 'No se pudo cargar el embudo.';
    }
}

function prospectosDisponiblesOportunidadCRM(idActual = null) {
    const prospectosOcupados = new Set(
        oportunidadesCRMGlobal
            .filter(
                item => Number(item.id_oportunidad) !== Number(idActual)
            )
            .map(item => Number(item.id_prospecto))
    );

    return prospectosCalificadosCRM.filter(
        prospecto => !prospectosOcupados.has(
            Number(prospecto.id_prospecto)
        )
    );
}

function llenarSelectorProspectosOportunidadCRM(idSeleccionado = null) {
    const selector = document.getElementById('oportunidad-prospecto');
    const prospectos = prospectosDisponiblesOportunidadCRM(
        oportunidadCRMEditandoId
    );

    selector.innerHTML = prospectos.length
        ? `
            <option value="">Selecciona un prospecto</option>
            ${prospectos.map(prospecto => `
                <option
                    value="${Number(prospecto.id_prospecto)}"
                    ${
                        Number(prospecto.id_prospecto)
                        === Number(idSeleccionado)
                            ? 'selected'
                            : ''
                    }
                >
                    ${escaparHTML(prospecto.nombre)}
                </option>
            `).join('')}
        `
        : '<option value="">No hay prospectos calificados disponibles</option>';
}

function sincronizarProbabilidadEtapaCRM() {
    const etapa = document.getElementById('oportunidad-etapa').value;
    document.getElementById('oportunidad-probabilidad').value = (
        probabilidadEtapaCRM[etapa] ?? 0
    );
}

function mostrarFormularioOportunidadCRM(idOportunidad = null) {
    const formulario = document.getElementById('formOportunidadCRM');
    const contenedor = document.getElementById(
        'form-oportunidad-container'
    );
    const titulo = document.getElementById('form-oportunidad-titulo');
    const boton = document.getElementById('btn-guardar-oportunidad');
    const estado = document.getElementById('oportunidad-form-estado');
    const selector = document.getElementById('oportunidad-prospecto');

    oportunidadCRMEditandoId = idOportunidad === null
        ? null
        : Number(idOportunidad);

    formulario.reset();
    estado.classList.remove('error');
    estado.textContent = '';

    if (oportunidadCRMEditandoId === null) {
        const disponibles = prospectosDisponiblesOportunidadCRM();
        if (!disponibles.length) {
            alert(
                'No hay prospectos Calificados disponibles. '
                + 'Califica un prospecto antes de crear la oportunidad.'
            );
            return;
        }

        titulo.textContent = 'Nueva oportunidad';
        boton.textContent = 'Guardar oportunidad';
        llenarSelectorProspectosOportunidadCRM();
        selector.disabled = false;
        document.getElementById('oportunidad-etapa').value = (
            'Interes detectado'
        );
        document.getElementById('oportunidad-valor').value = '0';
        sincronizarProbabilidadEtapaCRM();
    } else {
        const oportunidad = oportunidadCRMPorId(
            oportunidadCRMEditandoId
        );
        if (!oportunidad) {
            alert('No se encontro la oportunidad. Actualiza el embudo.');
            return;
        }

        titulo.textContent = (
            `Editar oportunidad #${oportunidad.id_oportunidad}`
        );
        boton.textContent = 'Guardar cambios';
        llenarSelectorProspectosOportunidadCRM(
            oportunidad.id_prospecto
        );
        selector.disabled = true;
        document.getElementById('oportunidad-titulo').value = (
            oportunidad.titulo || ''
        );
        document.getElementById('oportunidad-etapa').value = (
            oportunidad.etapa
        );
        document.getElementById('oportunidad-valor').value = (
            Number(oportunidad.valor_estimado || 0)
        );
        document.getElementById('oportunidad-probabilidad').value = (
            Number(oportunidad.probabilidad || 0)
        );
        document.getElementById('oportunidad-notas').value = (
            oportunidad.notas || ''
        );
    }

    cerrarFormularioCotizacionCRM();
    cerrarVistaCotizacionCRM();
    cerrarFormularioCierreNegociacionCRM();
    contenedor.classList.remove('oculto');
    contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function ocultarFormularioOportunidadCRM() {
    oportunidadCRMEditandoId = null;
    document.getElementById(
        'form-oportunidad-container'
    ).classList.add('oculto');
    document.getElementById('formOportunidadCRM').reset();
    document.getElementById('oportunidad-prospecto').disabled = false;
    document.getElementById('oportunidad-form-estado').textContent = '';
}

function payloadOportunidadCRM(oportunidad, etapaNueva = null) {
    const sesion = obtenerSesion();
    return {
        id_empresa: Number(sesion.id_empresa),
        id_usuario: Number(sesion.id_usuario),
        titulo: oportunidad.titulo,
        etapa: etapaNueva || oportunidad.etapa,
        valor_estimado: Number(oportunidad.valor_estimado || 0),
        probabilidad: etapaNueva
            ? probabilidadEtapaCRM[etapaNueva]
            : Number(oportunidad.probabilidad || 0),
        notas: oportunidad.notas || null
    };
}

async function guardarOportunidadCRM(evento) {
    evento.preventDefault();

    const sesion = obtenerSesion();
    const estado = document.getElementById('oportunidad-form-estado');
    const boton = document.getElementById('btn-guardar-oportunidad');
    const selector = document.getElementById('oportunidad-prospecto');

    if (!sesion || !sesion.id_empresa || !sesion.id_usuario) {
        estado.classList.add('error');
        estado.textContent = 'La sesion no contiene empresa o usuario valido.';
        return;
    }

    const payload = {
        id_empresa: Number(sesion.id_empresa),
        id_usuario: Number(sesion.id_usuario),
        titulo: document.getElementById('oportunidad-titulo').value.trim(),
        etapa: document.getElementById('oportunidad-etapa').value,
        valor_estimado: Number(
            document.getElementById('oportunidad-valor').value
        ),
        probabilidad: Number(
            document.getElementById('oportunidad-probabilidad').value
        ),
        notas: document.getElementById(
            'oportunidad-notas'
        ).value.trim() || null
    };

    if (oportunidadCRMEditandoId === null) {
        payload.id_prospecto = Number(selector.value);
    }

    if (
        !payload.titulo
        || !Number.isFinite(payload.valor_estimado)
        || payload.valor_estimado < 0
        || !Number.isInteger(payload.probabilidad)
        || payload.probabilidad < 0
        || payload.probabilidad > 100
        || (
            oportunidadCRMEditandoId === null
            && !payload.id_prospecto
        )
    ) {
        estado.classList.add('error');
        estado.textContent = 'Revisa prospecto, titulo, valor y probabilidad.';
        return;
    }

    const editando = oportunidadCRMEditandoId !== null;
    const url = editando
        ? `/api/crm/oportunidades/${oportunidadCRMEditandoId}`
        : '/api/crm/oportunidades';

    boton.disabled = true;
    boton.textContent = editando ? 'Actualizando...' : 'Guardando...';
    estado.classList.remove('error');
    estado.textContent = 'Guardando oportunidad...';

    try {
        const respuesta = await fetch(url, {
            method: editando ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.exito) {
            throw new Error(
                mensajeErrorAPI(
                    resultado,
                    'No se pudo guardar la oportunidad.'
                )
            );
        }

        ocultarFormularioOportunidadCRM();
        await obtenerEmbudoCRM();
        alert(resultado.mensaje || 'Oportunidad guardada exitosamente.');
    } catch (error) {
        console.error('Error al guardar oportunidad CRM:', error);
        estado.classList.add('error');
        estado.textContent = error.message
            || 'No se pudo guardar la oportunidad.';
    } finally {
        boton.disabled = false;
        boton.textContent = editando
            ? 'Guardar cambios'
            : 'Guardar oportunidad';
    }
}

async function cambiarEtapaOportunidadCRM(
    idOportunidad,
    selector
) {
    const sesion = obtenerSesion();
    const oportunidad = oportunidadCRMPorId(idOportunidad);
    const etapaAnterior = oportunidad?.etapa;
    const etapaNueva = selector.value;

    if (
        !sesion
        || !sesion.id_empresa
        || !sesion.id_usuario
        || !oportunidad
        || etapaNueva === etapaAnterior
    ) {
        return;
    }

    selector.disabled = true;

    try {
        const respuesta = await fetch(
            `/api/crm/oportunidades/${idOportunidad}`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    payloadOportunidadCRM(oportunidad, etapaNueva)
                )
            }
        );
        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.exito) {
            throw new Error(
                mensajeErrorAPI(
                    resultado,
                    'No se pudo cambiar la etapa.'
                )
            );
        }

        await obtenerEmbudoCRM();
    } catch (error) {
        console.error('Error al cambiar etapa CRM:', error);
        selector.value = etapaAnterior;
        selector.disabled = false;
        alert(error.message || 'No se pudo cambiar la etapa.');
    }
}

function fechaLocalISOCRM(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

function limpiarFormularioCotizacionCRM() {
    const formulario = document.getElementById('formCotizacionCRM');
    const estado = document.getElementById('cotizacion-form-estado');
    const vigencia = new Date();
    vigencia.setDate(vigencia.getDate() + 15);

    formulario.reset();
    estado.classList.remove('error');
    estado.textContent = '';
    document.getElementById('cotizacion-estado').value = 'Borrador';
    document.getElementById('cotizacion-vigencia').value = (
        fechaLocalISOCRM(vigencia)
    );
    document.getElementById('cotizacion-vigencia').min = (
        fechaLocalISOCRM(new Date())
    );
    document.getElementById('cotizacion-descuento').value = '0';
    document.getElementById('cotizacion-impuesto').value = '16';
    document.getElementById('cotizacion-partidas-body').innerHTML = '';
    agregarPartidaCotizacionCRM();
    calcularTotalesCotizacionCRM();
}

function agregarPartidaCotizacionCRM(datos = {}) {
    const cuerpo = document.getElementById('cotizacion-partidas-body');
    const idFila = ++secuenciaPartidaCotizacionCRM;
    const concepto = datos.concepto || '';
    const cantidad = Number(datos.cantidad ?? 1);
    const precio = Number(datos.precio_unitario ?? 0);

    cuerpo.insertAdjacentHTML('beforeend', `
        <tr data-partida-id="${idFila}">
            <td>
                <input
                    type="text"
                    class="crm-item-concept partida-concepto"
                    minlength="2"
                    maxlength="300"
                    value="${escaparHTML(concepto)}"
                    placeholder="Producto o servicio"
                    required
                >
            </td>
            <td>
                <input
                    type="number"
                    class="partida-cantidad"
                    min="0.01"
                    step="0.01"
                    value="${cantidad}"
                    oninput="calcularTotalesCotizacionCRM()"
                    required
                >
            </td>
            <td>
                <input
                    type="number"
                    class="partida-precio"
                    min="0"
                    step="0.01"
                    value="${precio}"
                    oninput="calcularTotalesCotizacionCRM()"
                    required
                >
            </td>
            <td>
                <strong class="partida-subtotal">$0.00</strong>
            </td>
            <td>
                <button
                    type="button"
                    class="btn-table btn-table-state"
                    onclick="eliminarPartidaCotizacionCRM(this)"
                >
                    Quitar
                </button>
            </td>
        </tr>
    `);

    calcularTotalesCotizacionCRM();
}

function eliminarPartidaCotizacionCRM(boton) {
    const fila = boton.closest('tr');
    if (fila) fila.remove();

    if (!document.querySelector('#cotizacion-partidas-body tr')) {
        agregarPartidaCotizacionCRM();
        return;
    }

    calcularTotalesCotizacionCRM();
}

function partidasFormularioCotizacionCRM() {
    return Array.from(
        document.querySelectorAll('#cotizacion-partidas-body tr')
    ).map(fila => ({
        concepto: fila.querySelector('.partida-concepto').value.trim(),
        cantidad: Number(
            fila.querySelector('.partida-cantidad').value
        ),
        precio_unitario: Number(
            fila.querySelector('.partida-precio').value
        )
    }));
}

function calcularTotalesCotizacionCRM() {
    const filas = Array.from(
        document.querySelectorAll('#cotizacion-partidas-body tr')
    );

    let subtotal = 0;

    filas.forEach(fila => {
        const cantidad = Number(
            fila.querySelector('.partida-cantidad').value
        ) || 0;
        const precio = Number(
            fila.querySelector('.partida-precio').value
        ) || 0;
        const subtotalPartida = cantidad * precio;
        subtotal += subtotalPartida;
        fila.querySelector('.partida-subtotal').textContent = (
            formatearMoneda(subtotalPartida)
        );
    });

    const porcentajeDescuento = Number(
        document.getElementById('cotizacion-descuento').value
    ) || 0;
    const porcentajeImpuesto = Number(
        document.getElementById('cotizacion-impuesto').value
    ) || 0;
    const descuento = subtotal * porcentajeDescuento / 100;
    const baseImpuesto = Math.max(subtotal - descuento, 0);
    const impuesto = baseImpuesto * porcentajeImpuesto / 100;
    const total = baseImpuesto + impuesto;

    document.getElementById(
        'cotizacion-total-subtotal'
    ).textContent = formatearMoneda(subtotal);
    document.getElementById(
        'cotizacion-total-descuento'
    ).textContent = formatearMoneda(descuento);
    document.getElementById(
        'cotizacion-total-impuesto'
    ).textContent = formatearMoneda(impuesto);
    document.getElementById(
        'cotizacion-total-final'
    ).textContent = formatearMoneda(total);

    return { subtotal, descuento, impuesto, total };
}

function renderizarHistorialCotizacionesCRM() {
    const cuerpo = document.getElementById(
        'cotizaciones-historial-body'
    );
    const resumen = document.getElementById(
        'cotizaciones-historial-resumen'
    );
    const oportunidad = oportunidadCRMPorId(
        oportunidadCotizacionCRMId
    );
    const cotizaciones = oportunidad?.cotizaciones || [];

    resumen.textContent = (
        `${cotizaciones.length} version(es) registrada(s)`
    );

    if (!cotizaciones.length) {
        cuerpo.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    Todavia no hay cotizaciones para esta oportunidad.
                </td>
            </tr>
        `;
        return;
    }

    cuerpo.innerHTML = cotizaciones.map(cotizacion => `
        <tr>
            <td><strong>${escaparHTML(cotizacion.folio)}</strong></td>
            <td>V${Number(cotizacion.version)}</td>
            <td>
                <span class="${
                    cotizacion.estado === 'Enviada'
                        ? 'badge-success'
                        : cotizacion.estado === 'Sustituida'
                            ? 'badge-neutral'
                            : 'badge-warning'
                }">
                    ${escaparHTML(cotizacion.estado)}
                </span>
            </td>
            <td>${formatearFechaCXC(cotizacion.vigencia_hasta)}</td>
            <td><strong>${formatearMoneda(cotizacion.total)}</strong></td>
            <td>
                <button
                    type="button"
                    class="btn-table btn-table-view"
                    onclick="verCotizacionCRM(
                        ${Number(cotizacion.id_cotizacion)}
                    )"
                >
                    Ver
                </button>
            </td>
        </tr>
    `).join('');
}

function mostrarFormularioCotizacionCRM(idOportunidad) {
    const oportunidad = oportunidadCRMPorId(idOportunidad);
    if (!oportunidad) {
        alert('No se encontro la oportunidad. Actualiza el embudo.');
        return;
    }

    oportunidadCotizacionCRMId = Number(idOportunidad);

    document.getElementById('form-cotizacion-titulo').textContent = (
        `Cotizar: ${oportunidad.titulo}`
    );
    document.getElementById('form-cotizacion-resumen').textContent = (
        `${oportunidad.prospecto?.nombre || 'Prospecto'} - `
        + `${oportunidad.cotizaciones?.length || 0} version(es)`
    );

    ocultarFormularioOportunidadCRM();
    cerrarVistaCotizacionCRM();
    cerrarFormularioCierreNegociacionCRM();
    limpiarFormularioCotizacionCRM();
    renderizarHistorialCotizacionesCRM();

    const contenedor = document.getElementById(
        'form-cotizacion-container'
    );
    contenedor.classList.remove('oculto');
    contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cerrarFormularioCotizacionCRM() {
    oportunidadCotizacionCRMId = null;
    document.getElementById(
        'form-cotizacion-container'
    ).classList.add('oculto');
    document.getElementById('formCotizacionCRM').reset();
    document.getElementById('cotizacion-form-estado').textContent = '';
    document.getElementById('cotizaciones-historial-body').innerHTML = '';
}

async function guardarCotizacionCRM(evento) {
    evento.preventDefault();

    const sesion = obtenerSesion();
    const estado = document.getElementById('cotizacion-form-estado');
    const boton = document.getElementById('btn-guardar-cotizacion');
    const partidas = partidasFormularioCotizacionCRM();

    if (
        !sesion
        || !sesion.id_empresa
        || !sesion.id_usuario
        || !oportunidadCotizacionCRMId
    ) {
        estado.classList.add('error');
        estado.textContent = 'La sesion o la oportunidad no son validas.';
        return;
    }

    const partidasInvalidas = partidas.some(item => (
        item.concepto.length < 2
        || !Number.isFinite(item.cantidad)
        || item.cantidad <= 0
        || !Number.isFinite(item.precio_unitario)
        || item.precio_unitario < 0
    ));

    const descuento = Number(
        document.getElementById('cotizacion-descuento').value
    );
    const impuesto = Number(
        document.getElementById('cotizacion-impuesto').value
    );
    const vigencia = document.getElementById(
        'cotizacion-vigencia'
    ).value;

    if (
        !partidas.length
        || partidasInvalidas
        || !vigencia
        || !Number.isFinite(descuento)
        || descuento < 0
        || descuento > 100
        || !Number.isFinite(impuesto)
        || impuesto < 0
        || impuesto > 100
    ) {
        estado.classList.add('error');
        estado.textContent = (
            'Revisa partidas, cantidades, precios, vigencia y porcentajes.'
        );
        return;
    }

    const payload = {
        id_empresa: Number(sesion.id_empresa),
        id_usuario: Number(sesion.id_usuario),
        estado: document.getElementById('cotizacion-estado').value,
        vigencia_hasta: vigencia,
        descuento_porcentaje: descuento,
        impuesto_porcentaje: impuesto,
        notas: document.getElementById(
            'cotizacion-notas'
        ).value.trim() || null,
        partidas
    };

    const idOportunidad = oportunidadCotizacionCRMId;
    boton.disabled = true;
    boton.textContent = 'Guardando...';
    estado.classList.remove('error');
    estado.textContent = 'Guardando nueva version...';

    try {
        const respuesta = await fetch(
            `/api/crm/oportunidades/${idOportunidad}/cotizaciones`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }
        );
        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.exito) {
            throw new Error(
                mensajeErrorAPI(
                    resultado,
                    'No se pudo guardar la cotizacion.'
                )
            );
        }

        await obtenerEmbudoCRM();
        mostrarFormularioCotizacionCRM(idOportunidad);
        document.getElementById('cotizacion-form-estado').textContent = (
            resultado.mensaje || 'Cotizacion guardada exitosamente.'
        );
    } catch (error) {
        console.error('Error al guardar cotizacion CRM:', error);
        estado.classList.add('error');
        estado.textContent = error.message
            || 'No se pudo guardar la cotizacion.';
    } finally {
        boton.disabled = false;
        boton.textContent = 'Guardar nueva version';
    }
}

function contenidoDocumentoCotizacionCRM(cotizacion, oportunidad) {
    const sesion = obtenerSesion() || {};
    const prospecto = oportunidad.prospecto || {};
    const nombreEmpresa = (
        document.getElementById('empresa-nombre')?.textContent
        || sesion.nombre_empresa
        || 'Empresa sin nombre'
    );

    const filas = (cotizacion.partidas || []).map(item => `
        <tr>
            <td>${escaparHTML(item.concepto)}</td>
            <td>${Number(item.cantidad).toLocaleString('es-MX')}</td>
            <td>${formatearMoneda(item.precio_unitario)}</td>
            <td>${formatearMoneda(item.subtotal)}</td>
        </tr>
    `).join('');

    return `
        <article class="crm-quote-document">
            <div class="crm-quote-document-header">
                <div>
                    <p class="eyebrow">Cotizacion comercial</p>
                    <h2>${escaparHTML(nombreEmpresa)}</h2>
                    <p>${escaparHTML(oportunidad.titulo)}</p>
                </div>
                <div>
                    <strong>${escaparHTML(cotizacion.folio)}</strong>
                    <p>Version ${Number(cotizacion.version)}</p>
                    <p>Vigencia: ${formatearFechaCXC(cotizacion.vigencia_hasta)}</p>
                </div>
            </div>

            <div class="crm-quote-client">
                <div>
                    <span>Prospecto</span>
                    <strong>${escaparHTML(prospecto.nombre || 'Sin nombre')}</strong>
                </div>
                <div>
                    <span>Contacto</span>
                    <strong>${escaparHTML(
                        prospecto.contacto_principal
                        || prospecto.telefono
                        || prospecto.email
                        || 'Sin contacto'
                    )}</strong>
                </div>
            </div>

            <table class="tabla-custom">
                <thead>
                    <tr>
                        <th>Concepto</th>
                        <th>Cantidad</th>
                        <th>Precio unitario</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${filas || '<tr><td colspan="4">Sin partidas</td></tr>'}
                </tbody>
            </table>

            <div class="crm-quote-totals">
                <div>
                    <span>Subtotal</span>
                    <strong>${formatearMoneda(cotizacion.subtotal)}</strong>
                </div>
                <div>
                    <span>Descuento (${Number(cotizacion.descuento_porcentaje)}%)</span>
                    <strong>${formatearMoneda(cotizacion.descuento)}</strong>
                </div>
                <div>
                    <span>Impuesto (${Number(cotizacion.impuesto_porcentaje)}%)</span>
                    <strong>${formatearMoneda(cotizacion.impuesto)}</strong>
                </div>
                <div class="crm-quote-total-main">
                    <span>Total</span>
                    <strong>${formatearMoneda(cotizacion.total)}</strong>
                </div>
            </div>

            <div class="crm-quote-document-footer">
                <strong>Notas</strong>
                <p>${escaparHTML(cotizacion.notas || 'Sin notas adicionales.')}</p>
            </div>
        </article>
    `;
}

function verCotizacionCRM(idCotizacion) {
    const seleccion = cotizacionCRMConOportunidad(idCotizacion);
    if (!seleccion) {
        alert('No se encontro la cotizacion. Actualiza el embudo.');
        return;
    }

    cotizacionCRMSeleccionadaId = Number(idCotizacion);
    document.getElementById('cotizacion-vista-titulo').textContent = (
        seleccion.cotizacion.folio
    );
    document.getElementById('cotizacion-vista-contenido').innerHTML = (
        contenidoDocumentoCotizacionCRM(
            seleccion.cotizacion,
            seleccion.oportunidad
        )
    );

    const contenedor = document.getElementById(
        'cotizacion-vista-previa'
    );
    contenedor.classList.remove('oculto');
    contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cerrarVistaCotizacionCRM() {
    cotizacionCRMSeleccionadaId = null;
    document.getElementById(
        'cotizacion-vista-previa'
    ).classList.add('oculto');
    document.getElementById('cotizacion-vista-contenido').innerHTML = '';
}

function imprimirCotizacionCRM() {
    const seleccion = cotizacionCRMConOportunidad(
        cotizacionCRMSeleccionadaId
    );

    if (!seleccion) {
        alert('Selecciona una cotizacion antes de imprimir.');
        return;
    }

    const ventana = window.open(
        '',
        '_blank',
        'width=1000,height=760'
    );

    if (!ventana) {
        alert('Permite ventanas emergentes para imprimir la cotizacion.');
        return;
    }

    const contenido = contenidoDocumentoCotizacionCRM(
        seleccion.cotizacion,
        seleccion.oportunidad
    );

    ventana.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>${escaparHTML(seleccion.cotizacion.folio)}</title>
            <style>
                @page { size: A4; margin: 14mm; }
                * { box-sizing: border-box; }
                body { margin: 0; color: #0f172a; font-family: Arial, sans-serif; }
                .crm-quote-document { max-width: 820px; margin: auto; }
                .crm-quote-document-header { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 16px; border-bottom: 2px solid #0f172a; }
                .crm-quote-document-header h2, .crm-quote-document-header p { margin: 4px 0; }
                .crm-quote-document-header > div:last-child { text-align: right; }
                .eyebrow { color: #059669; font-size: 12px; font-weight: 700; text-transform: uppercase; }
                .crm-quote-client { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 18px 0; }
                .crm-quote-client > div { padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; }
                span { display: block; margin-bottom: 4px; color: #64748b; font-size: 12px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 10px; border: 1px solid #d1d5db; text-align: left; font-size: 13px; }
                th { background: #f1f5f9; }
                .crm-quote-totals { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 18px; }
                .crm-quote-totals > div { padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; }
                .crm-quote-total-main { background: #ecfdf5; }
                .crm-quote-document-footer { margin-top: 18px; padding: 12px; background: #f8fafc; font-size: 12px; }
            </style>
        </head>
        <body>${contenido}</body>
        </html>
    `);

    ventana.document.close();

    setTimeout(() => {
        ventana.focus();
        ventana.print();
    }, 300);
}

// ==========================================
// CRM: CIERRE DE NEGOCIACIONES
// ==========================================
let oportunidadCierreCRMId = null;
let clientesCierreCRM = [];

function fechaISOCRM(fecha = new Date()) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

function cotizacionesOportunidadCierreCRM() {
    const oportunidad = oportunidadCRMPorId(oportunidadCierreCRMId);
    return oportunidad?.cotizaciones || [];
}

function llenarSelectorCotizacionesCierreCRM() {
    const selector = document.getElementById('cierre-cotizacion');
    const oportunidad = oportunidadCRMPorId(oportunidadCierreCRMId);
    const cotizaciones = cotizacionesOportunidadCierreCRM();
    const idActual = Number(
        oportunidad?.cotizacion_actual?.id_cotizacion || 0
    );

    selector.innerHTML = cotizaciones.length
        ? `
            <option value="">Selecciona una cotizacion</option>
            ${cotizaciones.map(cotizacion => `
                <option
                    value="${Number(cotizacion.id_cotizacion)}"
                    ${
                        Number(cotizacion.id_cotizacion) === idActual
                            ? 'selected'
                            : ''
                    }
                >
                    ${escaparHTML(cotizacion.folio)} - V${Number(cotizacion.version)} - ${formatearMoneda(cotizacion.total)}
                </option>
            `).join('')}
        `
        : '<option value="">Sin cotizaciones registradas</option>';
}

function llenarSelectorClientesCierreCRM() {
    const selector = document.getElementById('cierre-cliente');
    const clientesActivos = clientesCierreCRM.filter(
        cliente => cliente.activo !== false
    );

    selector.innerHTML = `
        <option value="">Crear o vincular automaticamente desde el prospecto</option>
        ${clientesActivos.map(cliente => `
            <option value="${Number(cliente.id_cliente)}">
                ${escaparHTML(cliente.nombre || `Cliente #${cliente.id_cliente}`)}
            </option>
        `).join('')}
    `;
}

async function cargarClientesCierreCRM() {
    const sesion = obtenerSesion();
    if (!sesion?.id_empresa) return;

    try {
        const respuesta = await fetch(
            `/api/clientes/${sesion.id_empresa}`,
            { cache: 'no-store' }
        );
        const resultado = await respuesta.json();

        if (
            !respuesta.ok
            || resultado.status !== 'success'
            || !Array.isArray(resultado.data)
        ) {
            throw new Error('No se pudo cargar el directorio de clientes.');
        }

        clientesCierreCRM = resultado.data;
        llenarSelectorClientesCierreCRM();
    } catch (error) {
        console.error('Error al cargar clientes para el cierre:', error);
        clientesCierreCRM = [];
        llenarSelectorClientesCierreCRM();
        document.getElementById('cierre-form-estado').textContent = (
            'No se pudo cargar el directorio. Puedes dejar el cliente en automatico.'
        );
    }
}

function sincronizarMontoCierreCRM() {
    const idCotizacion = Number(
        document.getElementById('cierre-cotizacion').value || 0
    );
    const cotizacion = cotizacionesOportunidadCierreCRM().find(
        item => Number(item.id_cotizacion) === idCotizacion
    );

    if (cotizacion) {
        document.getElementById('cierre-monto').value = Number(
            cotizacion.total || 0
        ).toFixed(2);
    }
}

function actualizarCamposCierreNegociacionCRM() {
    const compro = document.getElementById('cierre-resultado').value === (
        'Compro'
    );
    const cotizacion = document.getElementById('cierre-cotizacion');
    const monto = document.getElementById('cierre-monto');
    const motivo = document.getElementById('cierre-motivo');

    document.getElementById('cierre-monto-grupo').classList.toggle(
        'oculto',
        !compro
    );
    document.getElementById('cierre-cliente-grupo').classList.toggle(
        'oculto',
        !compro
    );
    document.getElementById('cierre-motivo-grupo').classList.toggle(
        'oculto',
        compro
    );

    cotizacion.required = compro;
    monto.required = compro;
    motivo.required = !compro;

    if (compro) {
        motivo.value = '';
        sincronizarMontoCierreCRM();
    } else {
        document.getElementById('cierre-cliente').value = '';
        monto.value = '0';
    }
}

async function mostrarFormularioCierreNegociacionCRM(idOportunidad) {
    const oportunidad = oportunidadCRMPorId(idOportunidad);
    if (!oportunidad) {
        alert('No se encontro la oportunidad. Actualiza el embudo.');
        return;
    }

    oportunidadCierreCRMId = Number(idOportunidad);
    const formulario = document.getElementById(
        'formCierreNegociacionCRM'
    );
    const hoy = fechaISOCRM();

    formulario.reset();
    document.getElementById('cierre-fecha').value = hoy;
    document.getElementById('cierre-fecha').max = hoy;
    document.getElementById('cierre-resultado').value = 'Compro';
    document.getElementById('cierre-form-estado').classList.remove('error');
    document.getElementById('cierre-form-estado').textContent = '';
    document.getElementById(
        'form-cierre-oportunidad-titulo'
    ).textContent = `Cerrar: ${oportunidad.titulo}`;
    document.getElementById(
        'form-cierre-oportunidad-resumen'
    ).textContent = (
        `${oportunidad.prospecto?.nombre || 'Prospecto'} - `
        + `${oportunidad.cotizaciones?.length || 0} cotizacion(es)`
    );

    llenarSelectorCotizacionesCierreCRM();
    llenarSelectorClientesCierreCRM();
    actualizarCamposCierreNegociacionCRM();

    ocultarFormularioOportunidadCRM();
    cerrarFormularioCotizacionCRM();
    cerrarVistaCotizacionCRM();

    const contenedor = document.getElementById(
        'form-cierre-oportunidad-container'
    );
    contenedor.classList.remove('oculto');
    contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });

    await cargarClientesCierreCRM();
}

function cerrarFormularioCierreNegociacionCRM() {
    oportunidadCierreCRMId = null;
    const contenedor = document.getElementById(
        'form-cierre-oportunidad-container'
    );
    if (!contenedor) return;

    contenedor.classList.add('oculto');
    document.getElementById('formCierreNegociacionCRM').reset();
    document.getElementById('cierre-form-estado').textContent = '';
}

async function guardarCierreNegociacionCRM(evento) {
    evento.preventDefault();

    const sesion = obtenerSesion();
    const estado = document.getElementById('cierre-form-estado');
    const boton = document.getElementById('btn-guardar-cierre');
    const resultadoCierre = document.getElementById(
        'cierre-resultado'
    ).value;
    const compro = resultadoCierre === 'Compro';
    const idCotizacion = Number(
        document.getElementById('cierre-cotizacion').value || 0
    );
    const idCliente = Number(
        document.getElementById('cierre-cliente').value || 0
    );
    const montoFinal = Number(
        document.getElementById('cierre-monto').value || 0
    );
    const motivo = document.getElementById(
        'cierre-motivo'
    ).value.trim();
    const fechaCierre = document.getElementById('cierre-fecha').value;

    if (
        !sesion?.id_empresa
        || !sesion?.id_usuario
        || !oportunidadCierreCRMId
    ) {
        estado.classList.add('error');
        estado.textContent = 'La sesion o la oportunidad no son validas.';
        return;
    }

    if (
        !fechaCierre
        || fechaCierre > fechaISOCRM()
        || (compro && (!idCotizacion || montoFinal <= 0))
        || (!compro && !motivo)
    ) {
        estado.classList.add('error');
        estado.textContent = compro
            ? 'Selecciona cotizacion, fecha y un monto final mayor a cero.'
            : 'Selecciona la fecha e indica el motivo de perdida.';
        return;
    }

    const oportunidad = oportunidadCRMPorId(oportunidadCierreCRMId);
    const confirmado = window.confirm(
        `Vas a cerrar "${oportunidad?.titulo || 'esta oportunidad'}" como "${resultadoCierre}". Esta accion sacara la oportunidad del embudo. Deseas continuar?`
    );
    if (!confirmado) return;

    const payload = {
        id_empresa: Number(sesion.id_empresa),
        id_usuario: Number(sesion.id_usuario),
        resultado: resultadoCierre,
        id_cotizacion: idCotizacion || null,
        id_cliente: compro && idCliente ? idCliente : null,
        monto_final: compro ? montoFinal : 0,
        motivo_perdida: compro ? null : motivo,
        notas: document.getElementById(
            'cierre-notas'
        ).value.trim() || null,
        fecha_cierre: fechaCierre
    };
    const idOportunidad = oportunidadCierreCRMId;

    boton.disabled = true;
    boton.textContent = 'Cerrando...';
    estado.classList.remove('error');
    estado.textContent = 'Registrando resultado final...';

    try {
        const respuesta = await fetch(
            `/api/crm/oportunidades/${idOportunidad}/cerrar`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }
        );
        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.exito) {
            throw new Error(
                mensajeErrorAPI(
                    resultado,
                    'No se pudo cerrar la negociacion.'
                )
            );
        }

        cerrarFormularioCierreNegociacionCRM();
        await obtenerEmbudoCRM();
        alert(resultado.mensaje || 'Negociacion cerrada exitosamente.');
    } catch (error) {
        console.error('Error al cerrar negociacion CRM:', error);
        estado.classList.add('error');
        estado.textContent = error.message
            || 'No se pudo cerrar la negociacion.';
    } finally {
        boton.disabled = false;
        boton.textContent = 'Cerrar negociacion';
    }
}

// ==========================================
// CRM: NEGOCIACIONES CERRADAS
// ==========================================
let negociacionesCerradasCRMGlobal = [];
let negociacionesCerradasCRMFiltradas = [];
let solicitudNegociacionesCRM = 0;

function claseResultadoNegociacionCRM(resultado) {
    return resultado === 'Compro'
        ? 'badge-success'
        : 'badge-danger';
}

function textoBusquedaNegociacionCRM(negociacion) {
    return normalizarBusqueda([
        negociacion.resultado,
        negociacion.motivo_perdida,
        negociacion.notas,
        negociacion.prospecto?.nombre,
        negociacion.prospecto?.contacto_principal,
        negociacion.prospecto?.telefono,
        negociacion.prospecto?.email,
        negociacion.oportunidad?.titulo,
        negociacion.cotizacion?.folio,
        negociacion.cliente?.nombre
    ].join(' '));
}

function actualizarResumenNegociacionesCerradasCRM() {
    const ganadas = negociacionesCerradasCRMGlobal.filter(
        item => item.resultado === 'Compro'
    );
    const perdidas = negociacionesCerradasCRMGlobal.filter(
        item => item.resultado === 'No compro'
    );
    const total = negociacionesCerradasCRMGlobal.length;
    const conversion = total ? ganadas.length * 100 / total : 0;
    const monto = ganadas.reduce(
        (suma, item) => suma + Number(item.monto_final || 0),
        0
    );

    document.getElementById(
        'negociaciones-resumen-total'
    ).textContent = total;
    document.getElementById(
        'negociaciones-resumen-ganadas'
    ).textContent = ganadas.length;
    document.getElementById(
        'negociaciones-resumen-perdidas'
    ).textContent = perdidas.length;
    document.getElementById(
        'negociaciones-resumen-conversion'
    ).textContent = `${conversion.toFixed(1)}%`;
    document.getElementById(
        'negociaciones-resumen-monto'
    ).textContent = formatearMoneda(monto);
}

function renderizarNegociacionesCerradasCRM() {
    const cuerpo = document.getElementById(
        'negociaciones-cerradas-body'
    );
    const resumen = document.getElementById(
        'negociaciones-cerradas-resumen'
    );

    actualizarResumenNegociacionesCerradasCRM();
    resumen.textContent = (
        `${negociacionesCerradasCRMFiltradas.length} de `
        + `${negociacionesCerradasCRMGlobal.length} cierre(s)`
    );

    if (!negociacionesCerradasCRMFiltradas.length) {
        cuerpo.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;">
                    No hay negociaciones cerradas para estos filtros.
                </td>
            </tr>
        `;
        return;
    }

    cuerpo.innerHTML = negociacionesCerradasCRMFiltradas.map(
        negociacion => `
            <tr>
                <td>${formatearFechaCXC(negociacion.fecha_cierre)}</td>
                <td>
                    <strong>${escaparHTML(
                        negociacion.prospecto?.nombre || 'Sin prospecto'
                    )}</strong>
                </td>
                <td>${escaparHTML(
                    negociacion.oportunidad?.titulo || 'Sin oportunidad'
                )}</td>
                <td>${escaparHTML(
                    negociacion.cotizacion?.folio || 'Sin cotizacion'
                )}</td>
                <td>
                    <span class="${claseResultadoNegociacionCRM(
                        negociacion.resultado
                    )}">
                        ${escaparHTML(negociacion.resultado)}
                    </span>
                </td>
                <td>
                    <strong>${
                        negociacion.resultado === 'Compro'
                            ? formatearMoneda(negociacion.monto_final)
                            : '-'
                    }</strong>
                </td>
                <td>${escaparHTML(
                    negociacion.cliente?.nombre || '-'
                )}</td>
                <td>
                    <button
                        type="button"
                        class="btn-table btn-table-view"
                        onclick="verDetalleNegociacionCRM(
                            ${Number(negociacion.id_negociacion)}
                        )"
                    >
                        Ver
                    </button>
                </td>
            </tr>
        `
    ).join('');
}

function filtrarNegociacionesCerradasCRM() {
    const busqueda = normalizarBusqueda(
        document.getElementById('negociaciones-busqueda').value
    );
    const resultado = document.getElementById(
        'negociaciones-filtro-resultado'
    ).value;
    const inicio = document.getElementById(
        'negociaciones-fecha-inicio'
    ).value;
    const fin = document.getElementById(
        'negociaciones-fecha-fin'
    ).value;

    negociacionesCerradasCRMFiltradas = (
        negociacionesCerradasCRMGlobal.filter(negociacion => {
            const fecha = String(negociacion.fecha_cierre || '').slice(0, 10);
            return (
                (!busqueda || textoBusquedaNegociacionCRM(
                    negociacion
                ).includes(busqueda))
                && (
                    resultado === 'todos'
                    || negociacion.resultado === resultado
                )
                && (!inicio || fecha >= inicio)
                && (!fin || fecha <= fin)
            );
        })
    );

    cerrarDetalleNegociacionCRM();
    renderizarNegociacionesCerradasCRM();
}

function restablecerFiltrosNegociacionesCerradasCRM() {
    document.getElementById('negociaciones-busqueda').value = '';
    document.getElementById(
        'negociaciones-filtro-resultado'
    ).value = 'todos';
    document.getElementById('negociaciones-fecha-inicio').value = '';
    document.getElementById('negociaciones-fecha-fin').value = '';
    filtrarNegociacionesCerradasCRM();
}

function verDetalleNegociacionCRM(idNegociacion) {
    const negociacion = negociacionesCerradasCRMGlobal.find(
        item => Number(item.id_negociacion) === Number(idNegociacion)
    );
    if (!negociacion) {
        alert('No se encontro la negociacion. Actualiza el historial.');
        return;
    }

    const prospecto = negociacion.prospecto || {};
    const oportunidad = negociacion.oportunidad || {};
    const cotizacion = negociacion.cotizacion || {};
    const cliente = negociacion.cliente || {};

    document.getElementById('negociacion-detalle-titulo').textContent = (
        `${oportunidad.titulo || 'Negociacion'} - ${negociacion.resultado}`
    );
    document.getElementById('negociacion-detalle-contenido').innerHTML = `
        <div class="crm-detail-grid">
            <div><span>Fecha de cierre</span><strong>${formatearFechaCXC(negociacion.fecha_cierre)}</strong></div>
            <div><span>Resultado</span><strong class="${claseResultadoNegociacionCRM(negociacion.resultado)}">${escaparHTML(negociacion.resultado)}</strong></div>
            <div><span>Prospecto</span><strong>${escaparHTML(prospecto.nombre || 'Sin prospecto')}</strong></div>
            <div><span>Oportunidad</span><strong>${escaparHTML(oportunidad.titulo || 'Sin oportunidad')}</strong></div>
            <div><span>Cotizacion</span><strong>${escaparHTML(cotizacion.folio || 'Sin cotizacion')}</strong></div>
            <div><span>Monto cotizado</span><strong>${cotizacion.total != null ? formatearMoneda(cotizacion.total) : '-'}</strong></div>
            <div><span>Monto final</span><strong>${negociacion.resultado === 'Compro' ? formatearMoneda(negociacion.monto_final) : '-'}</strong></div>
            <div><span>Cliente relacionado</span><strong>${escaparHTML(cliente.nombre || '-')}</strong></div>
            <div class="crm-detail-wide"><span>Motivo de perdida</span><strong>${escaparHTML(negociacion.motivo_perdida || '-')}</strong></div>
            <div class="crm-detail-wide"><span>Notas finales</span><strong>${escaparHTML(negociacion.notas || 'Sin notas')}</strong></div>
        </div>
    `;

    const contenedor = document.getElementById(
        'negociacion-detalle-container'
    );
    contenedor.classList.remove('oculto');
    contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cerrarDetalleNegociacionCRM() {
    const contenedor = document.getElementById(
        'negociacion-detalle-container'
    );
    if (!contenedor) return;
    contenedor.classList.add('oculto');
    document.getElementById('negociacion-detalle-contenido').innerHTML = '';
}

async function obtenerNegociacionesCerradasCRM() {
    const sesion = obtenerSesion();
    const estado = document.getElementById(
        'negociaciones-cerradas-estado'
    );
    const boton = document.getElementById(
        'btn-actualizar-negociaciones-crm'
    );
    if (!sesion?.id_empresa || !estado) return;

    const numeroSolicitud = ++solicitudNegociacionesCRM;
    estado.classList.remove('error');
    estado.textContent = 'Consultando negociaciones cerradas...';
    if (boton) {
        boton.disabled = true;
        boton.textContent = 'Actualizando...';
    }

    try {
        const respuesta = await fetch(
            `/api/crm/negociaciones/${sesion.id_empresa}`,
            { cache: 'no-store' }
        );
        const resultado = await respuesta.json();

        if (
            !respuesta.ok
            || !resultado.exito
            || !Array.isArray(resultado.data)
        ) {
            throw new Error(
                mensajeErrorAPI(
                    resultado,
                    'No se pudo cargar el historial de cierres.'
                )
            );
        }

        if (numeroSolicitud !== solicitudNegociacionesCRM) return;

        negociacionesCerradasCRMGlobal = resultado.data;
        filtrarNegociacionesCerradasCRM();
        estado.textContent = negociacionesCerradasCRMGlobal.length
            ? `${negociacionesCerradasCRMGlobal.length} cierre(s) registrado(s).`
            : 'Todavia no hay negociaciones cerradas.';
    } catch (error) {
        if (numeroSolicitud !== solicitudNegociacionesCRM) return;

        console.error('Error al cargar negociaciones cerradas:', error);
        negociacionesCerradasCRMGlobal = [];
        negociacionesCerradasCRMFiltradas = [];
        renderizarNegociacionesCerradasCRM();
        estado.classList.add('error');
        estado.textContent = error.message
            || 'No se pudo cargar el historial de cierres.';
    } finally {
        if (numeroSolicitud === solicitudNegociacionesCRM && boton) {
            boton.disabled = false;
            boton.textContent = 'Actualizar';
        }
    }
}

// ==========================================
// CRM: DASHBOARD COMERCIAL
// ==========================================
let solicitudDashboardCRM = 0;

function renderizarEtapasDashboardCRM(etapas) {
    const contenedor = document.getElementById('dashboard-crm-etapas');
    const registros = Object.entries(etapas || {});
    const maximo = Math.max(...registros.map(([, valor]) => valor), 1);

    contenedor.innerHTML = registros.length
        ? registros.map(([etapa, cantidad]) => `
            <div class="crm-stage-row">
                <div>
                    <span>${escaparHTML(etapa)}</span>
                    <strong>${Number(cantidad)}</strong>
                </div>
                <div class="crm-stage-track">
                    <span style="width:${Math.max(
                        Number(cantidad) * 100 / maximo,
                        cantidad ? 6 : 0
                    )}%"></span>
                </div>
            </div>
        `).join('')
        : '<p class="crm-empty-stage">Sin oportunidades activas.</p>';
}

function renderizarMotivosDashboardCRM(motivos) {
    const contenedor = document.getElementById('dashboard-crm-motivos');
    contenedor.innerHTML = Array.isArray(motivos) && motivos.length
        ? motivos.map(item => `
            <div class="crm-reason-row">
                <span>${escaparHTML(item.motivo)}</span>
                <strong>${Number(item.cantidad)}</strong>
            </div>
        `).join('')
        : '<p class="crm-empty-stage">Todavia no hay motivos de perdida.</p>';
}

function renderizarSeguimientosDashboardCRM(seguimientos) {
    const cuerpo = document.getElementById(
        'dashboard-crm-seguimientos-body'
    );
    cuerpo.innerHTML = Array.isArray(seguimientos) && seguimientos.length
        ? seguimientos.map(prospecto => `
            <tr>
                <td><strong>${escaparHTML(prospecto.nombre || 'Sin nombre')}</strong></td>
                <td>${escaparHTML(prospecto.interes_en || 'Sin interes')}</td>
                <td>${escaparHTML(prospecto.estatus || '-')}</td>
                <td class="amount-negative">${formatearFechaCXC(prospecto.proximo_seguimiento, true)}</td>
            </tr>
        `).join('')
        : `
            <tr>
                <td colspan="4" style="text-align:center;">
                    No hay seguimientos vencidos.
                </td>
            </tr>
        `;
}

function renderizarCierresDashboardCRM(cierres) {
    const cuerpo = document.getElementById('dashboard-crm-cierres-body');
    cuerpo.innerHTML = Array.isArray(cierres) && cierres.length
        ? cierres.map(cierre => `
            <tr>
                <td>${formatearFechaCXC(cierre.fecha_cierre)}</td>
                <td>${escaparHTML(cierre.prospecto?.nombre || 'Sin prospecto')}</td>
                <td>${escaparHTML(cierre.oportunidad?.titulo || 'Sin oportunidad')}</td>
                <td><span class="${claseResultadoNegociacionCRM(cierre.resultado)}">${escaparHTML(cierre.resultado)}</span></td>
                <td><strong>${cierre.resultado === 'Compro' ? formatearMoneda(cierre.monto_final) : '-'}</strong></td>
            </tr>
        `).join('')
        : `
            <tr>
                <td colspan="5" style="text-align:center;">
                    Todavia no hay cierres registrados.
                </td>
            </tr>
        `;
}

function renderizarDashboardComercial(datos) {
    const resumen = datos?.resumen || {};

    document.getElementById(
        'dashboard-crm-prospectos'
    ).textContent = Number(resumen.prospectos_activos || 0);
    document.getElementById(
        'dashboard-crm-vencidos'
    ).textContent = Number(resumen.seguimientos_vencidos || 0);
    document.getElementById(
        'dashboard-crm-oportunidades'
    ).textContent = Number(resumen.oportunidades_activas || 0);
    document.getElementById(
        'dashboard-crm-valor'
    ).textContent = formatearMoneda(resumen.valor_embudo || 0);
    document.getElementById(
        'dashboard-crm-ponderado'
    ).textContent = formatearMoneda(resumen.valor_ponderado || 0);
    document.getElementById(
        'dashboard-crm-cotizaciones'
    ).textContent = Number(resumen.cotizaciones_enviadas || 0);
    document.getElementById(
        'dashboard-crm-conversion'
    ).textContent = `${Number(resumen.tasa_conversion || 0).toFixed(1)}%`;
    document.getElementById(
        'dashboard-crm-ganado'
    ).textContent = formatearMoneda(resumen.monto_ganado || 0);

    renderizarEtapasDashboardCRM(datos?.etapas || {});
    renderizarMotivosDashboardCRM(datos?.motivos_perdida || []);
    renderizarSeguimientosDashboardCRM(
        datos?.seguimientos_vencidos || []
    );
    renderizarCierresDashboardCRM(datos?.cierres_recientes || []);
}

async function obtenerDashboardComercial() {
    const sesion = obtenerSesion();
    const estado = document.getElementById('dashboard-crm-estado');
    const boton = document.getElementById(
        'btn-actualizar-dashboard-crm'
    );
    if (!sesion?.id_empresa || !estado) return;

    const numeroSolicitud = ++solicitudDashboardCRM;
    estado.classList.remove('error');
    estado.textContent = 'Calculando indicadores comerciales...';
    if (boton) {
        boton.disabled = true;
        boton.textContent = 'Actualizando...';
    }

    try {
        const respuesta = await fetch(
            `/api/crm/dashboard/${sesion.id_empresa}`,
            { cache: 'no-store' }
        );
        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.exito || !resultado.data) {
            throw new Error(
                mensajeErrorAPI(
                    resultado,
                    'No se pudo cargar el Dashboard comercial.'
                )
            );
        }

        if (numeroSolicitud !== solicitudDashboardCRM) return;

        renderizarDashboardComercial(resultado.data);
        const resumen = resultado.data.resumen || {};
        estado.textContent = (
            `${Number(resumen.cierres_ganados || 0)} cierre(s) ganado(s), `
            + `${Number(resumen.cierres_perdidos || 0)} perdido(s) y `
            + `${Number(resumen.seguimientos_hoy || 0)} seguimiento(s) para hoy.`
        );
    } catch (error) {
        if (numeroSolicitud !== solicitudDashboardCRM) return;

        console.error('Error al cargar Dashboard comercial:', error);
        renderizarDashboardComercial({});
        estado.classList.add('error');
        estado.textContent = error.message
            || 'No se pudo cargar el Dashboard comercial.';
    } finally {
        if (numeroSolicitud === solicitudDashboardCRM && boton) {
            boton.disabled = false;
            boton.textContent = 'Actualizar';
        }
    }
}


// ==========================================
// RR. HH.: EMPLEADOS Y ADMINISTRATIVO
// ==========================================
let empleadosRRHHGlobal = [];
let empleadoRRHHEditandoId = null;
let movimientosRRHHGlobal = [];
let solicitudEmpleadosRRHH = 0;
let solicitudMovimientosRRHH = 0;

function fechaHoyLocalRRHH() {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

function calcularEdadRRHH(fechaNacimiento) {
    if (!fechaNacimiento) return null;
    const fecha = new Date(`${String(fechaNacimiento).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(fecha.getTime())) return null;

    const hoy = new Date();
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mes = hoy.getMonth() - fecha.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
        edad -= 1;
    }
    return edad >= 0 ? edad : null;
}

function empleadoRRHHPorId(idEmpleado) {
    const id = Number(idEmpleado);
    return empleadosRRHHGlobal.find(
        empleado => Number(empleado.id_empleado) === id
    ) || null;
}

function renderizarResumenEmpleadosRRHH() {
    const activos = empleadosRRHHGlobal.filter(
        empleado => Boolean(empleado.activo)
    ).length;
    document.getElementById('rrhh-empleados-total').textContent = empleadosRRHHGlobal.length;
    document.getElementById('rrhh-empleados-activos').textContent = activos;
    document.getElementById('rrhh-empleados-bajas').textContent = empleadosRRHHGlobal.length - activos;
}

function renderizarEmpleadosRRHH(empleados) {
    const cuerpo = document.getElementById('rrhh-empleados-body');
    const resumen = document.getElementById('rrhh-empleados-resumen');
    if (!cuerpo || !resumen) return;

    resumen.textContent = `${empleados.length} de ${empleadosRRHHGlobal.length} empleado(s)`;

    if (!empleados.length) {
        cuerpo.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;">
                    No hay empleados que coincidan con los filtros.
                </td>
            </tr>
        `;
        return;
    }

    cuerpo.innerHTML = empleados.map(empleado => {
        const edad = calcularEdadRRHH(empleado.fecha_nacimiento);
        const activo = Boolean(empleado.activo);
        const claseEstado = activo
            ? 'rrhh-status-active'
            : 'rrhh-status-inactive';
        const textoEstado = activo ? 'Activo' : 'Baja';

        return `
            <tr>
                <td>
                    <strong>${escaparHTML(empleado.nombre_completo)}</strong>
                    <div class="rrhh-sensitive">RFC y NSS en el expediente</div>
                </td>
                <td>${escaparHTML(empleado.puesto)}</td>
                <td>${edad === null ? '-' : edad}</td>
                <td>${formatearFechaCXC(empleado.fecha_ingreso)}</td>
                <td>${escaparHTML(empleado.telefono)}</td>
                <td><strong>${formatearMoneda(empleado.salario)}</strong></td>
                <td><span class="${claseEstado}">${textoEstado}</span></td>
                <td>
                    <button type="button" class="btn-table" onclick="editarEmpleadoRRHH(${Number(empleado.id_empleado)})">
                        Editar
                    </button>
                    <button type="button" class="btn-table btn-table-state" onclick="abrirMovimientoEmpleadoRRHH(${Number(empleado.id_empleado)})">
                        Admin
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function filtrarEmpleadosRRHH() {
    const busqueda = normalizarBusqueda(
        document.getElementById('rrhh-empleados-busqueda')?.value
    );
    const estado = document.getElementById('rrhh-empleados-estado')?.value || 'todos';

    const filtrados = empleadosRRHHGlobal.filter(empleado => {
        const texto = normalizarBusqueda([
            empleado.nombre_completo,
            empleado.puesto,
            empleado.rfc,
            empleado.numero_seguridad_social,
            empleado.telefono,
            empleado.telefono_emergencia
        ].join(' '));
        const coincideBusqueda = !busqueda || texto.includes(busqueda);
        const coincideEstado = estado === 'todos'
            || (estado === 'activos' && empleado.activo)
            || (estado === 'bajas' && !empleado.activo);
        return coincideBusqueda && coincideEstado;
    });

    renderizarEmpleadosRRHH(filtrados);
}

async function obtenerEmpleadosRRHH() {
    const sesion = obtenerSesion();
    const estado = document.getElementById('rrhh-empleados-estado-carga');
    if (!sesion?.id_empresa) return;

    const numeroSolicitud = ++solicitudEmpleadosRRHH;
    if (estado) {
        estado.classList.remove('error');
        estado.textContent = 'Cargando empleados...';
    }

    try {
        const respuesta = await fetch(
            `/api/rrhh/empleados/${sesion.id_empresa}`,
            { cache: 'no-store' }
        );
        const resultado = await respuesta.json();
        if (!respuesta.ok || !resultado.exito) {
            throw new Error(
                mensajeErrorAPI(resultado, 'No se pudieron cargar los empleados.')
            );
        }
        if (numeroSolicitud !== solicitudEmpleadosRRHH) return;

        empleadosRRHHGlobal = Array.isArray(resultado.data)
            ? resultado.data
            : [];
        renderizarResumenEmpleadosRRHH();
        filtrarEmpleadosRRHH();
        actualizarSelectorEmpleadosRRHH();
        if (estado) {
            estado.textContent = empleadosRRHHGlobal.length
                ? 'Expedientes actualizados.'
                : 'Todavia no hay empleados registrados.';
        }
    } catch (error) {
        if (numeroSolicitud !== solicitudEmpleadosRRHH) return;
        console.error('Error al cargar empleados de RR. HH.:', error);
        empleadosRRHHGlobal = [];
        renderizarResumenEmpleadosRRHH();
        renderizarEmpleadosRRHH([]);
        actualizarSelectorEmpleadosRRHH();
        if (estado) {
            estado.classList.add('error');
            estado.textContent = error.message || 'No se pudieron cargar los empleados.';
        }
    }
}

function mostrarFormularioEmpleadoRRHH(idEmpleado = null) {
    const formulario = document.getElementById('form-empleado-rrhh');
    if (!formulario) return;

    formulario.reset();
    empleadoRRHHEditandoId = idEmpleado === null
        ? null
        : Number(idEmpleado);
    document.getElementById('rrhh-empleado-id').value = empleadoRRHHEditandoId || '';
    document.getElementById('rrhh-empleado-form-titulo').textContent = empleadoRRHHEditandoId
        ? 'Editar empleado'
        : 'Nuevo empleado';

    const hoy = fechaHoyLocalRRHH();
    document.getElementById('rrhh-empleado-nacimiento').max = hoy;
    document.getElementById('rrhh-empleado-ingreso').value = hoy;

    formulario.classList.remove('oculto');
    formulario.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('rrhh-empleado-nombre').focus();
}

function ocultarFormularioEmpleadoRRHH() {
    const formulario = document.getElementById('form-empleado-rrhh');
    if (!formulario) return;
    formulario.reset();
    formulario.classList.add('oculto');
    empleadoRRHHEditandoId = null;
    document.getElementById('rrhh-empleado-id').value = '';
}

function editarEmpleadoRRHH(idEmpleado) {
    const empleado = empleadoRRHHPorId(idEmpleado);
    if (!empleado) {
        alert('Empleado no encontrado. Actualiza la lista.');
        return;
    }

    mostrarFormularioEmpleadoRRHH(idEmpleado);
    document.getElementById('rrhh-empleado-nombre').value = empleado.nombre_completo || '';
    document.getElementById('rrhh-empleado-nacimiento').value = String(empleado.fecha_nacimiento || '').slice(0, 10);
    document.getElementById('rrhh-empleado-ingreso').value = String(empleado.fecha_ingreso || '').slice(0, 10);
    document.getElementById('rrhh-empleado-puesto').value = empleado.puesto || '';
    document.getElementById('rrhh-empleado-salario').value = Number(empleado.salario || 0);
    document.getElementById('rrhh-empleado-telefono').value = empleado.telefono || '';
    document.getElementById('rrhh-empleado-emergencia').value = empleado.telefono_emergencia || '';
    document.getElementById('rrhh-empleado-rfc').value = empleado.rfc || '';
    document.getElementById('rrhh-empleado-nss').value = empleado.numero_seguridad_social || '';
}

async function guardarEmpleadoRRHH(event) {
    event.preventDefault();
    const sesion = obtenerSesion();
    const formulario = document.getElementById('form-empleado-rrhh');
    const boton = formulario.querySelector('button[type="submit"]');

    if (!sesion?.id_empresa || !sesion?.id_usuario) {
        alert('La sesion no es valida. Inicia sesion nuevamente.');
        return;
    }

    const payload = {
        id_empresa: Number(sesion.id_empresa),
        id_usuario: Number(sesion.id_usuario),
        nombre_completo: document.getElementById('rrhh-empleado-nombre').value.trim(),
        fecha_nacimiento: document.getElementById('rrhh-empleado-nacimiento').value,
        fecha_ingreso: document.getElementById('rrhh-empleado-ingreso').value,
        salario: Number(document.getElementById('rrhh-empleado-salario').value),
        puesto: document.getElementById('rrhh-empleado-puesto').value.trim(),
        telefono: document.getElementById('rrhh-empleado-telefono').value.trim(),
        rfc: document.getElementById('rrhh-empleado-rfc').value.trim().toUpperCase(),
        numero_seguridad_social: document.getElementById('rrhh-empleado-nss').value.trim(),
        telefono_emergencia: document.getElementById('rrhh-empleado-emergencia').value.trim()
    };

    if (
        !payload.nombre_completo
        || !payload.fecha_nacimiento
        || !payload.fecha_ingreso
        || !payload.puesto
        || !payload.telefono
        || !payload.rfc
        || !payload.numero_seguridad_social
        || !payload.telefono_emergencia
        || !Number.isFinite(payload.salario)
        || payload.salario < 0
    ) {
        alert('Completa correctamente todos los campos.');
        return;
    }

    if (!/^[0-9]{11}$/.test(payload.numero_seguridad_social)) {
        alert('El numero de seguridad social debe tener 11 digitos.');
        return;
    }

    const editando = Number.isInteger(empleadoRRHHEditandoId);
    const url = editando
        ? `/api/rrhh/empleados/${empleadoRRHHEditandoId}`
        : '/api/rrhh/empleados';

    boton.disabled = true;
    boton.textContent = 'Guardando...';
    try {
        const respuesta = await fetch(url, {
            method: editando ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const resultado = await respuesta.json();
        if (!respuesta.ok || !resultado.exito) {
            throw new Error(
                mensajeErrorAPI(resultado, 'No se pudo guardar el empleado.')
            );
        }

        alert(resultado.mensaje || 'Empleado guardado exitosamente.');
        ocultarFormularioEmpleadoRRHH();
        await obtenerEmpleadosRRHH();
    } catch (error) {
        console.error('Error al guardar empleado de RR. HH.:', error);
        alert(error.message || 'No se pudo guardar el empleado.');
    } finally {
        boton.disabled = false;
        boton.textContent = 'Guardar empleado';
    }
}

function empleadoMovimientoRRHH(movimiento) {
    const relacion = movimiento?.empleados_rrhh;
    if (Array.isArray(relacion)) return relacion[0] || null;
    return relacion || empleadoRRHHPorId(movimiento?.id_empleado);
}

function claseMovimientoRRHH(tipo) {
    const clases = {
        Alta: 'rrhh-movement-alta',
        Baja: 'rrhh-movement-baja',
        Suspension: 'rrhh-movement-suspension',
        Permiso: 'rrhh-movement-permiso',
        'Carta compromiso': 'rrhh-movement-carta'
    };
    return `rrhh-movement-badge ${clases[tipo] || ''}`;
}

function renderizarMovimientosRRHH(movimientos) {
    const cuerpo = document.getElementById('rrhh-admin-body');
    const resumen = document.getElementById('rrhh-admin-resumen');
    if (!cuerpo || !resumen) return;

    resumen.textContent = `${movimientos.length} de ${movimientosRRHHGlobal.length} movimiento(s)`;
    if (!movimientos.length) {
        cuerpo.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">
                    No hay movimientos que coincidan con los filtros.
                </td>
            </tr>
        `;
        return;
    }

    cuerpo.innerHTML = movimientos.map(movimiento => {
        const empleado = empleadoMovimientoRRHH(movimiento) || {};
        const periodo = movimiento.fecha_fin
            ? `${formatearFechaCXC(movimiento.fecha_movimiento)} a ${formatearFechaCXC(movimiento.fecha_fin)}`
            : '-';
        return `
            <tr>
                <td>${formatearFechaCXC(movimiento.fecha_movimiento)}</td>
                <td>
                    <strong>${escaparHTML(empleado.nombre_completo || 'Empleado')}</strong>
                    <div class="rrhh-sensitive">${escaparHTML(empleado.puesto || '')}</div>
                </td>
                <td><span class="${claseMovimientoRRHH(movimiento.tipo_movimiento)}">${escaparHTML(movimiento.tipo_movimiento)}</span></td>
                <td>${periodo}</td>
                <td>${escaparHTML(movimiento.detalle)}</td>
            </tr>
        `;
    }).join('');
}

function filtrarMovimientosRRHH() {
    const busqueda = normalizarBusqueda(
        document.getElementById('rrhh-admin-busqueda')?.value
    );
    const tipo = document.getElementById('rrhh-admin-tipo')?.value || 'todos';

    const filtrados = movimientosRRHHGlobal.filter(movimiento => {
        const empleado = empleadoMovimientoRRHH(movimiento) || {};
        const texto = normalizarBusqueda([
            empleado.nombre_completo,
            empleado.puesto,
            movimiento.detalle,
            movimiento.tipo_movimiento
        ].join(' '));
        return (!busqueda || texto.includes(busqueda))
            && (tipo === 'todos' || movimiento.tipo_movimiento === tipo);
    });
    renderizarMovimientosRRHH(filtrados);
}

async function obtenerMovimientosRRHH() {
    const sesion = obtenerSesion();
    const estado = document.getElementById('rrhh-admin-estado-carga');
    if (!sesion?.id_empresa) return;

    const numeroSolicitud = ++solicitudMovimientosRRHH;
    if (estado) {
        estado.classList.remove('error');
        estado.textContent = 'Cargando movimientos administrativos...';
    }

    try {
        const respuesta = await fetch(
            `/api/rrhh/administrativo/${sesion.id_empresa}`,
            { cache: 'no-store' }
        );
        const resultado = await respuesta.json();
        if (!respuesta.ok || !resultado.exito) {
            throw new Error(
                mensajeErrorAPI(resultado, 'No se pudieron cargar los movimientos.')
            );
        }
        if (numeroSolicitud !== solicitudMovimientosRRHH) return;

        movimientosRRHHGlobal = Array.isArray(resultado.data)
            ? resultado.data
            : [];
        filtrarMovimientosRRHH();
        if (estado) {
            estado.textContent = movimientosRRHHGlobal.length
                ? 'Historial administrativo actualizado.'
                : 'Todavia no hay movimientos administrativos.';
        }
    } catch (error) {
        if (numeroSolicitud !== solicitudMovimientosRRHH) return;
        console.error('Error al cargar movimientos de RR. HH.:', error);
        movimientosRRHHGlobal = [];
        renderizarMovimientosRRHH([]);
        if (estado) {
            estado.classList.add('error');
            estado.textContent = error.message || 'No se pudieron cargar los movimientos.';
        }
    }
}

async function iniciarAdministrativoRRHH() {
    if (!empleadosRRHHGlobal.length) {
        await obtenerEmpleadosRRHH();
    } else {
        actualizarSelectorEmpleadosRRHH();
    }
    await obtenerMovimientosRRHH();
}

function empleadosElegiblesMovimientoRRHH(tipo) {
    if (tipo === 'Alta') {
        return empleadosRRHHGlobal.filter(empleado => !empleado.activo);
    }
    if (tipo === 'Baja') {
        return empleadosRRHHGlobal.filter(empleado => empleado.activo);
    }
    return empleadosRRHHGlobal;
}

function actualizarSelectorEmpleadosRRHH(idPreferido = null) {
    const selector = document.getElementById('rrhh-movimiento-empleado');
    const tipo = document.getElementById('rrhh-movimiento-tipo')?.value || 'Carta compromiso';
    if (!selector) return;

    const seleccionado = idPreferido ?? selector.value;
    const elegibles = empleadosElegiblesMovimientoRRHH(tipo);
    selector.innerHTML = elegibles.length
        ? elegibles.map(empleado => `
            <option value="${Number(empleado.id_empleado)}">
                ${escaparHTML(empleado.nombre_completo)} - ${escaparHTML(empleado.puesto)}
            </option>
        `).join('')
        : '<option value="">No hay empleados disponibles</option>';

    if (elegibles.some(
        empleado => Number(empleado.id_empleado) === Number(seleccionado)
    )) {
        selector.value = String(seleccionado);
    }
}

function actualizarCamposMovimientoRRHH(idPreferido = null) {
    const tipo = document.getElementById('rrhh-movimiento-tipo').value;
    const grupoFechaFin = document.getElementById('rrhh-movimiento-fecha-fin-grupo');
    const fechaFin = document.getElementById('rrhh-movimiento-fecha-fin');
    const usaFechaFin = tipo === 'Suspension' || tipo === 'Permiso';

    grupoFechaFin.classList.toggle('oculto', !usaFechaFin);
    if (!usaFechaFin) fechaFin.value = '';
    actualizarSelectorEmpleadosRRHH(idPreferido);
}

function mostrarFormularioMovimientoRRHH(idEmpleado = null) {
    const formulario = document.getElementById('form-movimiento-rrhh');
    if (!formulario) return;

    if (!empleadosRRHHGlobal.length) {
        alert('Primero registra un empleado.');
        return;
    }

    formulario.reset();
    document.getElementById('rrhh-movimiento-fecha').value = fechaHoyLocalRRHH();

    const empleado = idEmpleado === null
        ? null
        : empleadoRRHHPorId(idEmpleado);
    if (empleado) {
        document.getElementById('rrhh-movimiento-tipo').value = empleado.activo
            ? 'Carta compromiso'
            : 'Alta';
    }

    actualizarCamposMovimientoRRHH(idEmpleado);
    formulario.classList.remove('oculto');
    formulario.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function ocultarFormularioMovimientoRRHH() {
    const formulario = document.getElementById('form-movimiento-rrhh');
    if (!formulario) return;
    formulario.reset();
    formulario.classList.add('oculto');
    document.getElementById('rrhh-movimiento-fecha-fin-grupo').classList.add('oculto');
}

function abrirMovimientoEmpleadoRRHH(idEmpleado) {
    seleccionarArea('rrhh', 'rrhh-administrativo');
    window.setTimeout(
        () => mostrarFormularioMovimientoRRHH(idEmpleado),
        0
    );
}

async function guardarMovimientoRRHH(event) {
    event.preventDefault();
    const sesion = obtenerSesion();
    const formulario = document.getElementById('form-movimiento-rrhh');
    const boton = formulario.querySelector('button[type="submit"]');
    const tipo = document.getElementById('rrhh-movimiento-tipo').value;

    if (!sesion?.id_empresa || !sesion?.id_usuario) {
        alert('La sesion no es valida. Inicia sesion nuevamente.');
        return;
    }

    const payload = {
        id_empresa: Number(sesion.id_empresa),
        id_empleado: Number(document.getElementById('rrhh-movimiento-empleado').value),
        id_usuario: Number(sesion.id_usuario),
        tipo_movimiento: tipo,
        fecha_movimiento: document.getElementById('rrhh-movimiento-fecha').value,
        fecha_fin: (tipo === 'Suspension' || tipo === 'Permiso')
            ? document.getElementById('rrhh-movimiento-fecha-fin').value || null
            : null,
        detalle: document.getElementById('rrhh-movimiento-detalle').value.trim()
    };

    if (
        !payload.id_empleado
        || !payload.fecha_movimiento
        || !payload.detalle
    ) {
        alert('Completa los campos obligatorios.');
        return;
    }

    if (payload.fecha_fin && payload.fecha_fin < payload.fecha_movimiento) {
        alert('La fecha final no puede ser anterior a la inicial.');
        return;
    }

    const confirmacion = tipo === 'Baja'
        ? window.confirm('La baja marcara al empleado como inactivo. Continuar?')
        : true;
    if (!confirmacion) return;

    boton.disabled = true;
    boton.textContent = 'Guardando...';
    try {
        const respuesta = await fetch('/api/rrhh/administrativo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const resultado = await respuesta.json();
        if (!respuesta.ok || !resultado.exito) {
            throw new Error(
                mensajeErrorAPI(resultado, 'No se pudo guardar el movimiento.')
            );
        }

        alert(resultado.mensaje || 'Movimiento guardado exitosamente.');
        ocultarFormularioMovimientoRRHH();
        await obtenerEmpleadosRRHH();
        await obtenerMovimientosRRHH();
    } catch (error) {
        console.error('Error al guardar movimiento de RR. HH.:', error);
        alert(error.message || 'No se pudo guardar el movimiento.');
    } finally {
        boton.disabled = false;
        boton.textContent = 'Guardar movimiento';
    }
}

//INICIO INTERFAZ BIZPILOT IA

let bizPilotIAInicializada = false;
let bizPilotIAProcesando = false;


/**
 * Devuelve la hora actual para mostrarla junto a cada mensaje.
 */
function obtenerHoraBizPilotIA() {
    return new Intl.DateTimeFormat('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date());
}


/**
 * Coloca la pantalla de bienvenida dentro del historial.
 * Tambien configura Enter para enviar la pregunta.
 */
function inicializarBizPilotIA() {
    const contenedor = document.getElementById('bizpilot-ia-mensajes');
    const campoPregunta = document.getElementById('bizpilot-ia-pregunta');

    if (!contenedor || !campoPregunta) {
        console.error(
            'No se encontraron los elementos principales de BizPilot IA.'
        );
        return;
    }

    if (!bizPilotIAInicializada) {
        contenedor.innerHTML = '';

        const bienvenida = document.createElement('div');
        bienvenida.className = 'bizpilot-ia-welcome';

        const titulo = document.createElement('h3');
        titulo.textContent = 'Hola, soy BizPilot IA';

        const descripcion = document.createElement('p');
        descripcion.textContent =
            'Puedo ayudarte a encontrar funciones y explicar como usar BizPilot.';

        bienvenida.appendChild(titulo);
        bienvenida.appendChild(descripcion);
        contenedor.appendChild(bienvenida);

        bizPilotIAInicializada = true;
    }

    if (campoPregunta.dataset.enterConfigurado !== 'true') {
        campoPregunta.addEventListener('keydown', manejarEnterBizPilotIA);
        campoPregunta.dataset.enterConfigurado = 'true';
    }

    campoPregunta.focus();
}


/**
 * Permite enviar con Enter.
 * Shift + Enter conserva el salto de linea.
 */
function manejarEnterBizPilotIA(event) {
    if (
        event.key === 'Enter'
        && !event.shiftKey
        && !event.isComposing
    ) {
        event.preventDefault();

        const formulario = document.getElementById('form-bizpilot-ia');

        if (formulario) {
            formulario.requestSubmit();
        }
    }
}


/**
 * Crea una burbuja dentro del historial.
 *
 * tipo puede ser:
 * usuario
 * asistente
 * error
 */
function agregarMensajeBizPilotIA(tipo, texto) {
    const contenedor = document.getElementById('bizpilot-ia-mensajes');

    if (!contenedor) {
        return;
    }

    const tiposPermitidos = ['usuario', 'asistente', 'error'];

    const tipoSeguro = tiposPermitidos.includes(tipo)
        ? tipo
        : 'asistente';

    const fila = document.createElement('div');
    fila.className = `bizpilot-ia-message ${tipoSeguro}`;

    const burbuja = document.createElement('div');
    burbuja.className = 'bizpilot-ia-bubble';

    const informacion = document.createElement('span');
    informacion.className = 'bizpilot-ia-message-meta';

    informacion.textContent = tipoSeguro === 'usuario'
        ? `Tu | ${obtenerHoraBizPilotIA()}`
        : `BizPilot IA | ${obtenerHoraBizPilotIA()}`;

    const contenido = document.createElement('div');
    contenido.textContent = String(texto || '');

    burbuja.appendChild(informacion);
    burbuja.appendChild(contenido);
    fila.appendChild(burbuja);
    contenedor.appendChild(fila);

    contenedor.scrollTop = contenedor.scrollHeight;

    return burbuja;
}


/**
 * Muestra u oculta el indicador de procesamiento.
 * Tambien bloquea el formulario para evitar envios duplicados.
 */
function establecerProcesandoBizPilotIA(procesando) {
    const indicador = document.getElementById('bizpilot-ia-escribiendo');
    const campoPregunta = document.getElementById('bizpilot-ia-pregunta');
    const botonEnviar = document.getElementById('bizpilot-ia-enviar');

    bizPilotIAProcesando = Boolean(procesando);

    if (indicador) {
        indicador.classList.toggle(
            'oculto',
            !bizPilotIAProcesando
        );
    }

    if (campoPregunta) {
        campoPregunta.disabled = bizPilotIAProcesando;
    }

    if (botonEnviar) {
        botonEnviar.disabled = bizPilotIAProcesando;
        botonEnviar.textContent = bizPilotIAProcesando
            ? 'Revisando...'
            : 'Enviar';
    }
}


/**
 * Borra la conversacion visual y vuelve a mostrar la bienvenida.
 * Todavia no elimina registros porque el chat no se guarda.
 */
function limpiarChatBizPilotIA() {
    if (bizPilotIAProcesando) {
        return;
    }

    const contenedor = document.getElementById('bizpilot-ia-mensajes');
    const campoPregunta = document.getElementById('bizpilot-ia-pregunta');

    if (contenedor) {
        contenedor.innerHTML = '';
    }

    if (campoPregunta) {
        campoPregunta.value = '';
    }

    bizPilotIAInicializada = false;
    inicializarBizPilotIA();
}


/**
 * Coloca una pregunta rapida en el formulario y la envia.
 */
function preguntarBizPilotIA(pregunta) {
    const campoPregunta = document.getElementById('bizpilot-ia-pregunta');
    const formulario = document.getElementById('form-bizpilot-ia');

    if (
        !campoPregunta
        || !formulario
        || bizPilotIAProcesando
    ) {
        return;
    }

    campoPregunta.value = String(pregunta || '').trim();

    if (!campoPregunta.value) {
        return;
    }

    formulario.requestSubmit();
}


/**
 * Recibe el envio principal del formulario.
 *
 * En este paso solo probamos la interfaz.
 * La llamada al motor Python se agregara despues.
 */

/**
 * Envia la pregunta al motor local de Python.
 */
async function solicitarRespuestaBizPilotIA(pregunta) {
    const sesion = obtenerSesion();

    if (
        !sesion
        || !sesion.id_empresa
        || !sesion.id_usuario
    ) {
        throw new Error(
            'La sesion no es valida. Inicia sesion nuevamente.'
        );
    }

    const respuesta = await fetch('/api/ia/ayuda', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id_empresa: Number(sesion.id_empresa),
            id_usuario: Number(sesion.id_usuario),
            mensaje: pregunta
        })
    });

    let resultado;

    try {
        resultado = await respuesta.json();
    } catch (error) {
        throw new Error(
            'El servidor devolvio una respuesta invalida.'
        );
    }

    if (!respuesta.ok || !resultado.exito) {
        throw new Error(
            resultado.mensaje
            || 'No se pudo consultar BizPilot IA.'
        );
    }

    if (!resultado.data) {
        throw new Error(
            'BizPilot IA no devolvio informacion.'
        );
    }

    return resultado.data;
}


/**
 * Muestra una respuesta estructurada del motor local.
 */

/**
 * Muestra productos con stock bajo.
 *
 * Recibe la burbuja donde se agregara el contenido
 * y los datos enviados por FastAPI.
 */
function renderizarStockBajoBizPilotIA(
    burbuja,
    datosConsulta
) {
    if (
        !burbuja
        || !datosConsulta
        || datosConsulta.tipo !== 'stock_bajo'
    ) {
        return;
    }

    const productos = Array.isArray(
        datosConsulta.productos
    )
        ? datosConsulta.productos
        : [];

    if (productos.length === 0) {
        return;
    }

    const total = Number(
        datosConsulta.total || productos.length
    );

    const agotados = Number(
        datosConsulta.agotados || 0
    );

    const contenedor = document.createElement('div');
    contenedor.className = 'bizpilot-ia-data-block';

    const encabezado = document.createElement('div');
    encabezado.className = 'bizpilot-ia-data-header';

    const titulo = document.createElement('strong');
    titulo.textContent = 'Detalle de inventario';

    const resumen = document.createElement('span');
    resumen.textContent =
        `${total} con stock bajo | ${agotados} agotado(s)`;

    encabezado.appendChild(titulo);
    encabezado.appendChild(resumen);
    contenedor.appendChild(encabezado);

    const lista = document.createElement('div');
    lista.className = 'bizpilot-ia-stock-list';

    productos.forEach(producto => {
        const stock = Number(producto.stock || 0);

        const stockMinimo = Number(
            producto.stock_minimo || 0
        );

        const estaAgotado = (
            producto.estado === 'Agotado'
            || stock <= 0
        );

        const tarjeta = document.createElement('article');
        tarjeta.className = 'bizpilot-ia-stock-item';

        if (estaAgotado) {
            tarjeta.classList.add('agotado');
        }

        const cabeceraProducto = document.createElement('div');
        cabeceraProducto.className =
            'bizpilot-ia-stock-heading';

        const nombre = document.createElement('strong');
        nombre.textContent =
            producto.nombre || 'Producto sin nombre';

        const estado = document.createElement('span');
        estado.className = 'bizpilot-ia-stock-badge';
        estado.textContent = estaAgotado
            ? 'Agotado'
            : 'Stock bajo';

        cabeceraProducto.appendChild(nombre);
        cabeceraProducto.appendChild(estado);

        const detalles = document.createElement('div');
        detalles.className = 'bizpilot-ia-stock-details';

        const existencia = document.createElement('span');
        existencia.textContent =
            `Existencia: ${stock}`;

        const minimo = document.createElement('span');
        minimo.textContent =
            `Minimo: ${stockMinimo}`;

        const sku = document.createElement('span');
        sku.textContent =
            `SKU: ${producto.sku || 'Sin SKU'}`;

        const proveedor = document.createElement('span');
        proveedor.textContent =
            `Proveedor: ${
                producto.proveedor || 'Sin proveedor'
            }`;

        detalles.appendChild(existencia);
        detalles.appendChild(minimo);
        detalles.appendChild(sku);
        detalles.appendChild(proveedor);

        tarjeta.appendChild(cabeceraProducto);
        tarjeta.appendChild(detalles);
        lista.appendChild(tarjeta);
    });

    contenedor.appendChild(lista);

    if (total > productos.length) {
        const aviso = document.createElement('span');
        aviso.className = 'bizpilot-ia-data-more';
        aviso.textContent =
            `Mostrando ${productos.length} de ${total} productos.`;

        contenedor.appendChild(aviso);
    }

    burbuja.appendChild(contenedor);
}

function renderizarRespuestaBizPilotIA(datos) {
    const burbuja = agregarMensajeBizPilotIA(
        'asistente',
        datos.respuesta || 'No encontre una respuesta.'
    );

    if (!burbuja) {
        return;
    }

    const pasos = Array.isArray(datos.pasos)
        ? datos.pasos
        : [];

    if (pasos.length) {
        const tituloPasos = document.createElement('strong');
        tituloPasos.className = 'bizpilot-ia-section-title';
        tituloPasos.textContent = 'Pasos';

        const listaPasos = document.createElement('ol');
        listaPasos.className = 'bizpilot-ia-steps';

        pasos.forEach(paso => {
            const elemento = document.createElement('li');
            elemento.textContent = String(paso);
            listaPasos.appendChild(elemento);
        });

        burbuja.appendChild(tituloPasos);
        burbuja.appendChild(listaPasos);
    }

    // RENDER DE CONSULTAS CON DATOS REALES
    const datosConsulta = (
        datos
        && typeof datos.datos === 'object'
    )
        ? datos.datos
        : null;

    if (
        datosConsulta
        && datosConsulta.tipo === 'stock_bajo'
    ) {
        renderizarStockBajoBizPilotIA(
            burbuja,
            datosConsulta
        );
    }

    const acciones = Array.isArray(datos.acciones)
        ? datos.acciones
        : [];

    if (acciones.length) {
        const contenedorAcciones = document.createElement('div');
        contenedorAcciones.className = 'bizpilot-ia-actions';

        acciones.forEach(accion => {
            if (!accion.area || !accion.modulo) {
                return;
            }

            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'bizpilot-ia-action';
            boton.textContent = accion.texto || 'Abrir modulo';

            boton.addEventListener('click', () => {
                abrirModuloDesdeBizPilotIA(
                    accion.area,
                    accion.modulo
                );
            });

            contenedorAcciones.appendChild(boton);
        });

        burbuja.appendChild(contenedorAcciones);
    }

    const sugerencias = Array.isArray(datos.sugerencias)
        ? datos.sugerencias.slice(0, 3)
        : [];

    if (sugerencias.length) {
        const contenedorSugerencias = document.createElement('div');
        contenedorSugerencias.className = 'bizpilot-ia-followups';

        const tituloSugerencias = document.createElement('span');
        tituloSugerencias.textContent = 'Tambien puedes preguntar:';

        contenedorSugerencias.appendChild(
            tituloSugerencias
        );

        sugerencias.forEach(sugerencia => {
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.textContent = String(sugerencia);

            boton.addEventListener('click', () => {
                preguntarBizPilotIA(sugerencia);
            });

            contenedorSugerencias.appendChild(boton);
        });

        burbuja.appendChild(contenedorSugerencias);
    }
}


/**
 * Abre una pantalla recomendada por el motor local.
 */
function abrirModuloDesdeBizPilotIA(area, modulo) {
    const configuracionArea = configuracionAreas[area];
    const configuracionModulo = configuracionModulos[modulo];

    if (
        !configuracionArea
        || !configuracionModulo
        || configuracionModulo.area !== area
    ) {
        agregarMensajeBizPilotIA(
            'error',
            'No se pudo abrir el modulo recomendado.'
        );

        return;
    }

    seleccionarArea(
        area,
        modulo
    );
}

async function enviarPreguntaBizPilotIA(event) {
    event.preventDefault();

    if (bizPilotIAProcesando) {
        return;
    }

    const campoPregunta = document.getElementById('bizpilot-ia-pregunta');

    if (!campoPregunta) {
        return;
    }

    const pregunta = campoPregunta.value.trim();

    if (!pregunta) {
        campoPregunta.focus();
        return;
    }

    if (pregunta.length > 500) {
        agregarMensajeBizPilotIA(
            'error',
            'La pregunta no puede superar 500 caracteres.'
        );
        return;
    }

    agregarMensajeBizPilotIA('usuario', pregunta);

    campoPregunta.value = '';
    establecerProcesandoBizPilotIA(true);

    try {
        const respuesta = await solicitarRespuestaBizPilotIA(
            pregunta
        );

        renderizarRespuestaBizPilotIA(
            respuesta
        );

    } catch (error) {
        console.error(
            'Error al consultar BizPilot IA:',
            error
        );

        agregarMensajeBizPilotIA(
            'error',
            error.message || 'No se pudo procesar la pregunta.'
        );

    } finally {
        establecerProcesandoBizPilotIA(false);
        campoPregunta.focus();
    }
}
