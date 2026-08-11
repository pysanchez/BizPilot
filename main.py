import re
from datetime import date

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

class ProductoSchema(BaseModel):
    id_empresa: int
    sku: str
    nombre: str
    categoria: str
    precio_compra: float
    precio_venta: float
    stock: int
    stock_minimo: int

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

class ClienteEstadoSchema(BaseModel):
    id_empresa: int = Field(gt=0)
    activo: bool

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
    referencia: Optional[str] = Field(default=None, max_length=80)
    notas: Optional[str] = Field(default=None, max_length=200)

    @field_validator("referencia", "notas", mode="before")
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
        referencia=abono.referencia,
        notas=abono.notas
    )

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