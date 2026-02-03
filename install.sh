#!/usr/bin/env bash
set -euo pipefail

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║                         Clawearn CLI Installer                           ║
# ╚══════════════════════════════════════════════════════════════════════════╝

REPO_URL="https://github.com/stonega/clawearn.git"
INSTALL_DIR="${CLAWEARN_INSTALL_DIR:-$HOME/.clawearn}"
BIN_DIR="${CLAWEARN_BIN_DIR:-$HOME/.local/bin}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Cleanup on interrupt
cleanup() {
    exit_code=$?
    if [ $exit_code -ne 0 ]; then
        echo -e "\n${YELLOW}⚠  Installation interrupted or failed.${NC}"
    fi
    # Remove temp files if any (we might define a temp dir later)
    if [ -n "${TEMP_DIR:-}" ] && [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
    exit $exit_code
}

trap cleanup INT TERM EXIT

# Print functions
print_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                                                                  ║"
    echo "║    ███╗   ███╗ ██████╗ ██╗  ████████╗███████╗ █████╗ ██████╗ ███╗ ║"
    echo "║    ████╗ ████║██╔═══██╗██║  ╚══██╔══╝██╔════╝██╔══██╗██╔══██╗████╗║"
    echo "║    ██╔████╔██║██║   ██║██║     ██║   █████╗  ███████║██████╔╝██╔██║"
    echo "║    ██║╚██╔╝██║██║   ██║██║     ██║   ██╔══╝  ██╔══██║██╔══██╗██║╚█║"
    echo "║    ██║ ╚═╝ ██║╚██████╔╝███████╗██║   ███████╗██║  ██║██║  ██║██║ ╚║"
    echo "║    ╚═╝     ╚═╝ ╚═════╝ ╚══════╝╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ║"
    echo "║                                                                  ║"
    echo "║          Prediction Market Trading CLI for AI Agents             ║"
    echo "║                                                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

info() {
    echo -e "${BLUE}ℹ${NC}  $1"
}

success() {
    echo -e "${GREEN}✓${NC}  $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

error() {
    echo -e "${RED}✗${NC}  $1"
    exit 1
}

step() {
    echo -e "\n${MAGENTA}▸${NC} ${BOLD}$1${NC}"
}

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)     OS="linux";;
        Darwin*)    OS="darwin";;
        MINGW*|MSYS*|CYGWIN*) OS="windows";;
        *)          OS="unknown";;
    esac
    echo "$OS"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Robust downloader that handles snap curl issues
downloader() {
    local url="$1"
    local output_file="$2"

    # Check if we have a broken snap curl
    # https://github.com/boukendesho/curl-snap/issues/1
    local snap_curl=0
    if command_exists curl; then
        local curl_path
        curl_path=$(command -v curl)
        if [[ "$curl_path" == *"/snap/"* ]]; then
            snap_curl=1
        fi
    fi

    # Check if we have a working (non-snap) curl
    if command_exists curl && [[ $snap_curl -eq 0 ]]; then
        curl -fsSL "$url" -o "$output_file"
    # Try wget for both no curl and the broken snap curl
    elif command_exists wget; then
        wget -qO "$output_file" "$url"
    # If we can't fall back from broken snap curl to wget, report the broken snap curl
    elif [[ $snap_curl -eq 1 ]]; then
        error "curl installed with snap cannot download files due to missing permissions. Please uninstall it and reinstall curl with a different package manager (e.g., apt). See https://github.com/boukendesho/curl-snap/issues/1"
    else
        error "Neither curl nor wget found. Please install one of them."
    fi
}

# Check for Bun
check_bun() {
    step "Checking for Bun runtime..."
    
    if command_exists bun; then
        local bun_version
        bun_version=$(bun --version 2>/dev/null || echo "unknown")
        success "Bun is installed (v${bun_version})"
    else
        error "Bun is required but not installed. Please install Bun first: https://bun.sh"
    fi
}

# Clone or update repository
setup_repo() {
    step "Setting up Moltearn CLI..."
    
    if [ -d "$INSTALL_DIR" ]; then
        info "Existing clawearn installation found at $INSTALL_DIR. Updating..."
        cd "$INSTALL_DIR"
        if [ -d ".git" ]; then
            git pull --quiet origin main 2>/dev/null || warn "Could not update from git"
        else
            git clone --quiet --depth 1 "$REPO_URL" "$INSTALL_DIR" 2>/dev/null || {
                error "Failed to clone repository. Check your internet connection."
            }
        fi
    else
        info "Cloning repository..."
        git clone --quiet --depth 1 "$REPO_URL" "$INSTALL_DIR" 2>/dev/null || {
            error "Failed to clone repository. Check your internet connection."
        }
        cd "$INSTALL_DIR"
    fi
    
    success "Repository ready at $INSTALL_DIR"
}

# Install dependencies
install_deps() {
    step "Installing dependencies..."
    
    cd "$INSTALL_DIR"
    bun install --silent 2>/dev/null || bun install
    
    success "Dependencies installed"
}

# Create symlink
create_symlink() {
    step "Creating executable symlink..."
    
    # Create bin directory if it doesn't exist
    mkdir -p "$BIN_DIR"
    
    # Create wrapper script
    local wrapper="$BIN_DIR/clawearn"
    
    cat > "$wrapper" << EOF
#!/usr/bin/env bash
exec bun run "$INSTALL_DIR/src/cli/index.ts" "\$@"
EOF
    
    chmod +x "$wrapper"
    success "Created executable at $wrapper"
}

# Update shell config
update_path() {
    step "Configuring PATH..."
    
    local shell_config=""
    local path_export="export PATH=\"\$PATH:$BIN_DIR\""
    
    # Detect shell config file
    if [ -n "${ZSH_VERSION:-}" ] || [ -f "$HOME/.zshrc" ]; then
        shell_config="$HOME/.zshrc"
    elif [ -n "${BASH_VERSION:-}" ] || [ -f "$HOME/.bashrc" ]; then
        shell_config="$HOME/.bashrc"
    elif [ -f "$HOME/.profile" ]; then
        shell_config="$HOME/.profile"
    fi
    
    # Also check for bun in path
    local bun_export='export BUN_INSTALL="$HOME/.bun"'
    local bun_path='export PATH="$BUN_INSTALL/bin:$PATH"'
    
    if [ -n "$shell_config" ]; then
        # Add clawearn to PATH if not already present
        if ! grep -q "$BIN_DIR" "$shell_config" 2>/dev/null; then
            echo "" >> "$shell_config"
            echo "# Moltearn CLI" >> "$shell_config"
            echo "$path_export" >> "$shell_config"
            info "Added $BIN_DIR to PATH in $shell_config"
        fi
        
        # Ensure bun is in PATH
        if ! grep -q 'BUN_INSTALL' "$shell_config" 2>/dev/null; then
            echo "" >> "$shell_config"
            echo "# Bun" >> "$shell_config"
            echo "$bun_export" >> "$shell_config"
            echo "$bun_path" >> "$shell_config"
        fi
        
        success "Shell configuration updated"
    else
        warn "Could not detect shell config file"
        info "Add the following to your shell config:"
        echo "    $path_export"
    fi
    
    # Update current session
    export PATH="$PATH:$BIN_DIR"
}

# Print success message
print_success() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                   Installation Complete! 🎉                      ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${BOLD}Quick Start:${NC}"
    echo ""
    echo -e "    ${CYAN}1.${NC} Restart your terminal or run:"
    echo -e "       ${YELLOW}source ~/.bashrc${NC}  or  ${YELLOW}source ~/.zshrc${NC}"
    echo ""
    echo -e "    ${CYAN}2.${NC} Initialize your wallet:"
    echo -e "       ${YELLOW}clawearn wallet create${NC}"
    echo ""
    echo -e "    ${CYAN}3.${NC} Check wallet balance:"
    echo -e "       ${YELLOW}clawearn wallet balance${NC}"
    echo ""
    echo -e "    ${CYAN}4.${NC} Start trading on Polymarket:"
    echo -e "       ${YELLOW}clawearn polymarket buy <market-id> <outcome> <amount>${NC}"
    echo ""
    echo -e "  ${BOLD}Useful Commands:${NC}"
    echo -e "    ${YELLOW}clawearn --help${NC}               Show all commands"
    echo -e "    ${YELLOW}clawearn wallet balance${NC}       Check your balances"
    echo -e "    ${YELLOW}clawearn polymarket search${NC}    Search prediction markets"
    echo ""
    echo -e "  ${BOLD}Documentation:${NC}"
    echo -e "    ${BLUE}https://github.com/stonega/clawearn${NC}"
    echo ""
}

# Uninstall function
uninstall() {
    step "Uninstalling Moltearn CLI..."
    
    # Remove installation directory
    if [ -d "$INSTALL_DIR" ]; then
        rm -rf "$INSTALL_DIR"
        success "Removed $INSTALL_DIR"
    fi
    
    # Remove symlink
    if [ -f "$BIN_DIR/clawearn" ]; then
        rm -f "$BIN_DIR/clawearn"
        success "Removed $BIN_DIR/clawearn"
    fi
    
    echo ""
    success "Moltearn CLI has been uninstalled"
    info "You may want to remove the PATH entry from your shell config"
}

# Main installation
main() {
    print_banner
    
    # Check for uninstall flag
    if [ "${1:-}" = "--uninstall" ] || [ "${1:-}" = "-u" ]; then
        uninstall
        exit 0
    fi
    
    # Check for help flag
    if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
        echo "Moltearn CLI Installer"
        echo ""
        echo "Usage: ./install.sh [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  -h, --help        Show this help message"
        echo "  -u, --uninstall   Uninstall Moltearn CLI"
        echo ""
        echo "Environment Variables:"
        echo "  CLAW_EARN_INSTALL_DIR    Installation directory (default: ~/.clawearn)"
        echo "  CLAW_EARN_BIN_DIR        Binary directory (default: ~/.local/bin)"
        exit 0
    fi
    
    local os
    os=$(detect_os)
    info "Detected OS: $os"
    
    # Check for git
    if ! command_exists git; then
        error "Git is required but not installed. Please install git first."
    fi
    
    check_bun
    setup_repo
    install_deps
    create_symlink
    update_path
    print_success
}

# Run main
main "$@"
