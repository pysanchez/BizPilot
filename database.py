import os
import uuid
from datetime import date, datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "Faltan las variables SUPABASE_URL o SUPABASE_KEY"
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

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


def crear_producto_rapido(datos_producto):
    try:
        id_empresa = int(datos_producto["id_empresa"])
        nombre = " ".join(str(datos_producto["nombre"]).split())
        id_proveedor = datos_producto.get("id_proveedor")

        existente = supabase.table("productos") \
            .select("*") \
            .eq("id_empresa", id_empresa) \
            .ilike("nombre", nombre) \
            .limit(1) \
            .execute()

        if existente.data:
            return {
                "exito": True,
                "creado": False,
                "mensaje": "El producto ya estaba registrado en inventario",
                "data": existente.data[0]
            }

        if id_proveedor is not None:
            proveedor = supabase.table("proveedores") \
                .select("id_proveedor") \
                .eq("id_proveedor", id_proveedor) \
                .eq("id_empresa", id_empresa) \
                .limit(1) \
                .execute()
            if not proveedor.data:
                return {
                    "exito": False,
                    "mensaje": "El proveedor seleccionado no pertenece a esta empresa"
                }

        nuevo_producto = {
            "id_empresa": id_empresa,
            "id_proveedor": id_proveedor,
            "sku": f"VR-{uuid.uuid4().hex[:10].upper()}",
            "nombre": nombre,
            "categoria": "Venta rápida",
            "precio_compra": float(datos_producto.get("precio_compra") or 0),
            "precio_venta": float(datos_producto["precio_venta"]),
            "stock": 0,
            "stock_minimo": 5
        }
        response = supabase.table("productos").insert(nuevo_producto).execute()
        producto = response.data[0] if response.data else None

        return {
            "exito": True,
            "creado": True,
            "mensaje": "Producto agregado a inventario con existencia cero",
            "data": producto
        }
    except Exception as e:
        print(f"Error al crear producto rápido: {e}")
        return {
            "exito": False,
            "mensaje": "No se pudo agregar el producto al inventario"
        }


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
            "Stock insuficiente",
            "El tipo de producto no es válido",
            "La cantidad de un producto no es válida",
            "Escribe el nombre del producto de venta rápida",
            "El precio de una venta rápida debe ser mayor a cero",
            "El proveedor de la venta rápida no pertenece a esta empresa",
            "El total de la venta debe ser mayor a cero"
        ]
        for mensaje in mensajes_controlados:
            if mensaje in texto_error:
                return {"exito": False, "mensaje": mensaje}
        indicadores_migracion = [
            "PGRST202",
            "Could not find the function",
            "does not exist",
            "schema cache",
            "column",
            "relation"
        ]
        if any(indicador.lower() in texto_error.lower() for indicador in indicadores_migracion):
            return {
                "exito": False,
                "mensaje": (
                    "La base de datos no tiene la versión requerida. "
                    "Ejecuta migracion_operaciones_finanzas_20260810.sql en Supabase."
                )
            }
        return {
            "exito": False,
            "mensaje": "No se pudo registrar la venta. Revisa el error técnico en los logs de Render."
        }

def obtener_historial_ventas(id_empresa):
    try:
        response = supabase.table("ventas").select("*").eq("id_empresa", id_empresa).order("id_venta", desc=True).execute()
        return response.data
    except Exception as e:
        return []

def obtener_compras_clientes(id_empresa):
    try:
        response = supabase.table("ventas") \
            .select(
                "id_venta,id_cliente,cliente,total,tipo_venta,estado_pago,fecha,"
                "ventas_detalle("
                "id_producto,nombre_producto,tipo_item,cantidad,"
                "precio_unitario,costo_unitario,subtotal,lugar_compra,productos(nombre,sku)"
                ")"
            ) \
            .eq("id_empresa", id_empresa) \
            .order("fecha", desc=True) \
            .execute()

        return [
            venta
            for venta in (response.data or [])
            if venta.get("id_cliente") is not None
        ]
    except Exception as e:
        print(f"Error al obtener compras de clientes: {e}")
        return None

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


def crear_cliente_rapido(id_empresa, nombre):
    datos_cliente = {
        "id_empresa": id_empresa,
        "nombre": " ".join(str(nombre).split()),
        "telefono": None,
        "email": None,
        "rfc": None,
        "tipo_cliente": "Minorista",
        "limite_credito": 0,
        "dias_credito": 0,
        "activo": True
    }
    resultado = crear_cliente(datos_cliente)
    if resultado.get("exito"):
        resultado["mensaje"] = "Cliente agregado al directorio. Completa sus datos después."
    return resultado


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
def registrar_compra(
    id_empresa,
    id_proveedor,
    lugar_compra,
    carrito,
    total,
    tipo_compra="Contado",
    dias_credito=0,
    monto_pagado=0.0,
    metodo_pago="Transferencia"
):
    try:
        if id_proveedor is not None:
            proveedor = supabase.table("proveedores") \
                .select("id_proveedor") \
                .eq("id_proveedor", id_proveedor) \
                .eq("id_empresa", id_empresa) \
                .limit(1) \
                .execute()
            if not proveedor.data:
                return {
                    "exito": False,
                    "mensaje": "El proveedor seleccionado no pertenece a esta empresa"
                }
        elif not lugar_compra:
            return {
                "exito": False,
                "mensaje": "Selecciona un proveedor o escribe dónde se compró"
            }

        monto_inicial = float(monto_pagado) if tipo_compra == "Credito" else total
        estado_pago = "Pagado" if monto_inicial >= total else "Pendiente"
        dias = dias_credito if tipo_compra == "Credito" else 0

        res_compra = supabase.table("compras").insert({
            "id_empresa": id_empresa,
            "id_proveedor": id_proveedor,
            "lugar_compra": lugar_compra,
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
                prod_db = supabase.table("productos") \
                    .select("stock") \
                    .eq("id_producto", id_producto) \
                    .eq("id_empresa", id_empresa) \
                    .limit(1) \
                    .execute()
                if not prod_db.data:
                    raise ValueError("Producto no encontrado en esta empresa")
                nuevo_stock = prod_db.data[0]["stock"] + item["cantidad"]
                datos_actualizacion = {
                    "stock": nuevo_stock,
                    "precio_compra": item["precio_compra"]
                }
                if id_proveedor is not None:
                    datos_actualizacion["id_proveedor"] = id_proveedor

                supabase.table("productos") \
                    .update(datos_actualizacion) \
                    .eq("id_producto", id_producto) \
                    .eq("id_empresa", id_empresa) \
                    .execute()

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

# --- GASTOS Y SALIDAS ---
def _fecha_compra(compra, pagos):
    fecha = (
        compra.get("fecha")
        or compra.get("fecha_compra")
        or compra.get("created_at")
    )
    if fecha:
        return fecha
    if pagos:
        return pagos[0].get("fecha_pago") or date.today().isoformat()
    return date.today().isoformat()

def _origen_compra(compra):
    proveedor = compra.get("proveedores") or {}
    return (
        proveedor.get("nombre")
        or compra.get("lugar_compra")
        or "Sin proveedor"
    )

def obtener_gastos(id_empresa):
    try:
        movimientos = []

        gastos = supabase.table("gastos") \
            .select("*") \
            .eq("id_empresa", id_empresa) \
            .eq("activo", True) \
            .order("fecha_gasto", desc=True) \
            .execute()

        for gasto in gastos.data or []:
            movimientos.append({
                "id_gasto": gasto.get("id_gasto"),
                "id_compra": None,
                "origen": "Manual",
                "tipo_gasto": gasto.get("tipo_gasto") or "Variable",
                "categoria": gasto.get("categoria") or "Otro",
                "concepto": gasto.get("concepto") or "Gasto manual",
                "monto": float(gasto.get("monto") or 0),
                "fecha": gasto.get("fecha_gasto"),
                "metodo_pago": gasto.get("metodo_pago") or "Otro",
                "referencia": gasto.get("referencia"),
                "notas": gasto.get("notas"),
                "anulable": True
            })

        compras = supabase.table("compras") \
            .select("*, proveedores(nombre), pagos_cxp(*)") \
            .eq("id_empresa", id_empresa) \
            .execute()

        for compra in compras.data or []:
            pagos = sorted(
                compra.get("pagos_cxp") or [],
                key=lambda pago: str(pago.get("fecha_pago") or "")
            )
            origen = _origen_compra(compra)
            tipo_compra = str(compra.get("tipo_compra") or "Contado").lower()

            if tipo_compra.startswith("cred"):
                for pago in pagos:
                    id_pago = pago.get("id_pago_cxp") or pago.get("id_pago")
                    referencia = f"Compra #{compra.get('id_compra')}"
                    if id_pago:
                        referencia += f" · Pago #{id_pago}"

                    movimientos.append({
                        "id_gasto": None,
                        "id_compra": compra.get("id_compra"),
                        "origen": "CxP",
                        "tipo_gasto": "Variable",
                        "categoria": "Proveedores",
                        "concepto": f"Pago a proveedor · {origen}",
                        "monto": float(pago.get("monto") or 0),
                        "fecha": pago.get("fecha_pago") or _fecha_compra(compra, pagos),
                        "metodo_pago": pago.get("metodo_pago") or "No especificado",
                        "referencia": referencia,
                        "notas": "Pago aplicado a una compra a crédito",
                        "anulable": False
                    })
            else:
                pago = pagos[0] if pagos else {}
                movimientos.append({
                    "id_gasto": None,
                    "id_compra": compra.get("id_compra"),
                    "origen": "Compras",
                    "tipo_gasto": "Variable",
                    "categoria": "Compras de inventario",
                    "concepto": f"Compra de contado · {origen}",
                    "monto": float(compra.get("total") or 0),
                    "fecha": _fecha_compra(compra, pagos),
                    "metodo_pago": pago.get("metodo_pago") or "No especificado",
                    "referencia": f"Compra #{compra.get('id_compra')}",
                    "notas": "Entrada de mercancía pagada de contado",
                    "anulable": False
                })

        return sorted(
            movimientos,
            key=lambda movimiento: str(movimiento.get("fecha") or ""),
            reverse=True
        )
    except Exception as e:
        print(f"Error al obtener gastos: {e}")
        return None

def crear_gasto_manual(datos_gasto):
    try:
        datos = {**datos_gasto, "activo": True}
        response = supabase.table("gastos").insert(datos).execute()
        gasto = response.data[0] if response.data else None
        return {
            "exito": True,
            "mensaje": "Gasto registrado correctamente",
            "data": gasto
        }
    except Exception as e:
        print(f"Error al crear gasto manual: {e}")
        return {"exito": False, "mensaje": "No se pudo registrar el gasto"}

def anular_gasto_manual(id_gasto, id_empresa):
    try:
        existente = supabase.table("gastos") \
            .select("id_gasto") \
            .eq("id_gasto", id_gasto) \
            .eq("id_empresa", id_empresa) \
            .eq("activo", True) \
            .limit(1) \
            .execute()

        if not existente.data:
            return {"exito": False, "mensaje": "El gasto no existe o ya fue anulado"}

        supabase.table("gastos") \
            .update({
                "activo": False,
                "fecha_anulacion": datetime.now(timezone.utc).isoformat()
            }) \
            .eq("id_gasto", id_gasto) \
            .eq("id_empresa", id_empresa) \
            .execute()

        return {"exito": True, "mensaje": "Gasto anulado correctamente"}
    except Exception as e:
        print(f"Error al anular gasto manual: {e}")
        return {"exito": False, "mensaje": "No se pudo anular el gasto"}

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
            .select(
                "id_venta,id_empresa,id_cliente,cliente,total,metodo_pago,tipo_venta,"
                "monto_pagado,estado_pago,fecha,fecha_vencimiento,"
                "clientes(nombre,telefono,limite_credito,dias_credito),"
                "ventas_detalle("
                "id_producto,nombre_producto,tipo_item,cantidad,precio_unitario,subtotal,"
                "productos(nombre,sku)"
                "),"
                "pagos_cxc("
                "id_pago_cxc,id_empresa,id_venta,monto,metodo_pago,descripcion,"
                "referencia,notas,fecha_pago,saldo_antes,saldo_despues"
                ")"
            ) \
            .eq("id_empresa", id_empresa) \
            .eq("tipo_venta", "Credito") \
            .order("fecha_vencimiento", desc=False) \
            .order("id_venta", desc=True) \
            .execute()
        return response.data
    except Exception as e:
        print(f"Error al obtener CxC: {e}")
        return None

def registrar_abono_cxc(
    id_empresa,
    id_venta,
    monto,
    metodo_pago,
    descripcion=None,
    referencia=None,
    notas=None
):
    try:
        response = supabase.rpc("bizpilot_registrar_abono_cxc", {
            "p_id_empresa": id_empresa,
            "p_id_venta": id_venta,
            "p_monto": monto,
            "p_metodo_pago": metodo_pago,
            "p_descripcion": descripcion,
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

def actualizar_fecha_movimiento_cxc(
    id_empresa,
    tipo_movimiento,
    id_movimiento,
    fecha
):
    try:
        fecha_iso = fecha.isoformat() if hasattr(fecha, "isoformat") else str(fecha)
        response = supabase.rpc("bizpilot_actualizar_fecha_movimiento_cxc", {
            "p_id_empresa": id_empresa,
            "p_tipo_movimiento": tipo_movimiento,
            "p_id_movimiento": id_movimiento,
            "p_fecha": fecha_iso
        }).execute()

        resultado = response.data
        if isinstance(resultado, list) and len(resultado) == 1:
            resultado = resultado[0]
        if isinstance(resultado, dict):
            return resultado
        return {"exito": False, "mensaje": "Supabase no confirmó el cambio de fecha"}
    except Exception as e:
        print(f"Error al actualizar fecha de CxC: {e}")
        texto_error = str(e)
        mensajes_controlados = [
            "El movimiento no existe o no pertenece a esta empresa",
            "El tipo de movimiento no es válido",
            "La fecha no es válida"
        ]
        for mensaje in mensajes_controlados:
            if mensaje in texto_error:
                return {"exito": False, "mensaje": mensaje}
        return {"exito": False, "mensaje": "No se pudo actualizar la fecha del movimiento"}