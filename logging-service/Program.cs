using Serilog;
using Serilog.Events;

var builder = WebApplication.CreateBuilder(args);

// base log path
var logBasePath = Path.GetFullPath("../logs");

// Ensure log directories exist
var logDirectories = new[] { 
    Path.Combine(logBasePath, "user"),
    Path.Combine(logBasePath, "authority"),
    Path.Combine(logBasePath, "admin"),
    Path.Combine(logBasePath, "fir")
};

foreach (var dir in logDirectories)
{
    if (!Directory.Exists(dir))
    {
        Directory.CreateDirectory(dir);
    }
}

// configure main logger with console output and rolling file
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console(outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .WriteTo.File(
        path: Path.Combine(logBasePath, "app_.log"),
        rollingInterval: RollingInterval.Day,
        rollOnFileSizeLimit: true,
        fileSizeLimitBytes: 10 * 1024 * 1024, // 10MB
        retainedFileCountLimit: 31,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss} - {Level:u3} - {Message:lj}{NewLine}{Exception}"
    )
    .CreateLogger();

builder.Host.UseSerilog();

// add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// register log file paths as singleton for controller access - using new folder structure
builder.Services.AddSingleton(new LoggingService.LogFilePaths
{
    BasePath = logBasePath,
    // User logs
    UserAuthLog = Path.Combine(logBasePath, "user", "user_auth_logs.txt"),
    // Authority logs
    AuthorityLog = Path.Combine(logBasePath, "authority", "authority_logs.txt"),
    // Admin logs
    AdminLog = Path.Combine(logBasePath, "admin", "admin_logs.txt"),
    // FIR and Missing Person logs
    FirLog = Path.Combine(logBasePath, "fir", "fir_logs.txt")
});

// configure cors
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:8080", "http://localhost:8081", "http://localhost:3001", "http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors();
app.UseAuthorization();
app.MapControllers();

// health check endpoint
app.MapGet("/health", () => new { 
    Status = "Logging Service is running", 
    Timestamp = DateTime.UtcNow,
    LogPath = logBasePath
});

try
{
    Log.Information("Starting Logging Service with log path: {LogPath}", logBasePath);
    app.Run("http://localhost:5000");
}
catch (Exception ex)
{
    Log.Fatal(ex, "Logging Service terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

// log file paths configuration class - updated with new structure
namespace LoggingService
{
    public class LogFilePaths
    {
        public string BasePath { get; set; } = "../logs";
        // User-related logs (login, signup, logout)
        public string UserAuthLog { get; set; } = "../logs/user/user_auth_logs.txt";
        // Authority-related logs (sign-in, actions, updates)
        public string AuthorityLog { get; set; } = "../logs/authority/authority_logs.txt";
        // Admin-related logs (sign-in, admin actions)
        public string AdminLog { get; set; } = "../logs/admin/admin_logs.txt";
        // FIR and Missing Person logs
        public string FirLog { get; set; } = "../logs/fir/fir_logs.txt";
    }
}

