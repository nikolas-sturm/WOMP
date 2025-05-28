# Get the directory where this script is located
$installDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Get the current PATH environment variable for the current user (not machine-wide)
$oldPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::User)

# Check if the directory is already in PATH
if ($oldPath -notmatch [regex]::Escape($installDir)) {
    # Add the install directory to PATH
    $newPath = "$oldPath;$installDir"
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, [System.EnvironmentVariableTarget]::User)
    Write-Output "Successfully added $installDir to PATH"
} else {
    Write-Output "$installDir is already in PATH"
}