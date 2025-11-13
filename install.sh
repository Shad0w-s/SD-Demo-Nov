#!/bin/bash

# Installation script for SD-Demo-Nov project
# This script installs all dependencies needed for the project

set -e

echo "🚀 Starting installation process for SD-Demo-Nov project..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check and install Git
echo "📦 Checking Git..."
if command_exists git; then
    echo -e "${GREEN}✓ Git is already installed: $(git --version)${NC}"
else
    echo -e "${YELLOW}⚠ Git not found. Please install Xcode Command Line Tools first.${NC}"
    echo "Run: xcode-select --install"
    exit 1
fi

# Check Xcode CLI Tools
echo ""
echo "📦 Checking Xcode Command Line Tools..."
if xcode-select -p &>/dev/null; then
    echo -e "${GREEN}✓ Xcode Command Line Tools are installed${NC}"
else
    echo -e "${YELLOW}⚠ Xcode Command Line Tools not found.${NC}"
    echo "Please run: xcode-select --install"
    echo "A dialog will appear - follow the prompts to install."
    exit 1
fi

# Check and install Homebrew
echo ""
echo "📦 Checking Homebrew..."
if command_exists brew; then
    echo -e "${GREEN}✓ Homebrew is already installed${NC}"
    brew update
else
    echo -e "${YELLOW}⚠ Homebrew not found. Installing...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for Apple Silicon Macs
    if [ -f "/opt/homebrew/bin/brew" ]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
fi

# Check and install Node.js
echo ""
echo "📦 Checking Node.js..."
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js is already installed: $NODE_VERSION${NC}"
else
    echo -e "${YELLOW}⚠ Node.js not found. Installing via Homebrew...${NC}"
    brew install node
fi

# Check Node.js version (should be 18+)
NODE_MAJOR_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠ Node.js version is less than 18. Consider upgrading.${NC}"
fi

# Check and install Python
echo ""
echo "📦 Checking Python..."
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ Python is already installed: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}✗ Python 3 not found. Please install Python 3.9 or higher.${NC}"
    echo "You can install it via: brew install python@3.11"
    exit 1
fi

# Install Python dependencies
echo ""
echo "📦 Installing Python dependencies..."
cd "$(dirname "$0")/backend"

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment and installing packages..."
source venv/bin/activate
pip install --upgrade pip --quiet
pip install -r requirements.txt

echo -e "${GREEN}✓ Python dependencies installed${NC}"

# Install Node.js dependencies
echo ""
echo "📦 Installing Node.js dependencies..."
cd "$(dirname "$0")"
npm install

echo -e "${GREEN}✓ Node.js dependencies installed${NC}"

# Summary
echo ""
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo "Summary:"
echo "  ✓ Git: $(git --version | cut -d' ' -f3)"
echo "  ✓ Node.js: $(node --version)"
echo "  ✓ npm: $(npm --version)"
echo "  ✓ Python: $(python3 --version | cut -d' ' -f2)"
echo ""
echo "You can now start the project with:"
echo "  npm run dev:all    # Start both frontend and backend"
echo "  npm run dev:frontend    # Start only frontend"
echo "  npm run dev:backend     # Start only backend"

