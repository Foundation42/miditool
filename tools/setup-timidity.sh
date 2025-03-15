#!/usr/bin/env bash
# Script to set up TiMidity++ with soundfonts on Arch Linux

echo "Setting up TiMidity++ with FluidR3 soundfont..."

# Check if TiMidity is installed
if ! command -v timidity &> /dev/null; then
    echo "TiMidity++ is not installed. Installing..."
    sudo pacman -S --noconfirm timidity++
fi

# Check if soundfont-fluid is installed
if [ ! -f /usr/share/soundfonts/FluidR3_GM.sf2 ]; then
    echo "FluidR3 soundfont not found. Installing..."
    sudo pacman -S --noconfirm soundfont-fluid
fi

# Create TiMidity config directory if it doesn't exist
if [ ! -d ~/.timidity ]; then
    mkdir -p ~/.timidity
fi

# Create TiMidity configuration file
cat << EOF > ~/.timidity/timidity.cfg
# TiMidity++ configuration file

# Use FluidR3 soundfont
soundfont /usr/share/soundfonts/FluidR3_GM.sf2

# Optional: Set default amplification
amp=100
EOF

echo "Configuration created at ~/.timidity/timidity.cfg"

# Create a global config if the user has permission
if [ -w /etc/timidity++ ]; then
    echo "Creating system-wide configuration..."
    sudo mkdir -p /etc/timidity++
    sudo tee /etc/timidity++/timidity.cfg > /dev/null << EOF
# TiMidity++ configuration file

# Use FluidR3 soundfont
soundfont /usr/share/soundfonts/FluidR3_GM.sf2

# Optional: Set default amplification
amp=100
EOF
    echo "System-wide configuration created at /etc/timidity++/timidity.cfg"
fi

echo "✅ TiMidity++ setup complete!"
echo ""
echo "To test the setup, run:"
echo "timidity output/good-midi/piano-scale.mid"