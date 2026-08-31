FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["src/PréstamoPlus.Domain/PréstamoPlus.Domain.csproj", "src/PréstamoPlus.Domain/"]
COPY ["src/PréstamoPlus.Application/PréstamoPlus.Application.csproj", "src/PréstamoPlus.Application/"]
COPY ["src/PréstamoPlus.Infrastructure/PréstamoPlus.Infrastructure.csproj", "src/PréstamoPlus.Infrastructure/"]
COPY ["src/PréstamoPlus.API/PréstamoPlus.API.csproj", "src/PréstamoPlus.API/"]
RUN dotnet restore "src/PréstamoPlus.API/PréstamoPlus.API.csproj"

COPY src ./src
RUN dotnet publish "src/PréstamoPlus.API/PréstamoPlus.API.csproj" \
    --configuration Release \
    --output /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
RUN apt-get update \
    && apt-get install --yes --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/publish .
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod 755 /app/docker-entrypoint.sh

ENV ASPNETCORE_URLS=http://+:5001
EXPOSE 5001
ENTRYPOINT ["/app/docker-entrypoint.sh"]
