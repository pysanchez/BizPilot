import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

RUTA_ENV = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=RUTA_ENV)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "Faltan las variables SUPABASE_URL o SUPABASE_KEY"
    )

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)

# --- USUARIOS Y EMPRESAS ---
def obtener_empresas():
    try:
        response = supabase.table("empresas").select("*").execute()
        return response.data
    except Exception as e:
        print(f"Error al conectar con Supabase: {e}")
        return []

def verificar_login(usuario, password):
    try:
        response = supabase.table("usuarios") \
            .select("id_usuario, id_empresa, rol, password") \
            .eq("usuario", usuario) \
            .execute()

        if len(response.data) > 0:
            usuario_db = response.data[0]
            if usuario_db["password"] == password:
                return {"exito": True, "datos_usuario": usuario_db}
            else:
                return {"exito": False, "mensaje": "Contrasena incorrecta"}
        else:
            return {"exito": False, "mensaje": "Usuario no encontrado"}
    except Exception as e:
        print(f"Error en login: {e}")
        return {"exito": False, "mensaje": "Error de conexion"}

# --- INVENTARIO Y PRODUCTOS ---
def crear_producto(datos_producto):
    try:
        supabase.table("productos").insert(datos_producto).execute()
        return {"exito": True, "mensaje": "Producto registrado exitosamente"}
    except Exception as e:
        print(f"Error al crear producto: {e}")
        return {"exito": False, "mensaje": "No se pudo guardar el producto"}


def obtener_productos_empresa(id_empresa):
    try:
        response = supabase.table("productos") \
            .select("*, proveedores(nombre)") \
            .eq("id_empresa", id_empresa) \
            .order("id_producto", desc=True) \
            .execute()
        return response.data
    except Exception as e:
        print(f"Error al obtener productos: {e}")
        return []

# --- VENTAS ---
def registrar_venta(
    id_empresa,
    total,
    id_cliente,
    cliente,
    metodo_pago,
    carrito,
    tipo_venta="Contado",
    monto_inicial=0.0
):
    try:
        response = supabase.rpc("bizpilot_registrar_venta", {
            "p_id_empresa": id_empresa,
            "p_id_cliente": id_cliente,
            "p_tipo_venta": tipo_venta,
            "p_monto_inicial": monto_inicial,
            "p_metodo_pago": metodo_pago,
            "p_carrito": carrito
        }).execute()

        resultado = response.data
        if isinstance(resultado, list) and len(resultado) == 1:
            resultado = resultado[0]
        if isinstance(resultado, dict):
            return resultado

        return {"exito": False, "mensaje": "Supabase no devolvió el resultado de la venta"}
    except Exception as e:
        print(f"Error al registrar venta: {e}")
        texto_error = str(e)
        mensajes_controlados = [
            "El carrito está vacío",
            "La condición de venta no es válida",
            "El cliente seleccionado no pertenece a esta empresa",
            "El cliente seleccionado está inactivo",
            "El cliente no tiene crédito autorizado",
            "Público general no puede comprar a crédito",
            "El abono inicial no es válido",
            "Si se pagará el total, registra la venta como Contado",
            "La venta supera el crédito disponible del cliente",
            "Producto no encontrado",
            "Stock insuficiente"
        ]
        for mensaje in mensajes_controlados:
            if mensaje in texto_error:
                return {"exito": False, "mensaje": mensaje}
        return {"exito": False, "mensaje": "No se pudo registrar la venta. Verifica la migración de CxC"}

def obtener_historial_ventas(id_empresa):
    try:
        response = supabase.table("ventas").select("*").eq("id_empresa", id_empresa).order("id_venta", desc=True).execute()
        return response.data
    except Exception as e:
        return []

# --- CLIENTES ---
def obtener_clientes(id_empresa):
    try:
        response = supabase.table("clientes") \
            .select("*") \
            .eq("id_empresa", id_empresa) \
            .order("id_cliente", desc=True) \
            .execute()
        return response.data
    except Exception as e:
        print(f"Error al obtener clientes: {e}")
        return None

def crear_cliente(datos_cliente):
    try:
        response = supabase.table("clientes").insert(datos_cliente).execute()
        cliente = response.data[0] if response.data else None
        return {
            "exito": True,
            "mensaje": "Cliente registrado exitosamente",
            "data": cliente
        }
    except Exception as e:
        print(f"Error al crear cliente: {e}")
        if "duplicate key" in str(e).lower():
            return {"exito": False, "mensaje": "Ya existe un cliente con ese RFC en la empresa"}
        return {"exito": False, "mensaje": "No se pudo guardar el cliente"}

def actualizar_cliente(id_cliente, id_empresa, datos_cliente):
    try:
        cliente_actual = supabase.table("clientes") \
            .select("id_cliente") \
            .eq("id_cliente", id_cliente) \
            .eq("id_empresa", id_empresa) \
            .limit(1) \
            .execute()

        if not cliente_actual.data:
            return {"exito": False, "mensaje": "Cliente no encontrado"}

        response = supabase.table("clientes") \
            .update(datos_cliente) \
            .eq("id_cliente", id_cliente) \
            .eq("id_empresa", id_empresa) \
            .execute()

        cliente = response.data[0] if response.data else None
        return {
            "exito": True,
            "mensaje": "Cliente actualizado exitosamente",
            "data": cliente
        }
    except Exception as e:
        print(f"Error al actualizar cliente: {e}")
        if "duplicate key" in str(e).lower():
            return {"exito": False, "mensaje": "Ya existe un cliente con ese RFC en la empresa"}
        return {"exito": False, "mensaje": "No se pudo actualizar el cliente"}

def cambiar_estado_cliente(id_cliente, id_empresa, activo):
    try:
        cliente_actual = supabase.table("clientes") \
            .select("id_cliente") \
            .eq("id_cliente", id_cliente) \
            .eq("id_empresa", id_empresa) \
            .limit(1) \
            .execute()

        if not cliente_actual.data:
            return {"exito": False, "mensaje": "Cliente no encontrado"}

        response = supabase.table("clientes") \
            .update({"activo": activo}) \
            .eq("id_cliente", id_cliente) \
            .eq("id_empresa", id_empresa) \
            .execute()

        cliente = response.data[0] if response.data else None
        return {
            "exito": True,
            "mensaje": "Estado del cliente actualizado",
            "data": cliente
        }
    except Exception as e:
        print(f"Error al cambiar el estado del cliente: {e}")
        return {"exito": False, "mensaje": "No se pudo cambiar el estado del cliente"}

# --- PROVEEDORES ---
def obtener_proveedores(id_empresa):
    try:
        response = supabase.table("proveedores").select("*").eq("id_empresa", id_empresa).order("id_proveedor", desc=True).execute()
        return response.data
    except Exception as e:
        return []

def crear_proveedor(datos_proveedor):
    try:
        response = supabase.table("proveedores").insert(datos_proveedor).execute()
        return {"exito": True, "mensaje": "Proveedor registrado exitosamente"}
    except Exception as e:
        return {"exito": False, "mensaje": "No se pudo guardar el proveedor"}

# --- COMPRAS ---
def registrar_compra(id_empresa, id_proveedor, carrito, total, tipo_compra="Contado", dias_credito=0, monto_pagado=0.0, metodo_pago="Transferencia"):
    try:
        monto_inicial = float(monto_pagado) if tipo_compra == "Credito" else total
        estado_pago = "Pagado" if monto_inicial >= total else "Pendiente"
        dias = dias_credito if tipo_compra == "Credito" else 0

        res_compra = supabase.table("compras").insert({
            "id_empresa": id_empresa,
            "id_proveedor": id_proveedor,
            "total": total,
            "tipo_compra": tipo_compra,
            "estado_pago": estado_pago,
            "dias_credito": dias,
            "monto_pagado": monto_inicial
        }).execute()
        
        id_compra = res_compra.data[0]["id_compra"]

        if monto_inicial > 0:
            supabase.table("pagos_cxp").insert({
                "id_compra": id_compra,
                "monto": monto_inicial,
                "metodo_pago": metodo_pago
            }).execute()

        for item in carrito:
            id_producto = item.get("id_producto")
            if not id_producto:
                res_nuevo = supabase.table("productos").insert({
                    "id_empresa": id_empresa,
                    "id_proveedor": id_proveedor,
                    "sku": item["sku"],
                    "nombre": item["nombre"],
                    "categoria": item["categoria"],
                    "precio_compra": item["precio_compra"],
                    "precio_venta": item["precio_venta"],
                    "stock": item["cantidad"], 
                    "stock_minimo": 5
                }).execute()
                id_producto = res_nuevo.data[0]["id_producto"]
            else:
                prod_db = supabase.table("productos").select("stock").eq("id_producto", id_producto).execute()
                nuevo_stock = prod_db.data[0]["stock"] + item["cantidad"]
                supabase.table("productos").update({
                    "stock": nuevo_stock,
                    "precio_compra": item["precio_compra"],
                    "id_proveedor": id_proveedor
                }).eq("id_producto", id_producto).execute()

            supabase.table("compras_detalle").insert({
                "id_compra": id_compra,
                "id_producto": id_producto,
                "cantidad": item["cantidad"],
                "precio_costo": item["precio_compra"],
                "subtotal": item["subtotal"]
            }).execute()

        return {"exito": True, "mensaje": "Compra procesada correctamente."}
    except Exception as e:
        print(f"Error al registrar compra: {e}")
        return {"exito": False, "mensaje": "No se pudo procesar la compra"}

# --- CUENTAS POR PAGAR (CXP) ---
def obtener_cuentas_por_pagar(id_empresa):
    try:
        response = supabase.table("compras") \
            .select("*, proveedores(nombre), pagos_cxp(*)") \
            .eq("id_empresa", id_empresa) \
            .eq("tipo_compra", "Credito") \
            .order("estado_pago", desc=True) \
            .execute()
        return response.data
    except Exception as e:
        print(f"Error CXP: {e}")
        return []

def registrar_abono_cxp(id_compra, monto_abono, metodo_pago):
    try:
        compra_db = supabase.table("compras").select("total, monto_pagado").eq("id_compra", id_compra).execute()
        datos = compra_db.data[0]
        
        nuevo_pagado = float(datos["monto_pagado"]) + float(monto_abono)
        estado = "Pagado" if nuevo_pagado >= float(datos["total"]) else "Pendiente"

        supabase.table("pagos_cxp").insert({
            "id_compra": id_compra,
            "monto": monto_abono,
            "metodo_pago": metodo_pago
        }).execute()

        supabase.table("compras").update({
            "monto_pagado": nuevo_pagado,
            "estado_pago": estado
        }).eq("id_compra", id_compra).execute()

        return {"exito": True, "mensaje": "Abono registrado con exito."}
    except Exception as e:
        return {"exito": False, "mensaje": "Error al registrar el abono."}

# --- CUENTAS POR COBRAR (CXC) ---
def obtener_cuentas_por_cobrar(id_empresa):
    try:
        response = supabase.table("ventas") \
            .select("*, clientes(nombre, telefono, limite_credito, dias_credito), pagos_cxc(*)") \
            .eq("id_empresa", id_empresa) \
            .eq("tipo_venta", "Credito") \
            .order("fecha_vencimiento", desc=False) \
            .order("id_venta", desc=True) \
            .execute()
        return response.data
    except Exception as e:
        print(f"Error al obtener CxC: {e}")
        return None

def registrar_abono_cxc(id_empresa, id_venta, monto, metodo_pago, referencia=None, notas=None):
    try:
        response = supabase.rpc("bizpilot_registrar_abono_cxc", {
            "p_id_empresa": id_empresa,
            "p_id_venta": id_venta,
            "p_monto": monto,
            "p_metodo_pago": metodo_pago,
            "p_referencia": referencia,
            "p_notas": notas
        }).execute()

        resultado = response.data
        if isinstance(resultado, list) and len(resultado) == 1:
            resultado = resultado[0]
        if isinstance(resultado, dict):
            return resultado
        return {"exito": False, "mensaje": "Supabase no devolvió el resultado del cobro"}
    except Exception as e:
        print(f"Error al registrar cobro CxC: {e}")
        texto_error = str(e)
        mensajes_controlados = [
            "La cuenta por cobrar no existe",
            "La venta no es a crédito",
            "La cuenta ya está pagada",
            "El monto debe ser mayor a cero",
            "El cobro no puede superar el saldo pendiente"
        ]
        for mensaje in mensajes_controlados:
            if mensaje in texto_error:
                return {"exito": False, "mensaje": mensaje}
        return {"exito": False, "mensaje": "No se pudo registrar el cobro"}
    
# --- INGRESOS Y COBROS ---
def _obtener_registros_paginados(construir_consulta, tamano_lote=1000):
    registros = []
    inicio = 0

    while True:
        fin = inicio + tamano_lote - 1
        response = construir_consulta().range(inicio, fin).execute()
        lote = response.data or []
        registros.extend(lote)

        if len(lote) < tamano_lote:
            break

        inicio += tamano_lote

    return registros


def obtener_ingresos_y_cobros(id_empresa):
    try:
        ventas_contado = _obtener_registros_paginados(
            lambda: supabase.table("ventas")
                .select("id_venta,id_cliente,cliente,total,metodo_pago,fecha")
                .eq("id_empresa", id_empresa)
                .eq("tipo_venta", "Contado")
                .order("fecha", desc=True)
        )

        pagos_credito = _obtener_registros_paginados(
            lambda: supabase.table("pagos_cxc")
                .select(
                    "id_pago_cxc,id_venta,monto,metodo_pago,"
                    "referencia,notas,fecha_pago,ventas!inner(cliente,id_cliente)"
                )
                .eq("id_empresa", id_empresa)
                .order("fecha_pago", desc=True)
        )

        movimientos = []

        for venta in ventas_contado:
            movimientos.append({
                "id_movimiento": f"venta-{venta['id_venta']}",
                "origen": "Contado",
                "tipo": "Venta de contado",
                "id_venta": venta["id_venta"],
                "id_cliente": venta.get("id_cliente"),
                "cliente": venta.get("cliente") or "Público general",
                "monto": float(venta.get("total") or 0),
                "metodo_pago": venta.get("metodo_pago") or "No especificado",
                "referencia": None,
                "notas": None,
                "fecha": venta.get("fecha")
            })

        for pago in pagos_credito:
            venta_relacionada = pago.get("ventas") or {}

            if isinstance(venta_relacionada, list):
                venta_relacionada = (
                    venta_relacionada[0]
                    if venta_relacionada
                    else {}
                )

            es_abono_inicial = pago.get("referencia") == "Abono inicial"

            movimientos.append({
                "id_movimiento": f"cxc-{pago['id_pago_cxc']}",
                "origen": "Credito",
                "tipo": "Abono inicial" if es_abono_inicial else "Cobro CxC",
                "id_venta": pago["id_venta"],
                "id_cliente": venta_relacionada.get("id_cliente"),
                "cliente": (
                    venta_relacionada.get("cliente")
                    or "Cliente no identificado"
                ),
                "monto": float(pago.get("monto") or 0),
                "metodo_pago": (
                    pago.get("metodo_pago")
                    or "No especificado"
                ),
                "referencia": pago.get("referencia"),
                "notas": pago.get("notas"),
                "fecha": pago.get("fecha_pago")
            })

        movimientos.sort(
            key=lambda movimiento: movimiento.get("fecha") or "",
            reverse=True
        )

        return movimientos

    except Exception as e:
        print(f"Error al obtener ingresos y cobros: {e}")
        return None

# --- GASTOS Y SALIDAS ---
def registrar_gasto_operativo(
    id_empresa,
    categoria,
    tipo_gasto,
    concepto,
    monto,
    fecha_gasto,
    metodo_pago,
    referencia=None,
    notas=None
):
    try:
        response = supabase.table("gastos_operativos").insert({
            "id_empresa": id_empresa,
            "categoria": categoria,
            "tipo_gasto": tipo_gasto,
            "concepto": concepto,
            "monto": monto,
            "fecha_gasto": fecha_gasto,
            "metodo_pago": metodo_pago,
            "referencia": referencia,
            "notas": notas
        }).execute()

        if not response.data:
            return {
                "exito": False,
                "mensaje": "Supabase no devolvió el gasto registrado"
            }

        return {
            "exito": True,
            "mensaje": "Gasto registrado correctamente",
            "data": response.data[0]
        }

    except Exception as e:
        print(f"Error al registrar gasto operativo: {e}")
        return {
            "exito": False,
            "mensaje": "No se pudo registrar el gasto"
        }


def anular_gasto_operativo(id_empresa, id_gasto):
    try:
        response = supabase.table("gastos_operativos") \
            .update({"activo": False}) \
            .eq("id_empresa", id_empresa) \
            .eq("id_gasto", id_gasto) \
            .eq("activo", True) \
            .execute()

        if not response.data:
            return {
                "exito": False,
                "mensaje": "El gasto no existe o ya fue anulado"
            }

        return {
            "exito": True,
            "mensaje": "Gasto anulado correctamente"
        }

    except Exception as e:
        print(f"Error al anular gasto operativo: {e}")
        return {
            "exito": False,
            "mensaje": "No se pudo anular el gasto"
        }


def obtener_gastos(id_empresa):
    try:
        pagos_compras = _obtener_registros_paginados(
            lambda: supabase.table("pagos_cxp")
                .select(
                    "id_compra,monto,metodo_pago,fecha_pago,"
                    "compras!inner("
                    "id_empresa,tipo_compra,proveedores(nombre)"
                    ")"
                )
                .eq("compras.id_empresa", id_empresa)
                .order("fecha_pago", desc=True)
        )

        gastos_manuales = _obtener_registros_paginados(
            lambda: supabase.table("gastos_operativos")
                .select(
                    "id_gasto,categoria,tipo_gasto,concepto,monto,"
                    "fecha_gasto,metodo_pago,referencia,notas"
                )
                .eq("id_empresa", id_empresa)
                .eq("activo", True)
                .order("fecha_gasto", desc=True)
        )

        movimientos = []

        for indice, pago in enumerate(pagos_compras):
            compra = pago.get("compras") or {}

            if isinstance(compra, list):
                compra = compra[0] if compra else {}

            proveedor = compra.get("proveedores") or {}

            if isinstance(proveedor, list):
                proveedor = proveedor[0] if proveedor else {}

            es_contado = compra.get("tipo_compra") == "Contado"
            id_compra = pago.get("id_compra")

            movimientos.append({
                "id_movimiento": f"pago-cxp-{id_compra}-{indice}",
                "id_gasto": None,
                "id_compra": id_compra,
                "origen": "Compras" if es_contado else "CxP",
                "tipo_gasto": "Variable",
                "categoria": "Compras e inventario",
                "concepto": (
                    "Compra de contado"
                    if es_contado
                    else "Pago a proveedor"
                ),
                "monto": float(pago.get("monto") or 0),
                "metodo_pago": (
                    pago.get("metodo_pago")
                    or "No especificado"
                ),
                "referencia": f"Compra #{id_compra}",
                "notas": (
                    f"Proveedor: {proveedor.get('nombre')}"
                    if proveedor.get("nombre")
                    else None
                ),
                "fecha": pago.get("fecha_pago"),
                "anulable": False
            })

        for gasto in gastos_manuales:
            movimientos.append({
                "id_movimiento": f"gasto-{gasto['id_gasto']}",
                "id_gasto": gasto["id_gasto"],
                "id_compra": None,
                "origen": "Manual",
                "tipo_gasto": gasto.get("tipo_gasto") or "Variable",
                "categoria": gasto.get("categoria") or "Otros",
                "concepto": gasto.get("concepto") or "Sin concepto",
                "monto": float(gasto.get("monto") or 0),
                "metodo_pago": (
                    gasto.get("metodo_pago")
                    or "No especificado"
                ),
                "referencia": gasto.get("referencia"),
                "notas": gasto.get("notas"),
                "fecha": gasto.get("fecha_gasto"),
                "anulable": True
            })

        movimientos.sort(
            key=lambda movimiento: movimiento.get("fecha") or "",
            reverse=True
        )

        return movimientos

    except Exception as e:
        print(f"Error al obtener gastos: {e}")
        return None