using Infraestructure.DataBase;
using Infraestructure.Repository;
using Aplication.Interfaces;
using Aplication.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("ExpoWebDevelopment", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:8081",
                "http://127.0.0.1:8081",
                "http://localhost:19006",
                "http://127.0.0.1:19006",
                "http://localhost:8083")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


var connectionString = builder.Configuration.GetConnectionString("default")
    ?? throw new InvalidOperationException("No se encontró la cadena de conexión 'default'.");

builder.Services.AddSingleton(
    new DBConexionFactory(connectionString));

builder.Services.AddScoped<ITicketRepository, TicketRepository>();
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddScoped<ITecnicoRepository, TecnicoRepository>();
builder.Services.AddScoped<ISeguimientoTicketRepository, SeguimientoTicketRepository>();
builder.Services.AddScoped<IRolesRepository, RolRepository>();
builder.Services.AddScoped<IPrioridadRepository, PrioridadRepository>();
builder.Services.AddScoped<ILoginRpository, LoginRepository>();
builder.Services.AddScoped<IEstadoTicketRepository, EstadoTicketRepository>();
builder.Services.AddScoped<IEstadoRepository, EstadoRepository>();
builder.Services.AddScoped<IDTGeneraRepository, DTGeneralRepository>();
builder.Services.AddScoped<IDetalleTicketRepository, DetalleTicketRepository>();
builder.Services.AddScoped<ICategoriaRepository, CategoriaRepository>();
builder.Services.AddScoped<IAuditoriaRepository, AuditoriaRepository>();
builder.Services.AddScoped<IPuestoRepository, PuestoRepository>();
builder.Services.AddScoped<TicketServices>();
builder.Services.AddScoped<UsuarioServices>();
builder.Services.AddScoped<TecnicoServices>();
builder.Services.AddScoped<SeguimientoTicketServices>();
builder.Services.AddScoped<RolesServices>();
builder.Services.AddScoped<PrioridadServices>();
builder.Services.AddScoped<LoginServices>();
builder.Services.AddScoped<EstadoTicketServices>();
builder.Services.AddScoped<EstadoServices>();
builder.Services.AddScoped<DTGeneralSevices>();
builder.Services.AddScoped<DetalleTicketServices>();
builder.Services.AddScoped<CategoriaServices>();
builder.Services.AddScoped<AuditoriaServices>();
builder.Services.AddScoped<PuestoServices>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseCors("ExpoWebDevelopment");
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();

app.MapControllers();

app.Run();
