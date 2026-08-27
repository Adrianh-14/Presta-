namespace PréstamoPlus.Domain.Enums
{
    public enum EstadoCivil
    {
        Soltero = 0,
        Casado = 1,
        Divorciado = 2,
        Viudo = 3
    }

    public enum TipoEmpleo
    {
        Formal = 0,
        Informal = 1,
        Independiente = 2,
        Jubilado = 3
    }

    public enum FrecuenciaPago
    {
        Diaria = 0,
        Semanal = 1,
        Quincenal = 2,
        Mensual = 3
    }

    public enum EstadoSolicitud
    {
        Pendiente = 0,
        Procesando = 1,
        EnRevision = Procesando,
        Aprobada = 2,
        Negada = 3,
        Rechazada = Negada,
        Cancelada = 4
    }

    public enum EstadoCliente
    {
        Activo = 0,
        Inactivo = 1
    }

    public enum EstadoPrestamo
    {
        Activo = 0,
        Vencido = 1,
        Mora = 2,
        Pagado = 3,
        Cancelado = 4,
        Legal = 5
    }

    public enum TipoPrestamo
    {
        Personal = 0,
        Garantia = 1
    }

    public enum TipoCuentaBancaria
    {
        Corriente = 0,
        Ahorro = 1,
        Nomina = 2
    }

    public enum UnidadPlazo
    {
        Meses = 0,
        Anios = 1
    }

    public enum RelacionReferencia
    {
        Familiar = 0,
        Amigo = 1,
        Compañero = 2,
        Otro = 3
    }

    public enum MetodoPago
    {
        Efectivo = 0,
        Transferencia = 1,
        Tarjeta = 2
    }

    public enum TipoNotificacion
    {
        Email = 0,
        WhatsApp = 1
    }

    public enum EstadoMensaje
    {
        Pendiente = 0,
        Enviado = 1,
        Fallido = 2
    }

    public enum EstadoInstallment
    {
        Pendiente = 0,
        Parcial = 1,
        Pagado = 2,
        Vencido = 3
    }

    public enum EstadoAsignacion
    {
        Asignado = 0,
        EnProgreso = 1,
        Completado = 2,
        Cancelado = 3
    }

    public enum TipoVisita
    {
        CobroExitoso = 0,
        CobroParcial = 1,
        NoEncontrado = 2,
        Rechazado = 3,
        ClienteAusente = 4
    }

    public enum ExpenseCategory
    {
        SalarioCobrador = 0,
        ServiciosBasicos = 1,
        Oficina = 2,
        Marketing = 3,
        ImpuestosLegales = 4,
        Transporte = 5
    }

    public enum PaymentQRStatus
    {
        Pending = 0,
        Used = 1,
        Expired = 2,
        Cancelled = 3
    }
}
