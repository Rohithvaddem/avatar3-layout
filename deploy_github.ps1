$git = "c:\Users\ADMIN\aspirohithpc\mingit\cmd\git.exe"
$gh = "C:\Program Files\GitHub CLI\gh.exe"

Write-Host "Initializing local Git repository..."
& $git init

# Configure local git user if not set
Write-Host "Configuring Git user info..."
& $git config user.name "Aspirealty Staff"
& $git config user.email "info@aspirealty.com"

# Set branch name to main
& $git branch -M main

Write-Host "Staging files..."
& $git add -A

Write-Host "Committing files..."
& $git commit -m "Initial commit of Aspirealty Avatar 3 Interactive Layout"

Write-Host "Creating GitHub repository and pushing files..."
# Create repository on GitHub and push local commits
# --public makes it a public repository
# --source=. specifies local directory
# --push automatically pushes the commits
& $gh repo create avatar3-layout --public --source=. --push

Write-Host "Enabling GitHub Pages..."
# Enable GitHub Pages on main branch root folder
& $gh api repos/{owner}/{repo}/pages -f build_type="legacy" -f source[branch]="main" -f source[path]="/"

Write-Host "Deploy completed successfully!"
