import re
from datetime import date, datetime
from decimal import Decimal
import ia_motor
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, field_validator, model_validator
import database
from typing import Literal, Optional

app = FastAPI(title="BizPilot API")

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def leer_raiz():
    return FileResponse("templates/index.html")

@app.get("/dashboard")
def ver_dashboard():
    return FileResponse("templates/dashboard.html")

class LoginData(BaseModel):
    usuario: str
    password: str

@app.post("/api/login")
def procesar_login(datos: LoginData):
    resultado = database.verificar_login(datos.usuario, datos.password)
    return resultado


@app.get("/api/empresas/{id_empresa}/nombre")
def consultar_nombre_empresa(id_empresa: int):
    return database.obtener_nombre_empresa(id_empresa)

# ============================================================
# NUEVO: ENDPOINT DEL MOTOR LOCAL BIZPILOT IA
# ============================================================

class PreguntaBizPilotIASchema(BaseModel):
    """
    Define los datos que debe enviar el navegador.
    """

    id_empresa: int = Field(gt=0)
    id_usuario: int = Field(gt=0)
    mensaje: str = Field(
        min_length=1,
        max_length=500
    )

    @field_validator(
        "mensaje",
        mode="before"
    )
    @classmethod
    def limpiar_mensaje_bizpilot_ia(
        cls,
        valor
    ):
        """
        Elimina espacios sobrantes antes de validar.
        """

        return str(valor or "").strip()


@app.post("/api/ia/ayuda")
@app.post("/api/ia/ayuda")
def consultar_ayuda_bizpilot_ia(
    pregunta: PreguntaBizPilotIASchema
):
    """
    Recibe una pregunta, valida al usuario y genera
    una respuesta local o una consulta de datos.
    """

    usuario_valido = database.usuario_pertenece_empresa(
        pregunta.id_usuario,
        pregunta.id_empresa
    )

    if not usuario_valido:
        return {
            "exito": False,
            "mensaje": "La sesion no es valida"
        }

    respuesta = ia_motor.responder_pregunta(
        pregunta.mensaje
    )

    tema = respuesta.get("tema")

    # CONSULTA REAL: STOCK BAJO
    if tema == "stock_bajo":
        resultado_stock = (
            database.obtener_productos_stock_bajo(
                pregunta.id_empresa
            )
        )

        if not resultado_stock.get("exito"):
            return {
                "exito": False,
                "mensaje": resultado_stock.get(
                    "mensaje",
                    "No se pudo consultar el inventario"
                )
            }

        productos = resultado_stock.get("data") or []

        total_productos = len(productos)

        total_agotados = sum(
            1
            for producto in productos
            if producto.get("estado") == "Agotado"
        )

        productos_mostrados = productos[:20]

        if total_productos == 0:
            respuesta["respuesta"] = (
                "No encontre productos con stock bajo. "
                "Todas las existencias se encuentran por encima "
                "del stock minimo configurado."
            )
        else:
            respuesta["respuesta"] = (
                f"Encontre {total_productos} producto(s) "
                f"con stock bajo. De ellos, "
                f"{total_agotados} estan agotados."
            )

        respuesta["tipo"] = "consulta_datos"
        respuesta["pasos"] = []

        respuesta["datos"] = {
            "tipo": "stock_bajo",
            "total": total_productos,
            "agotados": total_agotados,
            "mostrados": len(productos_mostrados),
            "productos": productos_mostrados
        }

    # CONSULTA REAL: CUENTAS VENCIDAS
    elif tema == "cxc_vencida":
        resultado_cxc = (
            database.obtener_clientes_cxc_vencida_ia(
                pregunta.id_empresa
            )
        )

        if not resultado_cxc.get("exito"):
            return {
                "exito": False,
                "mensaje": resultado_cxc.get(
                    "mensaje",
                    "No se pudo consultar la cobranza vencida"
                )
            }

        clientes = resultado_cxc.get("data") or []

        total_clientes = int(
            resultado_cxc.get("total_clientes") or 0
        )

        total_cuentas = int(
            resultado_cxc.get("total_cuentas") or 0
        )

        total_vencido = float(
            resultado_cxc.get("total_vencido") or 0
        )

        clientes_mostrados = clientes[:20]

        if total_clientes == 0:
            respuesta["respuesta"] = (
                "No encontre clientes con cuentas vencidas. "
                "Actualmente no tienes cobranza vencida."
            )
        else:
            respuesta["respuesta"] = (
                f"Encontre {total_clientes} cliente(s) con "
                f"{total_cuentas} cuenta(s) vencida(s), por un "
                f"saldo total de ${total_vencido:,.2f}."
            )

        respuesta["tipo"] = "consulta_datos"
        respuesta["pasos"] = []

        respuesta["datos"] = {
            "tipo": "cxc_vencida",
            "total_clientes": total_clientes,
            "total_cuentas": total_cuentas,
            "total_vencido": total_vencido,
            "mostrados": len(clientes_mostrados),
            "clientes": clientes_mostrados
        }

        # CONSULTA REAL: CUENTAS POR PAGAR URGENTES
    elif tema == "cxp_proxima":
        resultado_cxp = (
            database.obtener_cxp_proximas_ia(
                pregunta.id_empresa,
                dias_anticipacion=7
            )
        )

        if not resultado_cxp.get("exito"):
            return {
                "exito": False,
                "mensaje": resultado_cxp.get(
                    "mensaje",
                    "No se pudieron consultar las cuentas por pagar"
                )
            }

        cuentas = resultado_cxp.get("data") or []

        total_cuentas = int(
            resultado_cxp.get("total_cuentas") or 0
        )

        total_saldo = float(
            resultado_cxp.get("total_saldo") or 0
        )

        total_vencidas = int(
            resultado_cxp.get("vencidas") or 0
        )

        total_vencen_hoy = int(
            resultado_cxp.get("vencen_hoy") or 0
        )

        total_proximas = int(
            resultado_cxp.get("proximas") or 0
        )

        total_sin_fecha = int(
            resultado_cxp.get("sin_fecha") or 0
        )

        cuentas_mostradas = cuentas[:20]

        if total_cuentas == 0:
            respuesta["respuesta"] = (
                "No encontre cuentas por pagar vencidas "
                "ni pagos que venzan durante los proximos "
                "siete dias."
            )
        else:
            respuesta["respuesta"] = (
                f"Encontre {total_cuentas} cuenta(s) urgente(s), "
                f"con un saldo total de ${total_saldo:,.2f}. "
                f"{total_vencidas} estan vencidas, "
                f"{total_vencen_hoy} vencen hoy y "
                f"{total_proximas} vencen proximamente."
            )

        if total_sin_fecha > 0:
            respuesta["respuesta"] += (
                f" Ademas, {total_sin_fecha} compra(s) "
                "a credito no pudieron evaluarse porque "
                "no tienen una fecha registrada."
            )

        respuesta["tipo"] = "consulta_datos"
        respuesta["pasos"] = []

        respuesta["datos"] = {
            "tipo": "cxp_proxima",
            "dias_anticipacion": 7,
            "total_cuentas": total_cuentas,
            "total_saldo": total_saldo,
            "vencidas": total_vencidas,
            "vencen_hoy": total_vencen_hoy,
            "proximas": total_proximas,
            "sin_fecha": total_sin_fecha,
            "mostrados": len(cuentas_mostradas),
            "cuentas": cuentas_mostradas
        }

    return {
        "exito": True,
        "mensaje": "Respuesta generada",
        "data": respuesta
    }
class ProductoSchema(BaseModel):
    id_empresa: int
    sku: str
    nombre: str
    categoria: str
    precio_compra: float
    precio_venta: float
    stock: int
    stock_minimo: int

class ProductoAltaRapidaSchema(BaseModel):
    id_empresa: int = Field(gt=0)
    nombre: str = Field(min_length=2, max_length=160)
    precio_venta: float = Field(gt=0)
    precio_compra: float = Field(default=0, ge=0)
    id_proveedor: Optional[int] = Field(default=None, gt=0)

    @field_validator("nombre", mode="before")
    @classmethod
    def limpiar_nombre_producto_rapido(cls, valor):
        if not isinstance(valor, str):
            raise ValueError("El nombre del producto debe ser texto")
        return valor.strip()

@app.post("/api/productos/alta-rapida")
def guardar_producto_rapido(producto: ProductoAltaRapidaSchema):
    return database.crear_producto_rapido(producto.model_dump())

@app.get("/api/productos/{id_empresa}")
def listar_productos(id_empresa: int):
    datos = database.obtener_productos_empresa(id_empresa)
    return {"status": "success", "data": datos}

@app.post("/api/productos")
def guardar_producto(producto: ProductoSchema):
    resultado = database.crear_producto(producto.model_dump())
    return resultado

class ItemCarrito(BaseModel):
    tipo_item: Literal["Inventario", "Rapida"] = "Inventario"
    id_producto: Optional[int] = Field(default=None, gt=0)
    nombre: Optional[str] = Field(default=None, max_length=160)
    cantidad: int = Field(gt=0)
    precio_venta: float = Field(ge=0)
    costo_unitario: float = Field(default=0, ge=0)
    id_proveedor: Optional[int] = Field(default=None, gt=0)
    lugar_compra: Optional[str] = Field(default=None, max_length=160)
    subtotal: float = Field(ge=0)

    @field_validator("nombre", "lugar_compra", mode="before")
    @classmethod
    def limpiar_campos_item(cls, valor):
        if valor is None or str(valor).strip() == "":
            return None
        return str(valor).strip()

    @model_validator(mode="after")
    def validar_tipo_item(self):
        if self.tipo_item == "Inventario" and self.id_producto is None:
            raise ValueError("Un producto de inventario debe incluir id_producto")
        if self.tipo_item == "Rapida":
            if self.id_producto is not None:
                raise ValueError("Una venta rápida no debe descontar un producto de inventario")
            if not self.nombre:
                raise ValueError("Escribe el nombre del producto de venta rápida")
            if self.precio_venta <= 0:
                raise ValueError("El precio de una venta rápida debe ser mayor a cero")
        return self

class VentaSchema(BaseModel):
    id_empresa: int = Field(gt=0)
    total: float = Field(gt=0)
    id_cliente: Optional[int] = None
    cliente: Optional[str] = None
    tipo_venta: Literal["Contado", "Credito"] = "Contado"
    monto_inicial: float = Field(default=0, ge=0)
    metodo_pago: str = "Efectivo"
    carrito: list[ItemCarrito]

    @model_validator(mode="after")
    def validar_venta_credito(self):
        if not self.carrito:
            raise ValueError("El carrito está vacío")
        if self.tipo_venta == "Credito":
            if self.id_cliente is None:
                raise ValueError("Para vender a crédito debes seleccionar un cliente")
            if self.monto_inicial >= self.total:
                raise ValueError("Si se pagará el total, registra la venta como Contado")
        return self

@app.post("/api/ventas")
def procesar_venta(venta: VentaSchema):
    items_dict = [item.model_dump() for item in venta.carrito]
    resultado = database.registrar_venta(
        id_empresa=venta.id_empresa,
        carrito=items_dict,
        total=venta.total,
        id_cliente=venta.id_cliente,
        cliente=venta.cliente,
        tipo_venta=venta.tipo_venta,
        monto_inicial=venta.monto_inicial,
        metodo_pago=venta.metodo_pago
    )
    return resultado

@app.get("/api/ventas/{id_empresa}")
def listar_ventas(id_empresa: int):
    """Devuelve el historial de ventas al frontend"""
    datos = database.obtener_historial_ventas(id_empresa)
    return {"status": "success", "data": datos}

class ClienteBaseSchema(BaseModel):
    nombre: str = Field(min_length=2, max_length=120)
    telefono: str = Field(min_length=7, max_length=20)
    email: Optional[str] = Field(default=None, max_length=254)
    rfc: Optional[str] = Field(default=None, min_length=12, max_length=13)
    tipo_cliente: Literal["Minorista", "Mayorista", "Empresa"] = "Minorista"
    limite_credito: float = Field(default=0, ge=0)
    dias_credito: int = Field(default=0, ge=0, le=365)
    activo: bool = True

    @field_validator("nombre", "telefono", mode="before")
    @classmethod
    def limpiar_texto_requerido(cls, valor):
        if not isinstance(valor, str):
            raise ValueError("Debe ser texto")
        return valor.strip()

    @field_validator("telefono")
    @classmethod
    def validar_telefono(cls, valor):
        if not re.fullmatch(r"[0-9+()\-\s]{7,20}", valor):
            raise ValueError("El teléfono contiene caracteres no válidos")
        return valor

    @field_validator("email", mode="before")
    @classmethod
    def validar_email(cls, valor):
        if valor is None or str(valor).strip() == "":
            return None
        correo = str(valor).strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", correo):
            raise ValueError("El correo electrónico no es válido")
        return correo

    @field_validator("rfc", mode="before")
    @classmethod
    def validar_rfc(cls, valor):
        if valor is None or str(valor).strip() == "":
            return None
        rfc = str(valor).strip().upper()
        if not re.fullmatch(r"[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}", rfc):
            raise ValueError("El RFC no tiene un formato válido")
        return rfc

    @model_validator(mode="after")
    def validar_configuracion_credito(self):
        if (self.limite_credito > 0) != (self.dias_credito > 0):
            raise ValueError("El límite y los días de crédito deben ser ambos mayores a cero o ambos cero")
        return self

class ClienteSchema(ClienteBaseSchema):
    id_empresa: int = Field(gt=0)

class ClienteAltaRapidaSchema(BaseModel):
    id_empresa: int = Field(gt=0)
    nombre: str = Field(min_length=2, max_length=120)

    @field_validator("nombre", mode="before")
    @classmethod
    def limpiar_nombre_cliente_rapido(cls, valor):
        if not isinstance(valor, str):
            raise ValueError("El nombre del cliente debe ser texto")
        return valor.strip()

class ClienteEstadoSchema(BaseModel):
    id_empresa: int = Field(gt=0)
    activo: bool

@app.post("/api/clientes/alta-rapida")
def guardar_cliente_rapido(cliente: ClienteAltaRapidaSchema):
    return database.crear_cliente_rapido(
        id_empresa=cliente.id_empresa,
        nombre=cliente.nombre
    )

@app.get("/api/clientes/{id_empresa}")
def listar_clientes(id_empresa: int):
    datos = database.obtener_clientes(id_empresa)
    if datos is None:
        return {
            "status": "error",
            "mensaje": "No se pudo consultar el directorio de clientes",
            "data": []
        }
    return {"status": "success", "data": datos}

@app.get("/api/clientes/{id_empresa}/compras")
def listar_compras_de_clientes(id_empresa: int):
    datos = database.obtener_compras_clientes(id_empresa)
    if datos is None:
        return {
            "status": "error",
            "mensaje": "No se pudo consultar el historial de compras de clientes",
            "data": []
        }
    return {"status": "success", "data": datos}

@app.post("/api/clientes")
def guardar_cliente(cliente: ClienteSchema):
    return database.crear_cliente(cliente.model_dump())

@app.put("/api/clientes/{id_cliente}")
def editar_cliente(id_cliente: int, cliente: ClienteSchema):
    datos = cliente.model_dump()
    id_empresa = datos.pop("id_empresa")
    return database.actualizar_cliente(id_cliente, id_empresa, datos)

@app.patch("/api/clientes/{id_cliente}/estado")
def actualizar_estado_cliente(id_cliente: int, estado: ClienteEstadoSchema):
    return database.cambiar_estado_cliente(id_cliente, estado.id_empresa, estado.activo)


class ProspectoSchema(BaseModel):
    id_empresa: int = Field(gt=0)
    tipo_prospecto: Literal["Persona", "Empresa"] = "Persona"
    nombre: str = Field(min_length=2, max_length=160)
    contacto_principal: Optional[str] = Field(default=None, max_length=160)
    telefono: Optional[str] = Field(default=None, max_length=30)
    email: Optional[str] = Field(default=None, max_length=254)
    informacion_adicional: Optional[str] = Field(default=None, max_length=2000)
    interes_en: str = Field(min_length=2, max_length=1000)
    origen: Optional[str] = Field(default=None, max_length=60)
    comentarios: Optional[str] = Field(default=None, max_length=3000)
    proximo_seguimiento: Optional[datetime] = None
    estatus: Literal[
        "Nuevo",
        "Contactado",
        "Calificado",
        "Descartado"
    ] = "Nuevo"
    motivo_descarte: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("nombre", "interes_en", mode="before")
    @classmethod
    def limpiar_campos_requeridos(cls, valor):
        if not isinstance(valor, str):
            raise ValueError("El campo debe ser texto")
        return valor.strip()

    @field_validator(
        "contacto_principal",
        "telefono",
        "email",
        "informacion_adicional",
        "origen",
        "comentarios",
        "motivo_descarte",
        mode="before"
    )
    @classmethod
    def limpiar_campos_opcionales(cls, valor):
        if valor is None or str(valor).strip() == "":
            return None
        return str(valor).strip()

    @model_validator(mode="after")
    def validar_reglas_prospecto(self):
        if self.telefono and not re.fullmatch(
            r"[0-9+()\-\s.]{7,30}",
            self.telefono
        ):
            raise ValueError("El teléfono contiene caracteres no válidos")

        if self.email:
            self.email = self.email.lower()
            if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", self.email):
                raise ValueError("El correo electrónico no es válido")

        if self.tipo_prospecto == "Persona":
            self.contacto_principal = None

        if self.estatus in {"Nuevo", "Contactado", "Calificado"}:
            if self.proximo_seguimiento is None:
                raise ValueError(
                    "Los prospectos activos necesitan un próximo seguimiento"
                )
            self.motivo_descarte = None

        if self.estatus == "Descartado":
            if not self.motivo_descarte:
                raise ValueError(
                    "Escribe el motivo por el que se descartó el prospecto"
                )
            self.proximo_seguimiento = None

        return self


def datos_prospecto_para_database(prospecto: ProspectoSchema):
    datos = prospecto.model_dump()
    seguimiento = prospecto.proximo_seguimiento
    datos["proximo_seguimiento"] = (
        seguimiento.isoformat() if seguimiento else None
    )
    return datos


@app.get("/api/prospectos/{id_empresa}")
def listar_prospectos(id_empresa: int):
    datos = database.obtener_prospectos(id_empresa)
    if datos is None:
        return {
            "status": "error",
            "mensaje": "No se pudieron consultar los prospectos",
            "data": []
        }
    return {"status": "success", "data": datos}


@app.post("/api/prospectos")
def guardar_prospecto(prospecto: ProspectoSchema):
    return database.crear_prospecto(
        datos_prospecto_para_database(prospecto)
    )


@app.put("/api/prospectos/{id_prospecto}")
def editar_prospecto(
    id_prospecto: int,
    prospecto: ProspectoSchema
):
    datos = datos_prospecto_para_database(prospecto)
    id_empresa = datos.pop("id_empresa")
    return database.actualizar_prospecto(
        id_prospecto=id_prospecto,
        id_empresa=id_empresa,
        datos_prospecto=datos
    )


class SeguimientoProspectoSchema(BaseModel):
    id_empresa: int = Field(gt=0)
    id_usuario: int = Field(gt=0)
    tipo: Literal[
        "Llamada",
        "WhatsApp",
        "Correo",
        "Reunion",
        "Visita",
        "Otro"
    ]
    fecha_seguimiento: datetime
    resultado: Literal[
        "Sin respuesta",
        "Contactado",
        "Interesado",
        "Reagendado",
        "No interesado",
        "Avanzo"
    ]
    comentarios: str = Field(min_length=2, max_length=3000)
    proxima_accion: Optional[str] = Field(
        default=None,
        max_length=1000
    )
    proximo_seguimiento: Optional[datetime] = None
    estatus_nuevo: Literal[
        "Nuevo",
        "Contactado",
        "Calificado",
        "Descartado"
    ]
    motivo_descarte: Optional[str] = Field(
        default=None,
        max_length=1000
    )

    @field_validator("comentarios", mode="before")
    @classmethod
    def limpiar_comentarios_seguimiento(cls, valor):
        if not isinstance(valor, str):
            raise ValueError("Los comentarios deben ser texto")
        return valor.strip()

    @field_validator(
        "proxima_accion",
        "motivo_descarte",
        mode="before"
    )
    @classmethod
    def limpiar_opcionales_seguimiento(cls, valor):
        if valor is None or str(valor).strip() == "":
            return None
        return str(valor).strip()

    @model_validator(mode="after")
    def validar_reglas_seguimiento(self):
        if self.estatus_nuevo == "Descartado":
            if not self.motivo_descarte:
                raise ValueError("Indica el motivo de descarte")
            self.proxima_accion = None
            self.proximo_seguimiento = None
        else:
            if not self.proxima_accion:
                raise ValueError("Indica la proxima accion")
            if self.proximo_seguimiento is None:
                raise ValueError("Indica el proximo seguimiento")
            self.motivo_descarte = None

        return self


def datos_seguimiento_para_database(
    seguimiento: SeguimientoProspectoSchema
):
    datos = seguimiento.model_dump()
    datos["fecha_seguimiento"] = (
        seguimiento.fecha_seguimiento.isoformat()
    )
    datos["proximo_seguimiento"] = (
        seguimiento.proximo_seguimiento.isoformat()
        if seguimiento.proximo_seguimiento
        else None
    )
    return datos


@app.get("/api/prospectos/{id_prospecto}/seguimientos")
def listar_seguimientos_prospecto(
    id_prospecto: int,
    id_empresa: int
):
    return database.obtener_seguimientos_prospecto(
        id_prospecto=id_prospecto,
        id_empresa=id_empresa
    )


@app.post("/api/prospectos/{id_prospecto}/seguimientos")
def guardar_seguimiento_prospecto(
    id_prospecto: int,
    seguimiento: SeguimientoProspectoSchema
):
    return database.registrar_seguimiento_prospecto(
        id_prospecto=id_prospecto,
        datos_seguimiento=datos_seguimiento_para_database(
            seguimiento
        )
    )


EtapaEmbudo = Literal[
    "Interes detectado",
    "Preparando cotizacion",
    "Cotizacion enviada",
    "En revision",
    "Esperando decision"
]


class OportunidadCRMCamposSchema(BaseModel):
    id_empresa: int = Field(gt=0)
    id_usuario: int = Field(gt=0)
    titulo: str = Field(min_length=2, max_length=180)
    etapa: EtapaEmbudo = "Interes detectado"
    valor_estimado: Decimal = Field(default=0, ge=0)
    probabilidad: int = Field(default=10, ge=0, le=100)
    notas: Optional[str] = Field(default=None, max_length=3000)

    @field_validator("titulo", mode="before")
    @classmethod
    def limpiar_titulo_oportunidad(cls, valor):
        if not isinstance(valor, str):
            raise ValueError("El titulo debe ser texto")
        return valor.strip()

    @field_validator("notas", mode="before")
    @classmethod
    def limpiar_notas_oportunidad(cls, valor):
        if valor is None or str(valor).strip() == "":
            return None
        return str(valor).strip()


class OportunidadCRMCrearSchema(OportunidadCRMCamposSchema):
    id_prospecto: int = Field(gt=0)


class PartidaCotizacionCRMSchema(BaseModel):
    concepto: str = Field(min_length=2, max_length=300)
    cantidad: Decimal = Field(gt=0)
    precio_unitario: Decimal = Field(ge=0)

    @field_validator("concepto", mode="before")
    @classmethod
    def limpiar_concepto_cotizacion(cls, valor):
        if not isinstance(valor, str):
            raise ValueError("El concepto debe ser texto")
        return valor.strip()


class CotizacionCRMSchema(BaseModel):
    id_empresa: int = Field(gt=0)
    id_usuario: int = Field(gt=0)
    estado: Literal["Borrador", "Enviada"] = "Borrador"
    vigencia_hasta: date
    descuento_porcentaje: Decimal = Field(default=0, ge=0, le=100)
    impuesto_porcentaje: Decimal = Field(default=16, ge=0, le=100)
    notas: Optional[str] = Field(default=None, max_length=3000)
    partidas: list[PartidaCotizacionCRMSchema] = Field(
        min_length=1,
        max_length=50
    )

    @field_validator("notas", mode="before")
    @classmethod
    def limpiar_notas_cotizacion(cls, valor):
        if valor is None or str(valor).strip() == "":
            return None
        return str(valor).strip()

    @model_validator(mode="after")
    def validar_vigencia_cotizacion(self):
        if self.vigencia_hasta < date.today():
            raise ValueError(
                "La vigencia no puede terminar en una fecha pasada"
            )
        return self


@app.get("/api/crm/embudo/{id_empresa}")
def consultar_embudo_crm(id_empresa: int):
    return database.obtener_embudo_crm(id_empresa)


@app.post("/api/crm/oportunidades")
def guardar_oportunidad_crm(
    oportunidad: OportunidadCRMCrearSchema
):
    return database.crear_oportunidad_crm(
        oportunidad.model_dump(mode="json")
    )


@app.put("/api/crm/oportunidades/{id_oportunidad}")
def editar_oportunidad_crm(
    id_oportunidad: int,
    oportunidad: OportunidadCRMCamposSchema
):
    return database.actualizar_oportunidad_crm(
        id_oportunidad=id_oportunidad,
        datos=oportunidad.model_dump(mode="json")
    )


@app.post(
    "/api/crm/oportunidades/{id_oportunidad}/cotizaciones"
)
def guardar_cotizacion_crm(
    id_oportunidad: int,
    cotizacion: CotizacionCRMSchema
):
    return database.crear_cotizacion_crm(
        id_oportunidad=id_oportunidad,
        datos=cotizacion.model_dump(mode="json")
    )


class CierreNegociacionCRMSchema(BaseModel):
    id_empresa: int = Field(gt=0)
    id_usuario: int = Field(gt=0)
    resultado: Literal["Compro", "No compro"]
    id_cotizacion: Optional[int] = Field(default=None, gt=0)
    id_cliente: Optional[int] = Field(default=None, gt=0)
    monto_final: Decimal = Field(default=0, ge=0)
    motivo_perdida: Optional[str] = Field(default=None, max_length=1000)
    notas: Optional[str] = Field(default=None, max_length=3000)
    fecha_cierre: date

    @field_validator("motivo_perdida", "notas", mode="before")
    @classmethod
    def limpiar_textos_cierre(cls, valor):
        if valor is None or str(valor).strip() == "":
            return None
        return str(valor).strip()

    @model_validator(mode="after")
    def validar_cierre_negociacion(self):
        if self.fecha_cierre > date.today():
            raise ValueError(
                "La fecha de cierre no puede estar en el futuro"
            )

        if self.resultado == "Compro":
            if self.id_cotizacion is None:
                raise ValueError(
                    "Una compra necesita una cotizacion relacionada"
                )
            if self.monto_final <= 0:
                raise ValueError(
                    "El monto final debe ser mayor a cero"
                )
            self.motivo_perdida = None
        else:
            if not self.motivo_perdida:
                raise ValueError(
                    "Indica el motivo por el que no compro"
                )
            self.id_cliente = None
            self.monto_final = Decimal("0")

        return self


@app.post("/api/crm/oportunidades/{id_oportunidad}/cerrar")
def cerrar_oportunidad_crm(
    id_oportunidad: int,
    cierre: CierreNegociacionCRMSchema
):
    return database.cerrar_negociacion_crm(
        id_oportunidad=id_oportunidad,
        datos=cierre.model_dump(mode="json")
    )


@app.get("/api/crm/negociaciones/{id_empresa}")
def listar_negociaciones_cerradas_crm(id_empresa: int):
    return database.obtener_negociaciones_cerradas_crm(id_empresa)


@app.get("/api/crm/dashboard/{id_empresa}")
def consultar_dashboard_comercial(id_empresa: int):
    return database.obtener_dashboard_comercial(id_empresa)

class ProveedorSchema(BaseModel):
    id_empresa: int
    nombre: str
    contacto: str
    telefono: str
    email: str
    permite_credito: bool = False

@app.get("/api/proveedores/{id_empresa}")
def listar_proveedores(id_empresa: int):
    datos = database.obtener_proveedores(id_empresa)
    return {"status": "success", "data": datos}

@app.post("/api/proveedores")
def guardar_proveedor(proveedor: ProveedorSchema):
    resultado = database.crear_proveedor(proveedor.model_dump())
    return resultado

class ItemCompra(BaseModel):
    id_producto: Optional[int] = Field(default=None, gt=0)
    sku: Optional[str] = Field(default="", max_length=80)
    nombre: str = Field(min_length=1, max_length=160)
    categoria: Optional[str] = Field(default="", max_length=100)
    precio_compra: float = Field(ge=0)
    precio_venta: Optional[float] = Field(default=0.0, ge=0)
    cantidad: int = Field(gt=0)
    subtotal: float = Field(ge=0)

class CompraSchema(BaseModel):
    id_empresa: int = Field(gt=0)
    id_proveedor: Optional[int] = Field(default=None, gt=0)
    lugar_compra: Optional[str] = Field(default=None, max_length=160)
    total: float = Field(gt=0)
    tipo_compra: Literal["Contado", "Credito"] = "Contado"
    dias_credito: int = Field(default=0, ge=0, le=365)
    monto_pagado: float = Field(default=0.0, ge=0)
    metodo_pago: str = "Transferencia"
    carrito: list[ItemCompra]

    @field_validator("lugar_compra", mode="before")
    @classmethod
    def limpiar_lugar_compra(cls, valor):
        if valor is None or str(valor).strip() == "":
            return None
        return str(valor).strip()

    @model_validator(mode="after")
    def validar_origen_compra(self):
        if not self.carrito:
            raise ValueError("La orden de compra está vacía")
        if self.id_proveedor is None and not self.lugar_compra:
            raise ValueError("Selecciona un proveedor o escribe dónde se compró")
        if self.tipo_compra == "Credito" and self.dias_credito <= 0:
            raise ValueError("Indica un plazo válido para la compra a crédito")
        if self.monto_pagado > self.total:
            raise ValueError("El abono inicial no puede superar el total de la compra")
        return self

class AbonoSchema(BaseModel):
    id_compra: int
    monto: float
    metodo_pago: str

@app.post("/api/compras")
def procesar_compra(compra: CompraSchema):
    items_dict = [item.model_dump() for item in compra.carrito]
    resultado = database.registrar_compra(
        id_empresa=compra.id_empresa,
        id_proveedor=compra.id_proveedor,
        lugar_compra=compra.lugar_compra,
        carrito=items_dict,
        total=compra.total,
        tipo_compra=compra.tipo_compra,
        dias_credito=compra.dias_credito,
        monto_pagado=compra.monto_pagado,
        metodo_pago=compra.metodo_pago
    )
    return resultado

@app.get("/api/cxp/{id_empresa}")
def listar_cuentas_por_pagar(id_empresa: int):
    datos = database.obtener_cuentas_por_pagar(id_empresa)
    return {"status": "success", "data": datos}

@app.post("/api/cxp/abonar")
def abonar_deuda(abono: AbonoSchema):
    resultado = database.registrar_abono_cxp(abono.id_compra, abono.monto, abono.metodo_pago)
    return resultado

class AbonoCXCSchema(BaseModel):
    id_empresa: int = Field(gt=0)
    id_venta: int = Field(gt=0)
    monto: float = Field(gt=0)
    metodo_pago: Literal["Transferencia", "Efectivo", "Tarjeta", "Deposito"]
    descripcion: Optional[str] = Field(default=None, max_length=200)
    referencia: Optional[str] = Field(default=None, max_length=80)
    notas: Optional[str] = Field(default=None, max_length=200)

    @field_validator("descripcion", "referencia", "notas", mode="before")
    @classmethod
    def limpiar_opcional(cls, valor):
        if valor is None or str(valor).strip() == "":
            return None
        return str(valor).strip()

@app.get("/api/cxc/{id_empresa}")
def listar_cuentas_por_cobrar(id_empresa: int):
    datos = database.obtener_cuentas_por_cobrar(id_empresa)
    if datos is None:
        return {
            "status": "error",
            "mensaje": "No se pudo consultar la cartera",
            "data": []
        }
    return {"status": "success", "data": datos}

@app.post("/api/cxc/abonar")
def abonar_cuenta_por_cobrar(abono: AbonoCXCSchema):
    return database.registrar_abono_cxc(
        id_empresa=abono.id_empresa,
        id_venta=abono.id_venta,
        monto=abono.monto,
        metodo_pago=abono.metodo_pago,
        descripcion=abono.descripcion,
        referencia=abono.referencia,
        notas=abono.notas
    )

class FechaMovimientoCXCSchema(BaseModel):
    id_empresa: int = Field(gt=0)
    tipo_movimiento: Literal["Venta", "Pago"]
    id_movimiento: int = Field(gt=0)
    fecha: datetime

@app.patch("/api/cxc/movimientos/fecha")
def editar_fecha_movimiento_cxc(datos: FechaMovimientoCXCSchema):
    return database.actualizar_fecha_movimiento_cxc(
        id_empresa=datos.id_empresa,
        tipo_movimiento=datos.tipo_movimiento,
        id_movimiento=datos.id_movimiento,
        fecha=datos.fecha
    )


@app.get("/api/finanzas/dashboard/{id_empresa}")
def consultar_dashboard_financiero(id_empresa: int):
    datos = database.obtener_dashboard_financiero(id_empresa)
    if datos is None:
        return {
            "status": "error",
            "mensaje": "No se pudo calcular el dashboard financiero",
            "data": None
        }
    return {"status": "success", "data": datos}

@app.get("/api/finanzas/ingresos/{id_empresa}")
def consultar_analisis_ingresos(
    id_empresa: int,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None
):
    datos = database.obtener_datos_analisis_ingresos(
        id_empresa=id_empresa,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin
    )

    if datos is None:
        return {
            "status": "error",
            "mensaje": "No se pudo consultar el análisis de ingresos",
            "data": None
        }

    if datos.get("error"):
        return {
            "status": "error",
            "mensaje": datos["error"],
            "data": None
        }

    return {
        "status": "success",
        "data": datos
    }

class GastoManualSchema(BaseModel):
    id_empresa: int = Field(gt=0)
    categoria: str = Field(min_length=1, max_length=80)
    tipo_gasto: Literal["Fijo", "Variable"]
    concepto: str = Field(min_length=2, max_length=160)
    monto: float = Field(gt=0)
    fecha_gasto: date
    metodo_pago: Literal["Efectivo", "Transferencia", "Tarjeta", "Deposito", "Otro"]
    referencia: Optional[str] = Field(default=None, max_length=80)
    notas: Optional[str] = Field(default=None, max_length=250)

    @field_validator("categoria", "concepto", "referencia", "notas", mode="before")
    @classmethod
    def limpiar_campos_gasto(cls, valor):
        if valor is None or str(valor).strip() == "":
            return None
        return str(valor).strip()

class AnularGastoSchema(BaseModel):
    id_empresa: int = Field(gt=0)

@app.get("/api/finanzas/comprobantes/{id_empresa}")
def consultar_comprobantes_pago(
    id_empresa: int,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None
):
    datos = database.obtener_comprobantes_pago(
        id_empresa=id_empresa,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin
    )

    if datos is None:
        return {
            "status": "error",
            "mensaje": "No se pudieron consultar los comprobantes",
            "data": None
        }

    if datos.get("error"):
        return {
            "status": "error",
            "mensaje": datos["error"],
            "data": None
        }

    return {
        "status": "success",
        "data": datos
    }

@app.get("/api/gastos/{id_empresa}")
def listar_gastos(id_empresa: int):
    datos = database.obtener_gastos(id_empresa)
    if datos is None:
        return {
            "status": "error",
            "mensaje": "No se pudieron consultar los gastos",
            "data": []
        }
    return {"status": "success", "data": datos}

@app.post("/api/gastos")
def guardar_gasto_manual(gasto: GastoManualSchema):
    datos = gasto.model_dump()
    datos["fecha_gasto"] = gasto.fecha_gasto.isoformat()
    return database.crear_gasto_manual(datos)

@app.patch("/api/gastos/{id_gasto}/anular")
def anular_gasto_manual(id_gasto: int, datos: AnularGastoSchema):
    return database.anular_gasto_manual(
        id_gasto=id_gasto,
        id_empresa=datos.id_empresa
    )


# --- RR. HH.: EMPLEADOS Y ADMINISTRATIVO ---
class EmpleadoRRHHSchema(BaseModel):
    id_empresa: int = Field(gt=0)
    id_usuario: int = Field(gt=0)
    nombre_completo: str = Field(min_length=3, max_length=180)
    fecha_nacimiento: date
    fecha_ingreso: date
    salario: float = Field(ge=0)
    puesto: str = Field(min_length=2, max_length=120)
    telefono: str = Field(min_length=7, max_length=20)
    rfc: str = Field(min_length=12, max_length=13)
    numero_seguridad_social: str = Field(min_length=11, max_length=11)
    telefono_emergencia: str = Field(min_length=7, max_length=20)

    @field_validator(
        "nombre_completo",
        "puesto",
        "telefono",
        "rfc",
        "numero_seguridad_social",
        "telefono_emergencia",
        mode="before"
    )
    @classmethod
    def limpiar_campos_empleado(cls, valor):
        if valor is None:
            return valor
        return str(valor).strip()

    @field_validator("rfc")
    @classmethod
    def validar_rfc(cls, valor):
        valor = valor.upper()
        if not re.fullmatch(
            r"[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}",
            valor
        ):
            raise ValueError("El RFC no tiene un formato valido")
        return valor

    @field_validator("numero_seguridad_social")
    @classmethod
    def validar_nss(cls, valor):
        if not re.fullmatch(r"[0-9]{11}", valor):
            raise ValueError(
                "El numero de seguridad social debe tener 11 digitos"
            )
        return valor

    @field_validator("telefono", "telefono_emergencia")
    @classmethod
    def validar_telefono_empleado(cls, valor):
        digitos = re.sub(r"[^0-9]", "", valor)
        if not 7 <= len(digitos) <= 15:
            raise ValueError("El telefono debe contener de 7 a 15 digitos")
        return valor

    @model_validator(mode="after")
    def validar_fechas_empleado(self):
        if self.fecha_nacimiento > date.today():
            raise ValueError("La fecha de nacimiento no puede ser futura")
        if self.fecha_ingreso < self.fecha_nacimiento:
            raise ValueError("La fecha de ingreso no es valida")
        return self


class MovimientoAdministrativoRRHHSchema(BaseModel):
    id_empresa: int = Field(gt=0)
    id_empleado: int = Field(gt=0)
    id_usuario: int = Field(gt=0)
    tipo_movimiento: Literal[
        "Carta compromiso",
        "Suspension",
        "Baja",
        "Alta",
        "Permiso"
    ]
    fecha_movimiento: date
    fecha_fin: Optional[date] = None
    detalle: str = Field(min_length=3, max_length=1000)

    @field_validator("detalle", mode="before")
    @classmethod
    def limpiar_detalle_movimiento(cls, valor):
        return str(valor or "").strip()

    @model_validator(mode="after")
    def validar_fechas_movimiento(self):
        if self.tipo_movimiento not in {"Suspension", "Permiso"}:
            self.fecha_fin = None
        if (
            self.fecha_fin is not None
            and self.fecha_fin < self.fecha_movimiento
        ):
            raise ValueError(
                "La fecha final no puede ser anterior a la inicial"
            )
        return self


@app.get("/api/rrhh/empleados/{id_empresa}")
def listar_empleados_rrhh(id_empresa: int):
    return database.obtener_empleados_rrhh(id_empresa)


@app.post("/api/rrhh/empleados")
def guardar_empleado_rrhh(empleado: EmpleadoRRHHSchema):
    datos = empleado.model_dump()
    datos["fecha_nacimiento"] = empleado.fecha_nacimiento.isoformat()
    datos["fecha_ingreso"] = empleado.fecha_ingreso.isoformat()
    return database.crear_empleado_rrhh(datos)


@app.put("/api/rrhh/empleados/{id_empleado}")
def editar_empleado_rrhh(
    id_empleado: int,
    empleado: EmpleadoRRHHSchema
):
    datos = empleado.model_dump()
    datos["fecha_nacimiento"] = empleado.fecha_nacimiento.isoformat()
    datos["fecha_ingreso"] = empleado.fecha_ingreso.isoformat()
    return database.actualizar_empleado_rrhh(id_empleado, datos)


@app.get("/api/rrhh/administrativo/{id_empresa}")
def listar_movimientos_administrativos_rrhh(id_empresa: int):
    return database.obtener_movimientos_administrativos_rrhh(id_empresa)


@app.post("/api/rrhh/administrativo")
def guardar_movimiento_administrativo_rrhh(
    movimiento: MovimientoAdministrativoRRHHSchema
):
    datos = movimiento.model_dump()
    datos["fecha_movimiento"] = (
        movimiento.fecha_movimiento.isoformat()
    )
    datos["fecha_fin"] = (
        movimiento.fecha_fin.isoformat()
        if movimiento.fecha_fin
        else None
    )
    return database.crear_movimiento_administrativo_rrhh(datos)