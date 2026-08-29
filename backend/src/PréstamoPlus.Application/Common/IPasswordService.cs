namespace PréstamoPlus.Application.Common;

public interface IPasswordService
{
    string Hash(string password);
    bool Verify(string password, string encodedHash);
}
