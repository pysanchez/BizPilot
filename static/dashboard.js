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
            'crm-negociaciones',
            'crm-seguimientos',
            'crm-cotizaciones'
        ]
    },
    rrhh: {
        nombre: 'RR. HH.',
        moduloInicial: 'rrhh-empleados',
        modulos: [
            'rrhh-empleados',
            'rrhh-asistencias',
            'rrhh-vacaciones',
            'rrhh-incidencias',
            'rrhh-accidentes',
            'rrhh-avisos',
            'rrhh-medidas',
            'rrhh-documentos'
        ]
    },
    copilot: {
        nombre: 'Inteligencia artificial',
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

    'fin-resumen': { nombre: 'Dashboard financiero', area: 'finanzas', vistaId: 'vista-fin-resumen' },
    'fin-ingresos': { nombre: 'Ingresos y cobros', area: 'finanzas', vistaId: 'vista-fin-ingresos' },
    'fin-gastos': { nombre: 'Gastos', area: 'finanzas', vistaId: 'vista-fin-gastos', alCargar: obtenerGastosAPI },
    'fin-cxp': { nombre: 'Cuentas por pagar', area: 'finanzas', vistaId: 'vista-fin-cxp', alCargar: obtenerCXPAPI },
    'fin-cxc': { nombre: 'Cuentas por cobrar', area: 'finanzas', vistaId: 'vista-fin-cxc', alCargar: obtenerCXCAPI },
    'fin-comprobantes': { nombre: 'Facturas y comprobantes', area: 'finanzas', vistaId: 'vista-fin-comprobantes' },

    'crm-dashboard': { nombre: 'Dashboard comercial', area: 'crm', vistaId: 'vista-crm-dashboard' },
    'crm-prospectos': { nombre: 'Prospectos', area: 'crm', vistaId: 'vista-crm-prospectos' },
    'crm-embudo': { nombre: 'Embudo de ventas', area: 'crm', vistaId: 'vista-crm-embudo' },
    'crm-negociaciones': { nombre: 'Negociaciones', area: 'crm', vistaId: 'vista-crm-negociaciones' },
    'crm-seguimientos': { nombre: 'Seguimientos', area: 'crm', vistaId: 'vista-crm-seguimientos' },
    'crm-cotizaciones': { nombre: 'Cotizaciones', area: 'crm', vistaId: 'vista-crm-cotizaciones' },

    'rrhh-empleados': { nombre: 'Empleados', area: 'rrhh', vistaId: 'vista-rrhh-empleados' },
    'rrhh-asistencias': { nombre: 'Asistencias', area: 'rrhh', vistaId: 'vista-rrhh-asistencias' },
    'rrhh-vacaciones': { nombre: 'Vacaciones y permisos', area: 'rrhh', vistaId: 'vista-rrhh-vacaciones' },
    'rrhh-incidencias': { nombre: 'Incidencias', area: 'rrhh', vistaId: 'vista-rrhh-incidencias' },
    'rrhh-accidentes': { nombre: 'Accidentes', area: 'rrhh', vistaId: 'vista-rrhh-accidentes' },
    'rrhh-avisos': { nombre: 'Avisos internos', area: 'rrhh', vistaId: 'vista-rrhh-avisos' },
    'rrhh-medidas': { nombre: 'Medidas disciplinarias', area: 'rrhh', vistaId: 'vista-rrhh-medidas' },
    'rrhh-documentos': { nombre: 'Documentos', area: 'rrhh', vistaId: 'vista-rrhh-documentos' },

    'ia-copilot': { nombre: 'BizPilot CoPilot', area: 'copilot', vistaId: 'vista-ia-copilot' }
};

let areaActiva = null;

document.addEventListener('DOMContentLoaded', () => {
    const sesion = obtenerSesion();

    if (!sesion || !sesion.id_empresa) {
        cerrarSesion();
        return;
    }

    document.getElementById('empresa-id').innerText = sesion.id_empresa;
    configurarNavegacionPrincipal();
    seleccionarArea('operacion');
});

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