namespace PréstamoPlus.Application.Common.MultiTenancy
{
    public interface ITenantService
    {
        Guid? GetCurrentTenantId();
        void SetCurrentTenantId(Guid tenantId);
    }

    public class TenantService : ITenantService
    {
        private Guid? _tenantId;

        public Guid? GetCurrentTenantId() => _tenantId;

        public void SetCurrentTenantId(Guid tenantId) => _tenantId = tenantId;
    }
}
