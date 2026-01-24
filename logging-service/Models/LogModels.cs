namespace LoggingService.Models;

// request model for incoming log events
public class LogRequest
{
    public string EventType { get; set; } = string.Empty;
    public long? UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserEmail { get; set; }
    public string? AuthorityName { get; set; }
    public string? Reference { get; set; }
    public long? Timestamp { get; set; }
    public string? Message { get; set; }
    public string? Details { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}

// response model for log operations
public class LogResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? LogId { get; set; }
    public string? Category { get; set; }
    public string? FilePath { get; set; }
}

