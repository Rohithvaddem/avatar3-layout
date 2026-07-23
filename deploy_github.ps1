# Add MinGit to PATH for the duration of this script
$env:PATH += ";c:\Users\ADMIN\aspirohithpc\mingit\cmd"

$git = "c:\Users\ADMIN\aspirohithpc\mingit\cmd\git.exe"
$gh = "C:\Program Files\GitHub CLI\gh.exe"

# If .git directory doesn't exist, initialize
if (-not (Test-Path "c:\Users\ADMIN\aspirohithpc\.git")) {
    Write-Host "Initializing local Git repository..."
    & $git init
}

# Configure local git user info
Write-Host "Configuring Git user info..."
& $git config user.name "Aspirealty Staff"
& $git config user.email "info@aspirealty.com"

# Ensure branch is main
& $git branch -M main

Write-Host "Staging files..."
& $git add -A

Write-Host "Committing files..."
# Ignore warning if no changes to commit
& $git commit -m "Initial commit of Aspirealty Avatar 3 Interactive Layout" 2>$null

Write-Host "Creating GitHub repository and pushing files..."
# Create repository and push using GitHub CLI
# Wrapping in cmd or passing arguments carefully to prevent PowerShell argument parsing errors
& $gh repo create avatar3-layout --public --source=. --push

Write-Host "Enabling GitHub Pages..."
# Call API using --field arguments to avoid -f binding conflicts
& $gh api "repos/{owner}/{repo}/pages" --field "build_type=legacy" --field "source[branch]=main" --field "source[path]=/"

Write-Host "Deploy completed successfully!"
