# MOTOR LOCAL BIZPILOT IA

import re
import unicodedata
from copy import deepcopy


# Preguntas sugeridas cuando no se encuentra una respuesta.
SUGERENCIAS_GENERALES = [
    "Como registro una venta",
    "Como registro un gasto",
    "Donde veo cuentas por cobrar",
    "Como hago una cotizacion",
    "Como doy de baja a un empleado"
]

# EQUIVALENCIAS PARA CONJUGACIONES COMUNES
EQUIVALENCIAS_PALABRAS = {
    "registro": "registrar",
    "registra": "registrar",
    "registras": "registrar",
    "registre": "registrar",
    "registrando": "registrar",

    "hago": "hacer",
    "haces": "hacer",
    "hace": "hacer",
    "hacemos": "hacer",
    "realizo": "hacer",

    "veo": "ver",
    "ves": "ver",
    "vemos": "ver",

    "doy": "dar",
    "das": "dar",
    "dimos": "dar",

    "creo": "crear",
    "creas": "crear",
    "creando": "crear",

    "agrego": "agregar",
    "agrega": "agregar",
    "agregando": "agregar"
}


# Base inicial de conocimiento.
# Cada elemento representa una intencion que BizPilot IA reconoce.
BASE_CONOCIMIENTO = [
    {
        "id": "punto_venta",
        "frases": [
            "registrar una venta",
            "hacer una venta",
            "cobrar una venta",
            "punto de venta",
            "venta rapida",
            "vender producto",
            "procesar venta"
        ],
        "respuesta": (
            "El Punto de venta se encuentra en Operacion. "
            "Desde ahi puedes agregar productos, seleccionar un cliente "
            "y registrar el metodo de pago."
        ),
        "pasos": [
            "Abre el area Operacion.",
            "Selecciona Punto de venta.",
            "Agrega los productos o utiliza Venta rapida.",
            "Selecciona el cliente y procesa la venta."
        ],
        "accion": {
            "texto": "Abrir Punto de venta",
            "area": "operacion",
            "modulo": "erp-ventas"
        }
    },
    
        # NUEVO: HISTORIAL DE VENTAS
    {
        "id": "historial_ventas",
        "frases": [
            "historial de ventas",
            "ventas anteriores",
            "consultar ventas",
            "ver ventas registradas",
            "ventas realizadas",
            "revisar una venta",
            "buscar una venta",
            "donde estan mis ventas"
        ],
        "respuesta": (
            "El Historial de ventas se encuentra en Operacion. "
            "Ahi puedes consultar las ventas registradas, su fecha, "
            "cliente, total y estado."
        ),
        "pasos": [
            "Abre el area Operacion.",
            "Selecciona Historial de ventas.",
            "Revisa la fecha, el cliente, el total y el estado de cada venta."
        ],
        "accion": {
            "texto": "Abrir Historial de ventas",
            "area": "operacion",
            "modulo": "erp-historial-ventas"
        }
    },

    # NUEVO: REGISTRO DE COMPRAS
    {
        "id": "compras",
        "frases": [
            "registrar una compra",
            "hacer una compra",
            "nueva compra",
            "entrada de mercancia",
            "recibir mercancia",
            "comprar inventario",
            "agregar stock",
            "aumentar existencias"
        ],
        "respuesta": (
            "Las compras se registran en Operacion, dentro de "
            "Registrar compra. Desde ahi puedes recibir productos "
            "y aumentar sus existencias."
        ),
        "pasos": [
            "Abre el area Operacion.",
            "Selecciona Registrar compra.",
            "Selecciona un proveedor o indica el lugar de compra.",
            "Agrega los productos y sus cantidades.",
            "Confirma la entrada al almacen."
        ],
        "accion": {
            "texto": "Abrir Registrar compra",
            "area": "operacion",
            "modulo": "erp-nueva-compra"
        }
    },

    #PROVEEDORES
    {
        "id": "proveedores",
        "frases": [
            "registrar proveedor",
            "agregar proveedor",
            "nuevo proveedor",
            "lista de proveedores",
            "consultar proveedores",
            "ver proveedores",
            "directorio de proveedores",
            "proveedor con credito"
        ],
        "respuesta": (
            "El directorio de proveedores se encuentra en Operacion. "
            "Ahi puedes registrar sus datos de contacto y consultar "
            "si trabajan a contado o credito."
        ),
        "pasos": [
            "Abre el area Operacion.",
            "Selecciona Proveedores.",
            "Pulsa el boton para registrar un proveedor.",
            "Captura el nombre, contacto, telefono, correo y condicion de pago."
        ],
        "accion": {
            "texto": "Abrir Proveedores",
            "area": "operacion",
            "modulo": "erp-proveedores"
        }
    },

    #CLIENTES
    {
        "id": "clientes",
        "frases": [
            "registrar cliente",
            "agregar cliente",
            "nuevo cliente",
            "lista de clientes",
            "consultar clientes",
            "ver clientes",
            "directorio de clientes",
            "editar cliente",
            "credito de cliente"
        ],
        "respuesta": (
            "El directorio de clientes se encuentra en Operacion. "
            "Ahi puedes registrar clientes, editar sus datos "
            "y configurar sus condiciones de credito."
        ),
        "pasos": [
            "Abre el area Operacion.",
            "Selecciona Clientes.",
            "Pulsa el boton para registrar un cliente.",
            "Captura sus datos y configura el credito si corresponde."
        ],
        "accion": {
            "texto": "Abrir Clientes",
            "area": "operacion",
            "modulo": "erp-clientes"
        }
    },
    
    {
        "id": "gastos",
        "frases": [
            "registrar un gasto",
            "agregar un gasto",
            "nuevo gasto",
            "capturar gasto",
            "donde estan los gastos",
            "pagar servicio",
            "registrar egreso"
        ],
        "respuesta": (
            "Los gastos se encuentran en Finanzas. "
            "Puedes registrar servicios, pagos y otros egresos manuales."
        ),
        "pasos": [
            "Abre el area Finanzas.",
            "Selecciona Gastos.",
            "Pulsa el boton para registrar un gasto.",
            "Captura concepto, categoria, monto y fecha."
        ],
        "accion": {
            "texto": "Abrir Gastos",
            "area": "finanzas",
            "modulo": "fin-gastos"
        }
    },
    
        # `DASHBO`ARD FINANCIERO
    {
        "id": "dashboard_financiero",
        "frases": [
            "dashboard financiero",
            "resumen financiero",
            "resumen de finanzas",
            "ver ganancias y gastos",
            "cuanto gane este mes",
            "utilidad neta",
            "resultado financiero",
            "grafica de ingresos y gastos"
        ],
        "respuesta": (
            "El Dashboard financiero se encuentra en Finanzas. "
            "Ahi puedes consultar los ingresos, gastos y utilidad neta "
            "del mes actual, junto con graficas diarias y mensuales."
        ),
        "pasos": [
            "Abre el area Finanzas.",
            "Selecciona Dashboard financiero.",
            "Revisa los ingresos, gastos y utilidad neta.",
            "Consulta las graficas diarias y mensuales."
        ],
        "accion": {
            "texto": "Abrir Dashboard financiero",
            "area": "finanzas",
            "modulo": "fin-resumen"
        }
    },

    # ANALISIS DE INGRESOS
    {
        "id": "analisis_ingresos",
        "frases": [
            "analisis de ingresos",
            "consultar ingresos",
            "ver ingresos",
            "ventas por cliente",
            "ventas por producto",
            "ingresos por periodo",
            "cuanto he vendido",
            "total vendido"
        ],
        "respuesta": (
            "El Analisis de ingresos se encuentra en Finanzas. "
            "Ahi puedes revisar ventas y cobros, filtrar por periodo "
            "y consultar resultados por cliente o producto."
        ),
        "pasos": [
            "Abre el area Finanzas.",
            "Selecciona Analisis de ingresos.",
            "Indica el periodo que quieres consultar.",
            "Revisa las ventas, clientes, productos y cobros registrados."
        ],
        "accion": {
            "texto": "Abrir Analisis de ingresos",
            "area": "finanzas",
            "modulo": "fin-ingresos"
        }
    },

    # CUENTAS POR PAGAR
    {
        "id": "cuentas_por_pagar",
        "frases": [
            "cuentas por pagar",
            "donde veo cuentas por pagar",
            "deudas con proveedores",
            "proveedores pendientes de pago",
            "registrar abono a proveedor",
            "pagar una compra a credito",
            "saldo por pagar",
            "cxp"
        ],
        "respuesta": (
            "Cuentas por pagar se encuentra en Finanzas. "
            "Ahi puedes consultar compras a credito, saldos pendientes "
            "y registrar abonos a proveedores."
        ),
        "pasos": [
            "Abre el area Finanzas.",
            "Selecciona Cuentas por pagar.",
            "Busca la compra o el proveedor.",
            "Abre el detalle para consultar la deuda o registrar un abono."
        ],
        "accion": {
            "texto": "Abrir Cuentas por pagar",
            "area": "finanzas",
            "modulo": "fin-cxp"
        }
    },

    # COMPROBANTES
    {
        "id": "comprobantes",
        "frases": [
            "comprobantes de pago",
            "consultar comprobantes",
            "ver comprobantes",
            "pagos recibidos",
            "comprobantes de ventas",
            "comprobantes de clientes",
            "recibos de pago",
            "historial de cobros"
        ],
        "respuesta": (
            "Los comprobantes se encuentran en Finanzas. "
            "Ahi puedes consultar pagos de ventas de contado "
            "y abonos recibidos de cuentas por cobrar."
        ),
        "pasos": [
            "Abre el area Finanzas.",
            "Selecciona Comprobantes.",
            "Selecciona el periodo que quieres revisar.",
            "Consulta los pagos de publico general, clientes y cuentas por cobrar."
        ],
        "accion": {
            "texto": "Abrir Comprobantes",
            "area": "finanzas",
            "modulo": "fin-comprobantes"
        }
    },
    
    {
        "id": "cuentas_por_cobrar",
        "frases": [
            "cuentas por cobrar",
            "donde veo cuentas por cobrar",
            "cliente con adeudo",
            "clientes con deuda",
            "registrar un abono",
            "cobrar a un cliente",
            "saldo pendiente",
            "cxc"
        ],
        "respuesta": (
            "Cuentas por cobrar se encuentra en Finanzas. "
            "Ahi puedes consultar saldos pendientes, movimientos "
            "y registrar abonos de clientes."
        ),
        "pasos": [
            "Abre el area Finanzas.",
            "Selecciona Cuentas por cobrar.",
            "Busca al cliente o la venta.",
            "Abre el detalle para consultar o registrar un abono."
        ],
        "accion": {
            "texto": "Abrir Cuentas por cobrar",
            "area": "finanzas",
            "modulo": "fin-cxc"
        }
    },
    {
        "id": "inventario",
        "frases": [
            "poco inventario",
            "productos con poco inventario",
            "stock bajo",
            "productos por agotarse",
            "consultar inventario",
            "ver existencias",
            "almacen",
            "inventario"
        ],
        "respuesta": (
            "El inventario se encuentra en Operacion, dentro de "
            "Inventario y almacen. En esta primera version puedo llevarte "
            "al modulo; el analisis automatico de stock se conectara despues."
        ),
        "pasos": [
            "Abre el area Operacion.",
            "Selecciona Inventario y almacen.",
            "Revisa la existencia de cada producto."
        ],
        "accion": {
            "texto": "Abrir Inventario",
            "area": "operacion",
            "modulo": "erp-inventario"
        }
    },
    {
        "id": "cotizaciones",
        "frases": [
            "hacer una cotizacion",
            "crear una cotizacion",
            "nueva cotizacion",
            "enviar cotizacion",
            "cotizar producto",
            "embudo de ventas",
            "oportunidad comercial"
        ],
        "respuesta": (
            "Las cotizaciones se administran en CRM, dentro de "
            "Embudo y cotizaciones. El prospecto debe estar calificado "
            "antes de crear su oportunidad."
        ),
        "pasos": [
            "Abre el area CRM.",
            "Entra a Prospectos y seguimientos.",
            "Confirma que el prospecto este Calificado.",
            "Abre Embudo y cotizaciones para crear la oportunidad."
        ],
        "accion": {
            "texto": "Abrir Embudo y cotizaciones",
            "area": "crm",
            "modulo": "crm-embudo"
        }
    },
    
        # DASHBOARD COMERCIAL
    {
        "id": "dashboard_comercial",
        "frases": [
            "dashboard comercial",
            "resumen comercial",
            "indicadores comerciales",
            "resultados del crm",
            "tasa de conversion",
            "valor del embudo",
            "seguimientos vencidos",
            "rendimiento comercial"
        ],
        "respuesta": (
            "El Dashboard comercial se encuentra en CRM. "
            "Ahi puedes consultar prospectos activos, oportunidades, "
            "seguimientos vencidos, cierres y tasa de conversion."
        ),
        "pasos": [
            "Abre el area CRM.",
            "Selecciona Dashboard comercial.",
            "Revisa los indicadores generales.",
            "Consulta los seguimientos y cierres recientes."
        ],
        "accion": {
            "texto": "Abrir Dashboard comercial",
            "area": "crm",
            "modulo": "crm-dashboard"
        }
    },

    # PROSPECTOS Y SEGUIMIENTOS
    {
        "id": "prospectos",
        "frases": [
            "registrar un prospecto",
            "agregar un prospecto",
            "nuevo prospecto",
            "prospectos y seguimientos",
            "seguimiento de prospecto",
            "contactar prospecto",
            "calificar prospecto",
            "descartar prospecto"
        ],
        "respuesta": (
            "Los prospectos se administran en CRM, dentro de "
            "Prospectos y seguimientos. Ahi puedes registrar contactos, "
            "programar seguimientos y actualizar su estatus."
        ),
        "pasos": [
            "Abre el area CRM.",
            "Selecciona Prospectos y seguimientos.",
            "Registra un prospecto o selecciona uno existente.",
            "Captura el seguimiento y define la proxima accion."
        ],
        "accion": {
            "texto": "Abrir Prospectos y seguimientos",
            "area": "crm",
            "modulo": "crm-prospectos"
        }
    },

    # NEGOCIACIONES CERRADAS
    {
        "id": "negociaciones_cerradas",
        "frases": [
            "negociaciones cerradas",
            "ventas ganadas en crm",
            "oportunidades ganadas",
            "oportunidades perdidas",
            "cierres comerciales",
            "negociacion ganada",
            "negociacion perdida",
            "motivos de perdida"
        ],
        "respuesta": (
            "Las negociaciones cerradas se encuentran en CRM. "
            "Ahi puedes consultar oportunidades ganadas o perdidas, "
            "montos finales y motivos de perdida."
        ),
        "pasos": [
            "Abre el area CRM.",
            "Selecciona Negociaciones cerradas.",
            "Consulta el resultado de cada oportunidad.",
            "Revisa el monto final o el motivo de perdida."
        ],
        "accion": {
            "texto": "Abrir Negociaciones cerradas",
            "area": "crm",
            "modulo": "crm-negociaciones"
        }
    },
    
        # DIRECTORIO DE EMPLEADOS
    {
        "id": "empleados",
        "frases": [
            "registrar un empleado",
            "agregar un empleado",
            "nuevo empleado",
            "lista de empleados",
            "consultar empleados",
            "ver empleados",
            "editar empleado",
            "datos de empleado",
            "directorio de empleados"
        ],
        "respuesta": (
            "El directorio de empleados se encuentra en RR. HH. "
            "Ahi puedes registrar empleados, editar sus datos "
            "y consultar si se encuentran activos."
        ),
        "pasos": [
            "Abre el area RR. HH.",
            "Selecciona Empleados.",
            "Registra un empleado o selecciona uno existente.",
            "Captura o actualiza sus datos laborales y personales."
        ],
        "accion": {
            "texto": "Abrir Empleados",
            "area": "rrhh",
            "modulo": "rrhh-empleados"
        }
    },

    # MOVIMIENTOS ADMINISTRATIVOS
    {
        "id": "movimientos_rrhh",
        "frases": [
            "movimiento administrativo",
            "carta compromiso",
            "registrar carta compromiso",
            "suspender empleado",
            "suspension de empleado",
            "permiso de empleado",
            "registrar permiso",
            "alta de empleado",
            "reactivar empleado"
        ],
        "respuesta": (
            "Las cartas compromiso, suspensiones, permisos y altas "
            "se registran en RR. HH., dentro de Administrativo."
        ),
        "pasos": [
            "Abre el area RR. HH.",
            "Selecciona Administrativo.",
            "Pulsa Nuevo movimiento.",
            "Selecciona el empleado y el tipo de movimiento.",
            "Captura la fecha y el detalle correspondiente."
        ],
        "accion": {
            "texto": "Abrir Administrativo",
            "area": "rrhh",
            "modulo": "rrhh-administrativo"
        }
    },

    # CORREGIDO: BAJA DE EMPLEADO
    {
        "id": "baja_empleado",
        "frases": [
            "dar de baja a un empleado",
            "baja de empleado",
            "desactivar empleado",
            "empleado ya no trabaja",
            "registrar una baja",
            "terminar relacion laboral",
            "empleado inactivo"
        ],
        "respuesta": (
            "Las bajas se registran en RR. HH., dentro de "
            "Administrativo. Una baja desactiva al empleado "
            "sin eliminar su expediente."
        ),
        "pasos": [
            "Abre el area RR. HH.",
            "Selecciona Administrativo.",
            "Pulsa Nuevo movimiento.",
            "Selecciona el empleado y el tipo Baja.",
            "Captura la fecha y el detalle del movimiento."
        ],
        "accion": {
            "texto": "Abrir Administrativo",
            "area": "rrhh",
            "modulo": "rrhh-administrativo"
        }
    }
]


def normalizar_texto(valor):
    """
    Convierte una pregunta a un formato comparable.

    Ejemplo:
    Como REGISTRO una venta?
    se convierte en:
    como registro una venta
    """

    texto = str(valor or "").lower().strip()

    texto = unicodedata.normalize(
        "NFD",
        texto
    )

    texto = "".join(
        caracter
        for caracter in texto
        if unicodedata.category(caracter) != "Mn"
    )

    texto = re.sub(
        r"[^a-z0-9\s]",
        " ",
        texto
    )

    texto = re.sub(
        r"\s+",
        " ",
        texto
    ).strip()
    
    palabras = texto.split()
    
    palabras_normalizadas = [
        EQUIVALENCIAS_PALABRAS.get(
            palabra,
            palabra
        )
        for palabra in palabras
    ]
    
    return " ".join(palabras_normalizadas)


def obtener_palabras(texto):
    """
    Convierte una frase normalizada en un conjunto de palabras.

    Un conjunto evita contar varias veces la misma palabra.
    """

    return set(
        re.findall(
            r"[a-z0-9]+",
            texto
        )
    )


def puntuar_tema(consulta, palabras_consulta, tema):
    """
    Calcula que tan relacionada esta una pregunta con un tema.

    Una frase completa vale mas que una palabra individual.
    """

    puntuacion = 0

    for frase in tema["frases"]:
        frase_normalizada = normalizar_texto(frase)
        palabras_frase = obtener_palabras(frase_normalizada)

        if frase_normalizada in consulta:
            puntuacion += 6 + len(palabras_frase)
            continue

        coincidencias = palabras_frase.intersection(
            palabras_consulta
        )

        if len(palabras_frase) == 1 and coincidencias:
            puntuacion += 2

        elif (
            len(palabras_frase) > 1
            and len(coincidencias) == len(palabras_frase)
        ):
            puntuacion += 3

    return puntuacion


def respuesta_capacidades():
    """
    Devuelve una respuesta nueva con las capacidades actuales.

    Se crea un diccionario nuevo para evitar que una respuesta
    modifique accidentalmente la configuracion general.
    """

    return {
        "tipo": "capacidades",
        "respuesta": (
            "Puedo ayudarte a encontrar funciones y explicar "
            "como utilizar los modulos actuales de BizPilot."
        ),
        "pasos": [],
        "acciones": [],
        "sugerencias": deepcopy(SUGERENCIAS_GENERALES)
    }


def respuesta_sin_resultado():
    """
    Se utiliza cuando el motor no reconoce la pregunta.
    No inventa una respuesta.
    """

    return {
        "tipo": "sin_resultado",
        "respuesta": (
            "Todavia no tengo una respuesta confiable para esa pregunta. "
            "Puedes preguntarme por ventas, gastos, inventario, cobranza, "
            "cotizaciones o movimientos de empleados."
        ),
        "pasos": [],
        "acciones": [],
        "sugerencias": deepcopy(SUGERENCIAS_GENERALES)
    }


def responder_pregunta(mensaje):
    """
    Funcion principal del motor local.

    Recibe el mensaje del usuario, busca el tema con mayor
    puntuacion y devuelve una respuesta estructurada.
    """

    consulta = normalizar_texto(mensaje)

    if not consulta:
        return respuesta_capacidades()

    saludos = {
        "hola",
        "buenas",
        "buen dia",
        "que onda",
        "que tal",
        "hola bizpilot"
    }

    if consulta in saludos:
        return {
            "tipo": "saludo",
            "respuesta": (
                "Hola. Soy BizPilot IA. Dime que quieres hacer "
                "o que modulo necesitas encontrar."
            ),
            "pasos": [],
            "acciones": [],
            "sugerencias": deepcopy(SUGERENCIAS_GENERALES)
        }

    preguntas_capacidades = [
        "que puedes hacer",
        "como me ayudas",
        "para que sirves",
        "en que me ayudas",
        "ayuda general"
    ]

    if any(
        frase in consulta
        for frase in preguntas_capacidades
    ):
        return respuesta_capacidades()

    palabras_consulta = obtener_palabras(consulta)

    mejor_tema = None
    mejor_puntuacion = 0

    for tema in BASE_CONOCIMIENTO:
        puntuacion = puntuar_tema(
            consulta,
            palabras_consulta,
            tema
        )

        if puntuacion > mejor_puntuacion:
            mejor_tema = tema
            mejor_puntuacion = puntuacion

    if mejor_tema is None or mejor_puntuacion < 2:
        return respuesta_sin_resultado()

    return {
        "tipo": "ayuda",
        "tema": mejor_tema["id"],
        "respuesta": mejor_tema["respuesta"],
        "pasos": deepcopy(mejor_tema["pasos"]),
        "acciones": [
            deepcopy(mejor_tema["accion"])
        ],
        "sugerencias": deepcopy(SUGERENCIAS_GENERALES[:3])
    }
