using LoggingService.Models;
using Microsoft.AspNetCore.Mvc;
using Serilog;

namespace LoggingService.Controllers;

[ApiController]
[Route("api")]
public class LogController : ControllerBase
{
    private static readonly Serilog.ILogger _logger = Log.ForContext<LogController>();
    private readonly LogFilePaths _logPaths;
    
    // Lock objects for thread-safe file writing
    private static readonly object _userLogLock = new();
    private static readonly object _authorityLogLock = new();
    private static readonly object _adminLogLock = new();
    private static readonly object _firLogLock = new();

    public LogController(LogFilePaths logPaths)
    {
        _logPaths = logPaths;
    }

    [HttpPost("log")]
    public IActionResult LogEvent([FromBody] LogRequest request)
    {
        try
        {
            var logId = Guid.NewGuid().ToString("N")[..8].ToUpper();
            var timestamp = request.Timestamp.HasValue 
                ? DateTimeOffset.FromUnixTimeMilliseconds(request.Timestamp.Value).DateTime 
                : DateTime.UtcNow;

            // Format timestamp as human-readable
            var formattedTimestamp = timestamp.ToString("yyyy-MM-dd HH:mm:ss");

            // Build human-readable log message based on event type
            var (logMessage, logFilePath, category, lockObj) = BuildLogMessage(request, formattedTimestamp);

            // Write to appropriate log file with thread safety
            var writeSuccess = WriteToLogFileThreadSafe(logFilePath, logMessage, lockObj);

            // Also log to main logger (console + main log file)
            LogToMainLogger(request.EventType, logId, logMessage, timestamp);

            // If file write failed, we already have console fallback from Serilog
            if (!writeSuccess)
            {
                _logger.Warning("File write failed for {Category}, logged to console as fallback", category);
            }

            return Ok(new LogResponse
            {
                Success = true,
                Message = "Event logged successfully",
                LogId = logId,
                Category = category,
                FilePath = logFilePath
            });
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to log event");
            // Fallback - log to console at minimum
            Console.WriteLine($"[FALLBACK] {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} - {request.EventType} - {request.Message}");
            
            return StatusCode(500, new LogResponse
            {
                Success = false,
                Message = "Failed to log event, fallback to console"
            });
        }
    }

    // Build formatted log message and determine target file
    private (string message, string filePath, string category, object lockObj) BuildLogMessage(LogRequest request, string timestamp)
    {
        var eventType = request.EventType?.ToUpper() ?? "UNKNOWN";
        string message;
        string filePath;
        string category;
        object lockObj;

        switch (eventType)
        {
            // User authentication events -> /logs/user/user_auth_logs.txt
            case "LOGIN":
                var loginInfo = !string.IsNullOrEmpty(request.UserName) 
                    ? $"User ID: {request.UserId}, Name: {request.UserName}"
                    : !string.IsNullOrEmpty(request.UserEmail)
                    ? $"User ID: {request.UserId}, Email: {request.UserEmail}"
                    : $"User ID: {request.UserId}, Ref: {request.Reference}";
                message = $"{timestamp} - User Login - {loginInfo}";
                filePath = _logPaths.UserAuthLog;
                category = "user";
                lockObj = _userLogLock;
                break;

            case "LOGOUT":
                message = $"{timestamp} - User Logout - User ID: {request.UserId}, Ref: {request.Reference}";
                filePath = _logPaths.UserAuthLog;
                category = "user";
                lockObj = _userLogLock;
                break;

            case "USER_REGISTERED":
                var signupInfo = BuildUserSignupInfo(request);
                message = $"{timestamp} - User Signup - {signupInfo}";
                filePath = _logPaths.UserAuthLog;
                category = "user";
                lockObj = _userLogLock;
                break;

            // Authority events -> /logs/authority/authority_logs.txt
            case "AUTHORITY_REGISTERED":
                var authRegInfo = !string.IsNullOrEmpty(request.AuthorityName)
                    ? $"Authority ID: {request.UserId}, Name: {request.AuthorityName}"
                    : $"Authority ID: {request.UserId}, Ref: {request.Reference}";
                message = $"{timestamp} - Authority Registered - {authRegInfo}";
                filePath = _logPaths.AuthorityLog;
                category = "authority";
                lockObj = _authorityLogLock;
                break;

            case "AUTHORITY_ACTION":
            case "CASE_STATUS_CHANGED":
            case "AUTHORITY_CASE_UPDATE":
                message = $"{timestamp} - Authority Action - Authority ID: {request.UserId}, Action: {request.Message ?? request.Reference}";
                filePath = _logPaths.AuthorityLog;
                category = "authority";
                lockObj = _authorityLogLock;
                break;

            // Admin events -> /logs/admin/admin_logs.txt
            case "ADMIN_LOGIN":
                var adminLoginInfo = !string.IsNullOrEmpty(request.UserName)
                    ? $"Admin ID: {request.UserId}, Name: {request.UserName}"
                    : $"Admin ID: {request.UserId}, Ref: {request.Reference}";
                message = $"{timestamp} - Admin Sign-In - {adminLoginInfo}";
                filePath = _logPaths.AdminLog;
                category = "admin";
                lockObj = _adminLogLock;
                break;

            case "ADMIN_ACTION":
            case "AUTHORITY_CREATED":
            case "AUTHORITY_UPDATED":
            case "AUTHORITY_DELETED":
            case "CASE_REASSIGNED":
                var adminActionDetails = !string.IsNullOrEmpty(request.Message)
                    ? request.Message
                    : $"Action: {eventType}, Reference: {request.Reference}";
                message = $"{timestamp} - Admin Action - Admin ID: {request.UserId}, {adminActionDetails}";
                filePath = _logPaths.AdminLog;
                category = "admin";
                lockObj = _adminLogLock;
                break;

            // FIR and Missing Person events -> /logs/fir/fir_logs.txt
            case "FIR_FILED":
                message = $"{timestamp} - FIR Filed - FIR: {request.Reference}, User ID: {request.UserId}";
                filePath = _logPaths.FirLog;
                category = "fir";
                lockObj = _firLogLock;
                break;

            case "FIR_UPDATED":
                var firUpdateInfo = !string.IsNullOrEmpty(request.Message)
                    ? request.Message
                    : $"FIR: {request.Reference}, Authority ID: {request.UserId}";
                message = $"{timestamp} - Authority FIR Update - {firUpdateInfo}";
                filePath = _logPaths.FirLog;
                category = "fir";
                lockObj = _firLogLock;
                break;

            case "FIR_REASSIGNED":
                message = $"{timestamp} - FIR Reassigned - FIR: {request.Reference}, By: {request.UserId}";
                filePath = _logPaths.FirLog;
                category = "fir";
                lockObj = _firLogLock;
                break;

            case "MISSING_PERSON_FILED":
                message = $"{timestamp} - Missing Person Report Filed - Case: {request.Reference}, User ID: {request.UserId}";
                filePath = _logPaths.FirLog;
                category = "fir";
                lockObj = _firLogLock;
                break;

            case "MISSING_PERSON_UPDATED":
                var mpUpdateInfo = !string.IsNullOrEmpty(request.Message)
                    ? request.Message
                    : $"Case: {request.Reference}, Authority ID: {request.UserId}";
                message = $"{timestamp} - Authority Missing Person Update - {mpUpdateInfo}";
                filePath = _logPaths.FirLog;
                category = "fir";
                lockObj = _firLogLock;
                break;

            case "MISSING_PERSON_REASSIGNED":
                message = $"{timestamp} - Missing Person Report Reassigned - Case: {request.Reference}, By: {request.UserId}";
                filePath = _logPaths.FirLog;
                category = "fir";
                lockObj = _firLogLock;
                break;



            default:
                // Default to user auth log for unknown event types
                message = $"{timestamp} - {eventType} - User ID: {request.UserId}, {request.Message ?? request.Reference ?? "No details"}";
                filePath = _logPaths.UserAuthLog;
                category = "general";
                lockObj = _userLogLock;
                break;
        }

        // DUAL LOGGING: If it's an Authority Update on a Case, ALSO log to Authority Log
        if (eventType == "FIR_UPDATED" || eventType == "MISSING_PERSON_UPDATED")
        {
             string authMessage = $"{timestamp} - Authority Action - {request.Message ?? eventType}";
             WriteToLogFileThreadSafe(_logPaths.AuthorityLog, authMessage, _authorityLogLock);
        }

        return (message, filePath, category, lockObj);
    }

    // Build user signup info string
    private static string BuildUserSignupInfo(LogRequest request)
    {
        var parts = new List<string>();
        
        if (request.UserId.HasValue)
            parts.Add($"User ID: {request.UserId}");
        
        if (!string.IsNullOrEmpty(request.UserName))
            parts.Add($"Name: {request.UserName}");
        
        if (!string.IsNullOrEmpty(request.UserEmail))
            parts.Add($"Email: {request.UserEmail}");
        else if (!string.IsNullOrEmpty(request.Reference))
            parts.Add($"Ref: {request.Reference}");

        return parts.Count > 0 ? string.Join(", ", parts) : "No details";
    }

    // Write to log file with thread safety and error handling
    private bool WriteToLogFileThreadSafe(string filePath, string message, object lockObj)
    {
        try
        {
            var directory = Path.GetDirectoryName(filePath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            lock (lockObj)
            {
                // Append with newline
                System.IO.File.AppendAllText(filePath, message + Environment.NewLine);
            }
            
            return true;
        }
        catch (Exception ex)
        {
            // Fallback to console logging
            _logger.Error(ex, "Failed to write to log file: {FilePath}, falling back to console", filePath);
            Console.WriteLine($"[CONSOLE FALLBACK] {message}");
            return false;
        }
    }

    // Log to main serilog logger for console output
    private void LogToMainLogger(string? eventType, string logId, string logMessage, DateTime timestamp)
    {
        switch (eventType?.ToUpper())
        {
            case "ERROR":
                _logger.Error("{LogId} - {Message}", logId, logMessage);
                break;
            case "WARNING":
                _logger.Warning("{LogId} - {Message}", logId, logMessage);
                break;
            default:
                _logger.Information("{LogId} - {Message}", logId, logMessage);
                break;
        }
    }

    [HttpGet("logs")]
    public IActionResult GetRecentLogs([FromQuery] int count = 50, [FromQuery] string? category = null)
    {
        try
        {
            string logFilePath = GetLogFilePathByCategory(category);

            if (!System.IO.File.Exists(logFilePath))
            {
                return Ok(new { Success = true, Logs = new List<string>(), Category = category ?? "general", FilePath = logFilePath });
            }

            var lines = System.IO.File.ReadAllLines(logFilePath)
                                .TakeLast(count)
                                .Reverse()
                                .ToList();

            return Ok(new { Success = true, Logs = lines, Category = category ?? "general", FilePath = logFilePath });
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to retrieve logs");
            return StatusCode(500, new { Success = false, Message = "Failed to retrieve logs" });
        }
    }

    // Get log file path based on category
    private string GetLogFilePathByCategory(string? category)
    {
        if (string.IsNullOrEmpty(category))
            return Path.Combine(_logPaths.BasePath, "app_.log");

        return category.ToLower() switch
        {
            "user" or "auth" => _logPaths.UserAuthLog,
            "authority" => _logPaths.AuthorityLog,
            "admin" => _logPaths.AdminLog,
            "fir" or "missing_person" => _logPaths.FirLog,
            _ => Path.Combine(_logPaths.BasePath, "app_.log")
        };
    }

    [HttpGet("logs/categories")]
    public IActionResult GetLogCategories()
    {
        return Ok(new 
        { 
            Success = true, 
            Categories = new[] 
            { 
                new { Name = "user", Description = "User login/signup/logout logs", Path = _logPaths.UserAuthLog },
                new { Name = "authority", Description = "Authority sign-in and actions", Path = _logPaths.AuthorityLog },
                new { Name = "admin", Description = "Admin sign-in and actions", Path = _logPaths.AdminLog },
                new { Name = "fir", Description = "FIR and Missing Person reports", Path = _logPaths.FirLog }
            }
        });
    }

    [HttpGet("logs/structure")]
    public IActionResult GetLogStructure()
    {
        return Ok(new
        {
            Success = true,
            BasePath = _logPaths.BasePath,
            Files = new
            {
                UserAuthLog = _logPaths.UserAuthLog,
                AuthorityLog = _logPaths.AuthorityLog,
                AdminLog = _logPaths.AdminLog,
                FirLog = _logPaths.FirLog
            }
        });
    }
}
