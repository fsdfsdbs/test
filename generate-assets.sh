#!/bin/bash

# This script generates placeholder asset files for testing
# Run this script to create dummy files in the assets/ folder

echo "Generating placeholder asset files..."

mkdir -p assets

# Generate placeholder videos (small dummy files)
for video in background hacker_background rain_background anime_background car_background; do
    # Create a tiny MP4 file (1KB placeholder)
    printf '\x00\x00\x00\x00\x66\x74\x79\x70\x69\x73\x6F\x6D' > "assets/${video}.mp4"
    echo "Created assets/${video}.mp4 (placeholder)"
done

# Generate placeholder music files
for music in background_music hacker_music rain_music anime_music car_music; do
    # Create a tiny MP3 file (1KB placeholder)
    printf '\x49\x44\x33\x03\x00\x00\x00\x00\x00\x00' > "assets/${music}.mp3"
    echo "Created assets/${music}.mp3 (placeholder)"
done

# Generate placeholder images
for image in profile developer verified partner owner github discord youtube tiktok twitter python cpp csharp javascript; do
    # Create a tiny PNG file (1KB placeholder)
    printf '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A\x00\x00\x00\x0D\x49\x48\x44\x52' > "assets/${image}.png"
    echo "Created assets/${image}.png (placeholder)"
done

# Generate placeholder GIFs
for gif in profile verified partner owner; do
    # Create a tiny GIF file (1KB placeholder)
    printf 'GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xFF\xFF\xFF\x21\xF9\x04\x01\x00\x00\x00\x00\x2C\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3B' > "assets/${gif}.gif"
    echo "Created assets/${gif}.gif (placeholder)"
done

# Create rain_background.mov (same as MP4 for simplicity)
printf '\x00\x00\x00\x00\x66\x74\x79\x70\x69\x73\x6F\x6D' > "assets/rain_background.mov"
echo "Created assets/rain_background.mov (placeholder)"

echo ""
echo "All placeholder assets generated!"
echo "Note: These are dummy files. Replace them with real assets for full functionality."
