$ErrorActionPreference = "Stop"

$BaseUrl = "http://localhost:3000"

$emailA = "nexus-isolation-a-1790087096509@example.com"
$passwordA = "NexusTest!A123456"

$emailB = "nexus-isolation-b-1790087096509@example.com"
$passwordB = "NexusTest!B123456"

$interviewId = "cmucrxmf90000bsmvob0b3o1u"
$conversationId = "cmucrxmwl0001bsmvo97rvwl6"
$actionId = "idor-test-1790087592639"

function Login-User($email, $password) {
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

    $body = @{
        email    = $email
        password = $password
    } | ConvertTo-Json

    $response = Invoke-WebRequest `
        -Uri "$BaseUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -WebSession $session `
        -UseBasicParsing

    if ($response.StatusCode -ne 200) {
        throw "Login failed for $email"
    }

    return $session
}

function Request-Test(
    $session,
    $method,
    $path,
    $body = $null
) {
    try {
        $params = @{
            Uri         = "$BaseUrl$path"
            Method      = $method
            WebSession  = $session
            UseBasicParsing = $true
        }

        if ($null -ne $body) {
            $params.ContentType = "application/json"
            $params.Body = ($body | ConvertTo-Json)
        }

        $response = Invoke-WebRequest @params

        return @{
            Status = [int]$response.StatusCode
            Body   = $response.Content
        }
    }
    catch {
        $status = 0

        if ($_.Exception.Response) {
            try {
                $status = [int]$_.Exception.Response.StatusCode
            }
            catch {}
        }

        return @{
            Status = $status
            Body   = ""
        }
    }
}

$passed = 0
$failed = 0

function Pass($message) {
    $script:passed++
    Write-Host "[PASS] $message" -ForegroundColor Green
}

function Fail($message) {
    $script:failed++
    Write-Host "[FAIL] $message" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " NEXUS CROSS-USER IDOR SECURITY TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Logging in User A..." -ForegroundColor Yellow
$sessionA = Login-User $emailA $passwordA
Write-Host "User A authenticated." -ForegroundColor Green

Write-Host "Logging in User B..." -ForegroundColor Yellow
$sessionB = Login-User $emailB $passwordB
Write-Host "User B authenticated." -ForegroundColor Green

Write-Host ""
Write-Host "----------------------------------------"
Write-Host "1. User B -> User A Interview Session"
Write-Host "----------------------------------------"

$bInterview = Request-Test `
    $sessionB `
    "GET" `
    "/api/interview/session/$interviewId"

Write-Host "HTTP status: $($bInterview.Status)"

if ($bInterview.Status -eq 404) {
    Pass "User B cannot access User A interview session"
}
else {
    Fail "User B accessed User A interview session"
}

Write-Host ""
Write-Host "----------------------------------------"
Write-Host "2. User B -> User A Copilot Conversation"
Write-Host "----------------------------------------"

$bCopilot = Request-Test `
    $sessionB `
    "GET" `
    "/api/copilot/$conversationId"

Write-Host "HTTP status: $($bCopilot.Status)"

if ($bCopilot.Status -eq 404) {
    Pass "User B cannot read User A Copilot conversation"
}
else {
    Fail "User B accessed User A Copilot conversation"
}

Write-Host ""
Write-Host "----------------------------------------"
Write-Host "3. User B -> DELETE User A Copilot"
Write-Host "----------------------------------------"

$bCopilotDelete = Request-Test `
    $sessionB `
    "DELETE" `
    "/api/copilot/$conversationId"

Write-Host "HTTP status: $($bCopilotDelete.Status)"

if ($bCopilotDelete.Status -eq 404) {
    Pass "User B cannot delete User A Copilot conversation"
}
else {
    Fail "User B deleted/accessed User A Copilot conversation"
}

Write-Host ""
Write-Host "----------------------------------------"
Write-Host "4. User B -> User A Career Action"
Write-Host "----------------------------------------"

$bAction = Request-Test `
    $sessionB `
    "GET" `
    "/api/career/actions/$actionId"

Write-Host "HTTP status: $($bAction.Status)"

if ($bAction.Status -eq 404) {
    Pass "User B cannot read User A Career Action"
}
else {
    Fail "User B accessed User A Career Action"
}

Write-Host ""
Write-Host "----------------------------------------"
Write-Host "5. User B -> PATCH User A Career Action"
Write-Host "----------------------------------------"

$bActionPatch = Request-Test `
    $sessionB `
    "PATCH" `
    "/api/career/actions/$actionId" `
    @{
        status = "Completed"
        progress = 100
    }

Write-Host "HTTP status: $($bActionPatch.Status)"

if ($bActionPatch.Status -eq 404) {
    Pass "User B cannot modify User A Career Action"
}
else {
    Fail "User B modified/accessed User A Career Action"
}

Write-Host ""
Write-Host "----------------------------------------"
Write-Host "6. User A -> Own Interview Session"
Write-Host "----------------------------------------"

$aInterview = Request-Test `
    $sessionA `
    "GET" `
    "/api/interview/session/$interviewId"

Write-Host "HTTP status: $($aInterview.Status)"

if ($aInterview.Status -eq 200) {
    Pass "User A can access own interview session"
}
else {
    Fail "User A cannot access own interview session"
}

Write-Host ""
Write-Host "----------------------------------------"
Write-Host "7. User A -> Own Copilot Conversation"
Write-Host "----------------------------------------"

$aCopilot = Request-Test `
    $sessionA `
    "GET" `
    "/api/copilot/$conversationId"

Write-Host "HTTP status: $($aCopilot.Status)"

if ($aCopilot.Status -eq 200) {
    Pass "User A can access own Copilot conversation"
}
else {
    Fail "User A cannot access own Copilot conversation"
}

Write-Host ""
Write-Host "----------------------------------------"
Write-Host "8. User A -> Own Career Action"
Write-Host "----------------------------------------"

$aAction = Request-Test `
    $sessionA `
    "GET" `
    "/api/career/actions/$actionId"

Write-Host "HTTP status: $($aAction.Status)"

if ($aAction.Status -eq 200) {
    Pass "User A can access own Career Action"
}
else {
    Fail "User A cannot access own Career Action"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IDOR TEST RESULTS" -ForegroundColor Cyan
Write-Host "========================================"
Write-Host "Passed: $passed"
Write-Host "Failed: $failed"
Write-Host "========================================"

if ($failed -gt 0) {
    throw "Cross-user IDOR security test failed."
}

Write-Host ""
Write-Host "CROSS-USER ISOLATION TEST PASSED." -ForegroundColor Green
Write-Host "User B cannot access User A's protected records." -ForegroundColor Green

