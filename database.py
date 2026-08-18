import os
import uuid
from datetime import date, datetime, timedelta, timezone
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
                usuario_db.pop("password", None)

                empresa = obtener_nombre_empresa(
                    usuario_db["id_empresa"]
                )
                usuario_db["nombre_empresa"] = (
                    empresa.get("nombre_empresa")
                    if empresa.get("exito")
                    else "Empresa sin nombre"
                )

                return {"exito": True, "datos_usuario": usuario_db}
            else:
                return {"exito": False, "mensaje": "Contrasena incorrecta"}
        else:
            return {"exito": False, "mensaje": "Usuario no encontrado"}
    except Exception as e:
        print(f"Error en login: {e}")
        return {"exito": False, "mensaje": "Error de conexion"}


def nombre_visible_empresa(registro):
    if not registro:
        return None

    for campo in (
        "nombre",
        "nombre_empresa",
        "empresa_nombre",
        "nombre_comercial",
        "razon_social",
        "empresa"
    ):
        valor = registro.get(campo)
        if valor is not None and str(valor).strip():
            return str(valor).strip()

    return None


def obtener_nombre_empresa(id_empresa):
    try:
        response = supabase.table("empresas") \
            .select("*") \
            .eq("id_empresa", id_empresa) \
            .limit(1) \
            .execute()

        if not response.data:
            return {
                "exito": False,
                "mensaje": "Empresa no encontrada"
            }

        nombre = nombre_visible_empresa(response.data[0])
        if not nombre:
            nombre = "Empresa sin nombre"

        return {
            "exito": True,
            "nombre_empresa": nombre
        }
    except Exception as e:
        print(f"Error al obtener el nombre de la empresa: {e}")
        return {
            "exito": False,
            "mensaje": "No se pudo consultar la empresa"
        }

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


# --- CRM: PROSPECTOS ---
def obtener_prospectos(id_empresa):
    try:
        response = supabase.table("prospectos") \
            .select("*") \
            .eq("id_empresa", id_empresa) \
            .order("fecha_actualizacion", desc=True) \
            .execute()
        return response.data
    except Exception as e:
        print(f"Error al obtener prospectos: {e}")
        return None


def crear_prospecto(datos_prospecto):
    try:
        response = supabase.table("prospectos") \
            .insert(datos_prospecto) \
            .execute()

        prospecto = response.data[0] if response.data else None
        return {
            "exito": True,
            "mensaje": "Prospecto registrado exitosamente",
            "data": prospecto
        }
    except Exception as e:
        texto_error = str(e).lower()
        print(f"Error al crear prospecto: {e}")

        if "prospectos_seguimiento_activo_requerido" in texto_error:
            mensaje = "Indica el próximo seguimiento del prospecto"
        elif "prospectos_motivo_descarte_requerido" in texto_error:
            mensaje = "Indica el motivo de descarte"
        elif "prospectos_contacto_empresa_valido" in texto_error:
            mensaje = "El contacto principal solo corresponde a empresas"
        else:
            mensaje = "No se pudo guardar el prospecto"

        return {"exito": False, "mensaje": mensaje}


def actualizar_prospecto(
    id_prospecto,
    id_empresa,
    datos_prospecto
):
    try:
        prospecto_actual = supabase.table("prospectos") \
            .select("id_prospecto, estatus") \
            .eq("id_prospecto", id_prospecto) \
            .eq("id_empresa", id_empresa) \
            .limit(1) \
            .execute()

        if not prospecto_actual.data:
            return {
                "exito": False,
                "mensaje": "Prospecto no encontrado"
            }

        if prospecto_actual.data[0].get("estatus") == "Convertido":
            return {
                "exito": False,
                "mensaje": (
                    "Un prospecto convertido debe administrarse "
                    "desde su negociación"
                )
            }

        response = supabase.table("prospectos") \
            .update(datos_prospecto) \
            .eq("id_prospecto", id_prospecto) \
            .eq("id_empresa", id_empresa) \
            .execute()

        prospecto = response.data[0] if response.data else None
        return {
            "exito": True,
            "mensaje": "Prospecto actualizado exitosamente",
            "data": prospecto
        }
    except Exception as e:
        texto_error = str(e).lower()
        print(f"Error al actualizar prospecto: {e}")

        if "prospectos_seguimiento_activo_requerido" in texto_error:
            mensaje = "Indica el próximo seguimiento del prospecto"
        elif "prospectos_motivo_descarte_requerido" in texto_error:
            mensaje = "Indica el motivo de descarte"
        elif "prospectos_contacto_empresa_valido" in texto_error:
            mensaje = "El contacto principal solo corresponde a empresas"
        else:
            mensaje = "No se pudo actualizar el prospecto"

        return {"exito": False, "mensaje": mensaje}


def obtener_seguimientos_prospecto(id_prospecto, id_empresa):
    try:
        prospecto = supabase.table("prospectos") \
            .select("id_prospecto") \
            .eq("id_prospecto", id_prospecto) \
            .eq("id_empresa", id_empresa) \
            .limit(1) \
            .execute()

        if not prospecto.data:
            return {
                "exito": False,
                "mensaje": "Prospecto no encontrado",
                "data": []
            }

        response = supabase.table("seguimientos_prospectos") \
            .select("*") \
            .eq("id_prospecto", id_prospecto) \
            .eq("id_empresa", id_empresa) \
            .order("fecha_seguimiento", desc=True) \
            .order("id_seguimiento", desc=True) \
            .execute()

        return {
            "exito": True,
            "mensaje": "Seguimientos consultados",
            "data": response.data or []
        }
    except Exception as e:
        print(f"Error al obtener seguimientos del prospecto: {e}")
        return {
            "exito": False,
            "mensaje": "No se pudieron consultar los seguimientos",
            "data": []
        }


def registrar_seguimiento_prospecto(
    id_prospecto,
    datos_seguimiento
):
    try:
        parametros = {
            "p_id_empresa": datos_seguimiento["id_empresa"],
            "p_id_prospecto": id_prospecto,
            "p_id_usuario": datos_seguimiento["id_usuario"],
            "p_tipo": datos_seguimiento["tipo"],
            "p_fecha_seguimiento": datos_seguimiento[
                "fecha_seguimiento"
            ],
            "p_resultado": datos_seguimiento["resultado"],
            "p_comentarios": datos_seguimiento["comentarios"],
            "p_proxima_accion": datos_seguimiento.get(
                "proxima_accion"
            ),
            "p_proximo_seguimiento": datos_seguimiento.get(
                "proximo_seguimiento"
            ),
            "p_estatus_nuevo": datos_seguimiento[
                "estatus_nuevo"
            ],
            "p_motivo_descarte": datos_seguimiento.get(
                "motivo_descarte"
            )
        }

        response = supabase.rpc(
            "bizpilot_registrar_seguimiento_prospecto",
            parametros
        ).execute()

        registro = response.data
        if isinstance(registro, list):
            registro = registro[0] if registro else None

        return {
            "exito": True,
            "mensaje": "Seguimiento registrado exitosamente",
            "data": registro
        }
    except Exception as e:
        texto_error = str(e).lower()
        print(f"Error al registrar seguimiento: {e}")

        if "prospecto no encontrado" in texto_error:
            mensaje = "Prospecto no encontrado"
        elif "usuario no valido" in texto_error:
            mensaje = "El usuario no pertenece a esta empresa"
        elif "convertido" in texto_error:
            mensaje = (
                "El prospecto convertido se administra "
                "desde Negociaciones"
            )
        elif "motivo de descarte" in texto_error:
            mensaje = "Indica el motivo de descarte"
        elif "proxima accion" in texto_error:
            mensaje = "Indica la proxima accion"
        elif "proximo seguimiento" in texto_error:
            mensaje = "Indica el proximo seguimiento"
        else:
            mensaje = "No se pudo registrar el seguimiento"

        return {"exito": False, "mensaje": mensaje}


# --- CRM: EMBUDO Y COTIZACIONES ---
def obtener_embudo_crm(id_empresa):
    try:
        oportunidades_response = supabase.table(
            "oportunidades_crm"
        ).select("*") \
            .eq("id_empresa", id_empresa) \
            .eq("estado", "Activa") \
            .order("fecha_actualizacion", desc=True) \
            .execute()

        oportunidades = oportunidades_response.data or []

        prospectos_response = supabase.table("prospectos") \
            .select(
                "id_prospecto, tipo_prospecto, nombre, "
                "contacto_principal, telefono, email, "
                "interes_en, estatus, proximo_seguimiento"
            ) \
            .eq("id_empresa", id_empresa) \
            .eq("estatus", "Calificado") \
            .order("fecha_actualizacion", desc=True) \
            .execute()

        prospectos_calificados = prospectos_response.data or []

        ids_prospectos = list({
            int(item["id_prospecto"])
            for item in oportunidades
            if item.get("id_prospecto") is not None
        })

        prospectos_oportunidad = []
        seguimientos = []

        if ids_prospectos:
            prospectos_oportunidad = supabase.table("prospectos") \
                .select(
                    "id_prospecto, tipo_prospecto, nombre, "
                    "contacto_principal, telefono, email, "
                    "interes_en, estatus, proximo_seguimiento"
                ) \
                .eq("id_empresa", id_empresa) \
                .in_("id_prospecto", ids_prospectos) \
                .execute().data or []

            seguimientos = supabase.table(
                "seguimientos_prospectos"
            ).select(
                "id_seguimiento, id_prospecto, proxima_accion, "
                "proximo_seguimiento, fecha_seguimiento"
            ).eq("id_empresa", id_empresa) \
                .in_("id_prospecto", ids_prospectos) \
                .order("fecha_seguimiento", desc=True) \
                .order("id_seguimiento", desc=True) \
                .execute().data or []

        ids_oportunidades = [
            int(item["id_oportunidad"])
            for item in oportunidades
        ]

        cotizaciones = []
        detalles = []

        if ids_oportunidades:
            cotizaciones = supabase.table("cotizaciones_crm") \
                .select("*") \
                .eq("id_empresa", id_empresa) \
                .in_("id_oportunidad", ids_oportunidades) \
                .order("version", desc=True) \
                .execute().data or []

            ids_cotizaciones = [
                int(item["id_cotizacion"])
                for item in cotizaciones
            ]

            if ids_cotizaciones:
                detalles = supabase.table(
                    "cotizaciones_detalle_crm"
                ).select("*") \
                    .eq("id_empresa", id_empresa) \
                    .in_("id_cotizacion", ids_cotizaciones) \
                    .order("orden") \
                    .execute().data or []

        mapa_prospectos = {
            int(item["id_prospecto"]): item
            for item in prospectos_oportunidad
        }

        mapa_seguimientos = {}
        for item in seguimientos:
            id_prospecto = int(item["id_prospecto"])
            if id_prospecto not in mapa_seguimientos:
                mapa_seguimientos[id_prospecto] = item

        detalles_por_cotizacion = {}
        for item in detalles:
            id_cotizacion = int(item["id_cotizacion"])
            detalles_por_cotizacion.setdefault(
                id_cotizacion,
                []
            ).append(item)

        cotizaciones_por_oportunidad = {}
        for item in cotizaciones:
            id_cotizacion = int(item["id_cotizacion"])
            id_oportunidad = int(item["id_oportunidad"])
            item["partidas"] = detalles_por_cotizacion.get(
                id_cotizacion,
                []
            )
            cotizaciones_por_oportunidad.setdefault(
                id_oportunidad,
                []
            ).append(item)

        for oportunidad in oportunidades:
            id_oportunidad = int(oportunidad["id_oportunidad"])
            id_prospecto = int(oportunidad["id_prospecto"])
            versiones = cotizaciones_por_oportunidad.get(
                id_oportunidad,
                []
            )

            oportunidad["prospecto"] = mapa_prospectos.get(
                id_prospecto
            )
            oportunidad["ultimo_seguimiento"] = (
                mapa_seguimientos.get(id_prospecto)
            )
            oportunidad["cotizaciones"] = versiones
            oportunidad["cotizacion_actual"] = (
                next(
                    (
                        item for item in versiones
                        if item.get("estado") != "Sustituida"
                    ),
                    versiones[0] if versiones else None
                )
            )

        return {
            "exito": True,
            "mensaje": "Embudo consultado",
            "data": {
                "oportunidades": oportunidades,
                "prospectos_calificados": prospectos_calificados
            }
        }
    except Exception as e:
        print(f"Error al obtener el embudo CRM: {e}")
        return {
            "exito": False,
            "mensaje": "No se pudo consultar el embudo",
            "data": {
                "oportunidades": [],
                "prospectos_calificados": []
            }
        }


def crear_oportunidad_crm(datos):
    try:
        parametros = {
            "p_id_empresa": datos["id_empresa"],
            "p_id_prospecto": datos["id_prospecto"],
            "p_id_usuario": datos["id_usuario"],
            "p_titulo": datos["titulo"],
            "p_etapa": datos["etapa"],
            "p_valor_estimado": datos["valor_estimado"],
            "p_probabilidad": datos["probabilidad"],
            "p_notas": datos.get("notas")
        }

        response = supabase.rpc(
            "bizpilot_crear_oportunidad_crm",
            parametros
        ).execute()

        registro = response.data
        if isinstance(registro, list):
            registro = registro[0] if registro else None

        return {
            "exito": True,
            "mensaje": "Oportunidad creada exitosamente",
            "data": registro
        }
    except Exception as e:
        return error_oportunidad_crm(
            e,
            "No se pudo crear la oportunidad"
        )


def actualizar_oportunidad_crm(id_oportunidad, datos):
    try:
        parametros = {
            "p_id_empresa": datos["id_empresa"],
            "p_id_oportunidad": id_oportunidad,
            "p_id_usuario": datos["id_usuario"],
            "p_titulo": datos["titulo"],
            "p_etapa": datos["etapa"],
            "p_valor_estimado": datos["valor_estimado"],
            "p_probabilidad": datos["probabilidad"],
            "p_notas": datos.get("notas")
        }

        response = supabase.rpc(
            "bizpilot_actualizar_oportunidad_crm",
            parametros
        ).execute()

        registro = response.data
        if isinstance(registro, list):
            registro = registro[0] if registro else None

        return {
            "exito": True,
            "mensaje": "Oportunidad actualizada exitosamente",
            "data": registro
        }
    except Exception as e:
        return error_oportunidad_crm(
            e,
            "No se pudo actualizar la oportunidad"
        )


def error_oportunidad_crm(error, mensaje_predeterminado):
    texto_error = str(error).lower()
    print(f"Error en oportunidad CRM: {error}")

    if "solo un prospecto calificado" in texto_error:
        mensaje = "El prospecto debe estar Calificado"
    elif "ya tiene una oportunidad activa" in texto_error:
        mensaje = "El prospecto ya esta dentro del embudo"
    elif "prospecto no encontrado" in texto_error:
        mensaje = "Prospecto no encontrado"
    elif "usuario no valido" in texto_error:
        mensaje = "El usuario no pertenece a esta empresa"
    elif "oportunidad activa no encontrada" in texto_error:
        mensaje = "Oportunidad activa no encontrada"
    else:
        mensaje = mensaje_predeterminado

    return {"exito": False, "mensaje": mensaje}


def crear_cotizacion_crm(id_oportunidad, datos):
    try:
        parametros = {
            "p_id_empresa": datos["id_empresa"],
            "p_id_oportunidad": id_oportunidad,
            "p_id_usuario": datos["id_usuario"],
            "p_estado": datos["estado"],
            "p_vigencia_hasta": datos["vigencia_hasta"],
            "p_descuento_porcentaje": datos[
                "descuento_porcentaje"
            ],
            "p_impuesto_porcentaje": datos[
                "impuesto_porcentaje"
            ],
            "p_notas": datos.get("notas"),
            "p_partidas": datos["partidas"]
        }

        response = supabase.rpc(
            "bizpilot_crear_cotizacion_crm",
            parametros
        ).execute()

        registro = response.data
        if isinstance(registro, list):
            registro = registro[0] if registro else None

        return {
            "exito": True,
            "mensaje": "Cotizacion guardada exitosamente",
            "data": registro
        }
    except Exception as e:
        texto_error = str(e).lower()
        print(f"Error al crear cotizacion CRM: {e}")

        if "oportunidad activa no encontrada" in texto_error:
            mensaje = "Oportunidad activa no encontrada"
        elif "usuario no valido" in texto_error:
            mensaje = "El usuario no pertenece a esta empresa"
        elif "al menos una partida" in texto_error:
            mensaje = "Agrega al menos una partida"
        elif "vigencia" in texto_error:
            mensaje = "Indica la vigencia de la cotizacion"
        elif "porcentajes" in texto_error:
            mensaje = "Revisa descuento e impuesto"
        elif "concepto" in texto_error:
            mensaje = "Cada partida necesita un concepto"
        elif "cantidad" in texto_error:
            mensaje = "La cantidad debe ser mayor a cero"
        elif "precio" in texto_error:
            mensaje = "El precio no puede ser negativo"
        else:
            mensaje = "No se pudo guardar la cotizacion"

        return {"exito": False, "mensaje": mensaje}


# --- CRM: NEGOCIACIONES CERRADAS Y DASHBOARD ---
def cerrar_negociacion_crm(id_oportunidad, datos):
    try:
        parametros = {
            "p_id_empresa": datos["id_empresa"],
            "p_id_oportunidad": id_oportunidad,
            "p_id_usuario": datos["id_usuario"],
            "p_resultado": datos["resultado"],
            "p_id_cotizacion": datos.get("id_cotizacion"),
            "p_id_cliente": datos.get("id_cliente"),
            "p_monto_final": datos["monto_final"],
            "p_motivo_perdida": datos.get("motivo_perdida"),
            "p_notas": datos.get("notas"),
            "p_fecha_cierre": datos["fecha_cierre"]
        }

        response = supabase.rpc(
            "bizpilot_cerrar_negociacion_crm",
            parametros
        ).execute()

        registro = response.data
        if isinstance(registro, list):
            registro = registro[0] if registro else None

        return {
            "exito": True,
            "mensaje": "Negociacion cerrada exitosamente",
            "data": registro
        }
    except Exception as e:
        texto_error = str(e).lower()
        print(f"Error al cerrar negociacion CRM: {e}")

        if "oportunidad activa no encontrada" in texto_error:
            mensaje = "Oportunidad activa no encontrada"
        elif "ya tiene una negociacion cerrada" in texto_error:
            mensaje = "La oportunidad ya fue cerrada"
        elif "usuario no valido" in texto_error:
            mensaje = "El usuario no pertenece a esta empresa"
        elif "necesita una cotizacion" in texto_error:
            mensaje = "Una compra necesita una cotizacion"
        elif "cotizacion no pertenece" in texto_error:
            mensaje = "La cotizacion no pertenece a la oportunidad"
        elif "monto final" in texto_error:
            mensaje = "El monto final debe ser mayor a cero"
        elif "motivo" in texto_error:
            mensaje = "Indica el motivo de perdida"
        elif "cliente seleccionado" in texto_error:
            mensaje = "El cliente seleccionado no es valido"
        elif "fecha de cierre" in texto_error:
            mensaje = "La fecha de cierre no puede estar en el futuro"
        else:
            mensaje = "No se pudo cerrar la negociacion"

        return {"exito": False, "mensaje": mensaje}


def obtener_negociaciones_cerradas_crm(id_empresa):
    try:
        response = supabase.table("negociaciones_cerradas_crm") \
            .select("*") \
            .eq("id_empresa", id_empresa) \
            .order("fecha_cierre", desc=True) \
            .order("id_negociacion", desc=True) \
            .execute()

        negociaciones = response.data or []
        if not negociaciones:
            return {
                "exito": True,
                "mensaje": "No hay negociaciones cerradas",
                "data": []
            }

        ids_prospectos = list({
            int(item["id_prospecto"])
            for item in negociaciones
        })
        ids_oportunidades = list({
            int(item["id_oportunidad"])
            for item in negociaciones
        })
        ids_cotizaciones = list({
            int(item["id_cotizacion"])
            for item in negociaciones
            if item.get("id_cotizacion") is not None
        })
        ids_clientes = list({
            int(item["id_cliente"])
            for item in negociaciones
            if item.get("id_cliente") is not None
        })

        prospectos = supabase.table("prospectos") \
            .select(
                "id_prospecto, tipo_prospecto, nombre, "
                "contacto_principal, telefono, email, "
                "interes_en, estatus"
            ) \
            .eq("id_empresa", id_empresa) \
            .in_("id_prospecto", ids_prospectos) \
            .execute().data or []

        oportunidades = supabase.table("oportunidades_crm") \
            .select(
                "id_oportunidad, titulo, etapa, "
                "valor_estimado, probabilidad, estado"
            ) \
            .eq("id_empresa", id_empresa) \
            .in_("id_oportunidad", ids_oportunidades) \
            .execute().data or []

        cotizaciones = []
        if ids_cotizaciones:
            cotizaciones = supabase.table("cotizaciones_crm") \
                .select(
                    "id_cotizacion, folio, version, estado, "
                    "vigencia_hasta, subtotal, descuento, "
                    "impuesto, total"
                ) \
                .eq("id_empresa", id_empresa) \
                .in_("id_cotizacion", ids_cotizaciones) \
                .execute().data or []

        clientes = []
        if ids_clientes:
            clientes = supabase.table("clientes") \
                .select(
                    "id_cliente, nombre, telefono, email, "
                    "tipo_cliente, activo"
                ) \
                .eq("id_empresa", id_empresa) \
                .in_("id_cliente", ids_clientes) \
                .execute().data or []

        mapa_prospectos = {
            int(item["id_prospecto"]): item
            for item in prospectos
        }
        mapa_oportunidades = {
            int(item["id_oportunidad"]): item
            for item in oportunidades
        }
        mapa_cotizaciones = {
            int(item["id_cotizacion"]): item
            for item in cotizaciones
        }
        mapa_clientes = {
            int(item["id_cliente"]): item
            for item in clientes
        }

        for negociacion in negociaciones:
            negociacion["prospecto"] = mapa_prospectos.get(
                int(negociacion["id_prospecto"])
            )
            negociacion["oportunidad"] = mapa_oportunidades.get(
                int(negociacion["id_oportunidad"])
            )
            negociacion["cotizacion"] = (
                mapa_cotizaciones.get(int(negociacion["id_cotizacion"]))
                if negociacion.get("id_cotizacion") is not None
                else None
            )
            negociacion["cliente"] = (
                mapa_clientes.get(int(negociacion["id_cliente"]))
                if negociacion.get("id_cliente") is not None
                else None
            )

        return {
            "exito": True,
            "mensaje": "Negociaciones consultadas",
            "data": negociaciones
        }
    except Exception as e:
        print(f"Error al consultar negociaciones cerradas: {e}")
        return {
            "exito": False,
            "mensaje": "No se pudieron consultar las negociaciones",
            "data": []
        }


def convertir_fecha_hora_crm(valor):
    if not valor:
        return None

    try:
        fecha = datetime.fromisoformat(
            str(valor).replace("Z", "+00:00")
        )
        if fecha.tzinfo is None:
            fecha = fecha.replace(tzinfo=timezone.utc)
        return fecha.astimezone(timezone.utc)
    except (TypeError, ValueError):
        return None


def obtener_dashboard_comercial(id_empresa):
    try:
        prospectos = supabase.table("prospectos") \
            .select(
                "id_prospecto, nombre, tipo_prospecto, estatus, "
                "interes_en, proximo_seguimiento"
            ) \
            .eq("id_empresa", id_empresa) \
            .order("proximo_seguimiento") \
            .execute().data or []

        oportunidades = supabase.table("oportunidades_crm") \
            .select(
                "id_oportunidad, id_prospecto, titulo, etapa, "
                "valor_estimado, probabilidad, fecha_actualizacion"
            ) \
            .eq("id_empresa", id_empresa) \
            .eq("estado", "Activa") \
            .execute().data or []

        cotizaciones_enviadas = supabase.table("cotizaciones_crm") \
            .select("id_cotizacion") \
            .eq("id_empresa", id_empresa) \
            .eq("estado", "Enviada") \
            .execute().data or []

        resultado_negociaciones = obtener_negociaciones_cerradas_crm(
            id_empresa
        )
        if not resultado_negociaciones.get("exito"):
            raise RuntimeError(
                resultado_negociaciones.get("mensaje")
                or "No se pudieron consultar los cierres"
            )

        negociaciones = resultado_negociaciones.get("data") or []
        estados_activos = {"Nuevo", "Contactado", "Calificado"}
        prospectos_activos = [
            item for item in prospectos
            if item.get("estatus") in estados_activos
        ]

        ahora = datetime.now(timezone.utc)
        hoy = ahora.date()
        seguimientos_vencidos = []
        seguimientos_hoy = []

        for prospecto in prospectos_activos:
            fecha = convertir_fecha_hora_crm(
                prospecto.get("proximo_seguimiento")
            )
            if not fecha:
                continue
            if fecha < ahora:
                seguimientos_vencidos.append(prospecto)
            if fecha.date() == hoy:
                seguimientos_hoy.append(prospecto)

        seguimientos_vencidos.sort(
            key=lambda item: item.get("proximo_seguimiento") or ""
        )

        valor_embudo = sum(
            float(item.get("valor_estimado") or 0)
            for item in oportunidades
        )
        valor_ponderado = sum(
            float(item.get("valor_estimado") or 0)
            * float(item.get("probabilidad") or 0)
            / 100
            for item in oportunidades
        )

        ganadas = [
            item for item in negociaciones
            if item.get("resultado") == "Compro"
        ]
        perdidas = [
            item for item in negociaciones
            if item.get("resultado") == "No compro"
        ]
        total_cierres = len(negociaciones)
        tasa_conversion = (
            len(ganadas) * 100 / total_cierres
            if total_cierres
            else 0
        )
        monto_ganado = sum(
            float(item.get("monto_final") or 0)
            for item in ganadas
        )

        etapas = {
            "Interes detectado": 0,
            "Preparando cotizacion": 0,
            "Cotizacion enviada": 0,
            "En revision": 0,
            "Esperando decision": 0
        }
        for oportunidad in oportunidades:
            etapa = oportunidad.get("etapa")
            if etapa in etapas:
                etapas[etapa] += 1

        motivos_perdida = {}
        for item in perdidas:
            motivo = item.get("motivo_perdida") or "Sin motivo"
            motivos_perdida[motivo] = motivos_perdida.get(motivo, 0) + 1

        motivos_ordenados = [
            {"motivo": motivo, "cantidad": cantidad}
            for motivo, cantidad in sorted(
                motivos_perdida.items(),
                key=lambda item: (-item[1], item[0])
            )
        ]

        return {
            "exito": True,
            "mensaje": "Dashboard comercial consultado",
            "data": {
                "resumen": {
                    "prospectos_activos": len(prospectos_activos),
                    "seguimientos_vencidos": len(
                        seguimientos_vencidos
                    ),
                    "seguimientos_hoy": len(seguimientos_hoy),
                    "oportunidades_activas": len(oportunidades),
                    "valor_embudo": round(valor_embudo, 2),
                    "valor_ponderado": round(valor_ponderado, 2),
                    "cotizaciones_enviadas": len(
                        cotizaciones_enviadas
                    ),
                    "cierres_ganados": len(ganadas),
                    "cierres_perdidos": len(perdidas),
                    "tasa_conversion": round(tasa_conversion, 2),
                    "monto_ganado": round(monto_ganado, 2)
                },
                "etapas": etapas,
                "seguimientos_vencidos": seguimientos_vencidos[:10],
                "cierres_recientes": negociaciones[:10],
                "motivos_perdida": motivos_ordenados[:8]
            }
        }
    except Exception as e:
        print(f"Error al consultar Dashboard comercial: {e}")
        return {
            "exito": False,
            "mensaje": "No se pudo consultar el Dashboard comercial",
            "data": None
        }

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


_ZONA_HORARIA_NEGOCIO = timezone(timedelta(hours=-6))


def _fecha_local_finanzas(valor):
    """Convierte fechas de Supabase a la fecha operativa de Monterrey."""
    if valor is None or valor == "":
        return None

    if isinstance(valor, datetime):
        fecha_hora = valor
    elif isinstance(valor, date):
        return valor
    else:
        texto = str(valor).strip()
        if len(texto) == 10:
            try:
                return date.fromisoformat(texto)
            except ValueError:
                return None

        try:
            fecha_hora = datetime.fromisoformat(texto.replace("Z", "+00:00"))
        except ValueError:
            return None

    if fecha_hora.tzinfo is not None:
        fecha_hora = fecha_hora.astimezone(_ZONA_HORARIA_NEGOCIO)

    return fecha_hora.date()


def _mover_mes(fecha_base, cantidad_meses):
    indice_mes = fecha_base.year * 12 + fecha_base.month - 1 + cantidad_meses
    return date(indice_mes // 12, indice_mes % 12 + 1, 1)


def obtener_dashboard_financiero(id_empresa):
    """Resume ventas y gastos sin volver a contar los abonos de CxC como ventas."""
    try:
        hoy = datetime.now(_ZONA_HORARIA_NEGOCIO).date()
        inicio_mes_actual = date(hoy.year, hoy.month, 1)
        inicio_diario = hoy - timedelta(days=29)
        inicio_mensual = _mover_mes(inicio_mes_actual, -11)

        respuesta_ventas = supabase.table("ventas") \
            .select("id_venta,total,fecha") \
            .eq("id_empresa", id_empresa) \
            .gte("fecha", inicio_mensual.isoformat()) \
            .execute()

        movimientos_gastos = obtener_gastos(id_empresa)
        if movimientos_gastos is None:
            return None

        dias = [inicio_diario + timedelta(days=indice) for indice in range(30)]
        meses = [_mover_mes(inicio_mensual, indice) for indice in range(12)]

        diario = {
            dia.isoformat(): {"ingresos": 0.0, "gastos": 0.0}
            for dia in dias
        }
        mensual = {
            mes.strftime("%Y-%m"): {"ingresos": 0.0, "gastos": 0.0}
            for mes in meses
        }

        ingresos_mes_actual = 0.0
        gastos_mes_actual = 0.0

        for venta in respuesta_ventas.data or []:
            fecha_venta = _fecha_local_finanzas(venta.get("fecha"))
            if fecha_venta is None or fecha_venta > hoy:
                continue

            monto = float(venta.get("total") or 0)
            clave_dia = fecha_venta.isoformat()
            clave_mes = fecha_venta.strftime("%Y-%m")

            if clave_dia in diario:
                diario[clave_dia]["ingresos"] += monto
            if clave_mes in mensual:
                mensual[clave_mes]["ingresos"] += monto
            if fecha_venta >= inicio_mes_actual:
                ingresos_mes_actual += monto

        for movimiento in movimientos_gastos:
            fecha_gasto = _fecha_local_finanzas(movimiento.get("fecha"))
            if fecha_gasto is None or fecha_gasto > hoy:
                continue

            monto = float(movimiento.get("monto") or 0)
            clave_dia = fecha_gasto.isoformat()
            clave_mes = fecha_gasto.strftime("%Y-%m")

            if clave_dia in diario:
                diario[clave_dia]["gastos"] += monto
            if clave_mes in mensual:
                mensual[clave_mes]["gastos"] += monto
            if fecha_gasto >= inicio_mes_actual:
                gastos_mes_actual += monto

        def construir_serie(agrupacion):
            serie = []
            for periodo, importes in agrupacion.items():
                ingresos = round(importes["ingresos"], 2)
                gastos = round(importes["gastos"], 2)
                serie.append({
                    "periodo": periodo,
                    "ingresos": ingresos,
                    "gastos": gastos,
                    "utilidad_neta": round(ingresos - gastos, 2)
                })
            return serie

        ingresos_mes_actual = round(ingresos_mes_actual, 2)
        gastos_mes_actual = round(gastos_mes_actual, 2)

        return {
            "resumen": {
                "periodo": inicio_mes_actual.strftime("%Y-%m"),
                "ingresos": ingresos_mes_actual,
                "gastos": gastos_mes_actual,
                "utilidad_neta": round(
                    ingresos_mes_actual - gastos_mes_actual,
                    2
                )
            },
            "diario": construir_serie(diario),
            "mensual": construir_serie(mensual),
            "fecha_corte": hoy.isoformat()
        }
    except Exception as e:
        print(f"Error al obtener dashboard financiero: {e}")
        return None

def obtener_datos_analisis_ingresos(
    id_empresa,
    fecha_inicio=None,
    fecha_fin=None
):
    try:
        hoy = datetime.now(_ZONA_HORARIA_NEGOCIO).date()
        inicio = fecha_inicio or date(hoy.year, hoy.month, 1)
        fin = fecha_fin or hoy

        if inicio > fin:
            return {
                "error": "La fecha inicial no puede ser posterior a la fecha final"
            }

        # Se consulta un día adicional para cubrir correctamente
        # movimientos guardados con zona horaria UTC.
        desde_consulta = (
            inicio - timedelta(days=1)
        ).isoformat()

        hasta_consulta = (
            fin + timedelta(days=2)
        ).isoformat()

        ventas_encontradas = []
        tamano_pagina = 500
        desde = 0

        while True:
            response = supabase.table("ventas") \
                .select(
                    "id_venta,id_cliente,cliente,total,metodo_pago,"
                    "tipo_venta,monto_pagado,estado_pago,fecha,"
                    "fecha_vencimiento,"
                    "ventas_detalle("
                    "id_producto,nombre_producto,tipo_item,cantidad,"
                    "precio_unitario,subtotal,productos(nombre,sku)"
                    "),"
                    "pagos_cxc("
                    "id_pago_cxc,monto,metodo_pago,descripcion,"
                    "referencia,notas,fecha_pago,saldo_antes,"
                    "saldo_despues"
                    ")"
                ) \
                .eq("id_empresa", id_empresa) \
                .gte("fecha", desde_consulta) \
                .lt("fecha", hasta_consulta) \
                .order("fecha", desc=True) \
                .order("id_venta", desc=True) \
                .range(
                    desde,
                    desde + tamano_pagina - 1
                ) \
                .execute()

            lote = response.data or []
            ventas_encontradas.extend(lote)

            if len(lote) < tamano_pagina:
                break

            desde += tamano_pagina

        ventas_filtradas = []

        for venta in ventas_encontradas:
            fecha_local = _fecha_local_finanzas(
                venta.get("fecha")
            )

            if (
                fecha_local is not None
                and inicio <= fecha_local <= fin
            ):
                ventas_filtradas.append(venta)

        return {
            "periodo": {
                "inicio": inicio.isoformat(),
                "fin": fin.isoformat()
            },
            "ventas": ventas_filtradas
        }

    except Exception as e:
        print(
            f"Error al consultar datos de análisis de ingresos: {e}"
        )
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
    
def obtener_comprobantes_pago(
    id_empresa,
    fecha_inicio=None,
    fecha_fin=None
):
    try:
        hoy = datetime.now(_ZONA_HORARIA_NEGOCIO).date()
        inicio = fecha_inicio or date(hoy.year, hoy.month, 1)
        fin = fecha_fin or hoy

        if inicio > fin:
            return {
                "error": "La fecha inicial no puede ser posterior a la fecha final"
            }

        # Margen adicional para movimientos guardados en UTC.
        desde_consulta = (
            inicio - timedelta(days=1)
        ).isoformat()

        hasta_consulta = (
            fin + timedelta(days=2)
        ).isoformat()

        tamano_pagina = 500

        def consultar_paginas(
            tabla,
            seleccion,
            campo_fecha,
            campo_id
        ):
            registros = []
            desde = 0

            while True:
                respuesta = supabase.table(tabla) \
                    .select(seleccion) \
                    .eq("id_empresa", id_empresa) \
                    .gte(campo_fecha, desde_consulta) \
                    .lt(campo_fecha, hasta_consulta) \
                    .order(campo_fecha, desc=True) \
                    .order(campo_id, desc=True) \
                    .range(
                        desde,
                        desde + tamano_pagina - 1
                    ) \
                    .execute()

                lote = respuesta.data or []
                registros.extend(lote)

                if len(lote) < tamano_pagina:
                    break

                desde += tamano_pagina

            return registros

        # Ventas del periodo: solamente las de contado
        # podrán generar comprobantes directos de venta.
        ventas = consultar_paginas(
            tabla="ventas",
            seleccion=(
                "id_venta,id_empresa,id_cliente,cliente,total,"
                "metodo_pago,tipo_venta,monto_pagado,"
                "estado_pago,fecha,fecha_vencimiento,"
                "ventas_detalle("
                "id_producto,nombre_producto,tipo_item,"
                "cantidad,precio_unitario,subtotal,"
                "productos(nombre,sku)"
                ")"
            ),
            campo_fecha="fecha",
            campo_id="id_venta"
        )

        # Los anticipos y abonos se consultan por fecha de pago,
        # aunque la venta original pertenezca a otro periodo.
        pagos_cxc = consultar_paginas(
            tabla="pagos_cxc",
            seleccion=(
                "id_pago_cxc,id_empresa,id_venta,monto,"
                "metodo_pago,descripcion,referencia,notas,"
                "fecha_pago,saldo_antes,saldo_despues,"
                "ventas("
                "id_venta,id_cliente,cliente,total,fecha,"
                "fecha_vencimiento,"
                "ventas_detalle("
                "id_producto,nombre_producto,tipo_item,"
                "cantidad,precio_unitario,subtotal,"
                "productos(nombre,sku)"
                ")"
                ")"
            ),
            campo_fecha="fecha_pago",
            campo_id="id_pago_cxc"
        )

        ventas_publico_general = []
        ventas_clientes = []

        for venta in ventas:
            fecha_local = _fecha_local_finanzas(
                venta.get("fecha")
            )

            if (
                fecha_local is None
                or fecha_local < inicio
                or fecha_local > fin
            ):
                continue

            tipo_venta = str(
                venta.get("tipo_venta") or ""
            ).strip().lower()

            # Las ventas a crédito no generan un comprobante
            # directo. Sus pagos aparecen solamente en CxC.
            if tipo_venta != "contado":
                continue

            if venta.get("id_cliente") is None:
                ventas_publico_general.append(venta)
            else:
                ventas_clientes.append(venta)

        abonos_cxc = []

        for pago in pagos_cxc:
            fecha_local = _fecha_local_finanzas(
                pago.get("fecha_pago")
            )

            if (
                fecha_local is not None
                and inicio <= fecha_local <= fin
            ):
                abonos_cxc.append(pago)

        importe_publico = round(sum(
            float(venta.get("total") or 0)
            for venta in ventas_publico_general
        ), 2)

        importe_clientes = round(sum(
            float(venta.get("total") or 0)
            for venta in ventas_clientes
        ), 2)

        importe_cxc = round(sum(
            float(pago.get("monto") or 0)
            for pago in abonos_cxc
        ), 2)

        return {
            "periodo": {
                "inicio": inicio.isoformat(),
                "fin": fin.isoformat()
            },
            "resumen": {
                "comprobantes_publico_general": len(
                    ventas_publico_general
                ),
                "comprobantes_clientes": len(
                    ventas_clientes
                ),
                "comprobantes_cxc": len(abonos_cxc),
                "total_comprobantes": (
                    len(ventas_publico_general)
                    + len(ventas_clientes)
                    + len(abonos_cxc)
                ),
                "importe_publico_general": importe_publico,
                "importe_clientes": importe_clientes,
                "importe_cxc": importe_cxc,
                "importe_total": round(
                    importe_publico
                    + importe_clientes
                    + importe_cxc,
                    2
                )
            },
            "ventas_publico_general": ventas_publico_general,
            "ventas_clientes": ventas_clientes,
            "abonos_cxc": abonos_cxc,
            "fecha_corte": hoy.isoformat()
        }

    except Exception as e:
        print(
            f"Error al consultar comprobantes de pago: {e}"
        )
        return None