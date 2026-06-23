using FluentValidation;

namespace PréstamoPlus.Application.Features.Solicituds.Commands.CreateSolicitud
{
    public class CreateSolicitudCommandValidator : AbstractValidator<CreateSolicitudCommand>
    {
        public CreateSolicitudCommandValidator()
        {
            RuleFor(x => x.Request.Client.Nombre)
                .NotEmpty().WithMessage("El nombre es requerido")
                .MaximumLength(200);

            RuleFor(x => x.Request.Client.Cedula)
                .NotEmpty().WithMessage("La cédula es requerida")
                .MaximumLength(20);

            RuleFor(x => x.Request.Client.Email)
                .NotEmpty().WithMessage("El email es requerido")
                .EmailAddress().WithMessage("Email inválido");

            RuleFor(x => x.Request.Client.Telefono)
                .NotEmpty().WithMessage("El teléfono es requerido")
                .MaximumLength(20);

            RuleFor(x => x.Request.Client.FechaNacimiento)
                .NotEmpty().WithMessage("La fecha de nacimiento es requerida")
                .LessThan(DateTime.Today).WithMessage("La fecha debe ser en el pasado");

            RuleFor(x => x.Request.WorkInformation.Empresa)
                .NotEmpty().WithMessage("La empresa es requerida");

            RuleFor(x => x.Request.WorkInformation.Cargo)
                .NotEmpty().WithMessage("El cargo es requerido");

            RuleFor(x => x.Request.WorkInformation.Salario)
                .GreaterThan(0).WithMessage("El salario debe ser mayor a 0");

            RuleFor(x => x.Request.Address.Direccion)
                .NotEmpty().WithMessage("La dirección es requerida");

            RuleFor(x => x.Request.Address.Ciudad)
                .NotEmpty().WithMessage("La ciudad es requerida");

            RuleFor(x => x.Request.Address.Provincia)
                .NotEmpty().WithMessage("La provincia es requerida");

            RuleFor(x => x.Request.References)
                .NotEmpty().WithMessage("Debe agregar al menos una referencia")
                .Must(r => r.Count >= 2).WithMessage("Debe agregar al menos dos referencias");

            RuleFor(x => x.Request.BankAccount.Banco)
                .NotEmpty().WithMessage("El banco es requerido");

            RuleFor(x => x.Request.BankAccount.NumeroCuenta)
                .NotEmpty().WithMessage("El número de cuenta es requerido");

            RuleFor(x => x.Request.MontoSolicitado)
                .GreaterThan(0).WithMessage("El monto debe ser mayor a 0");

            RuleFor(x => x.Request.TasaInteresMensual)
                .GreaterThan(0).WithMessage("La tasa debe ser mayor a 0");

            RuleFor(x => x.Request.Plazo)
                .GreaterThan(0).WithMessage("El plazo debe ser mayor a 0");
        }
    }
}
