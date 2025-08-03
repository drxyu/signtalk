#!/bin/bash

# Script to help download and organize ASL images
# Note: You'll need to download datasets manually from the sources listed

echo "ASL Image Setup Helper"
echo "====================="

# Create directory structure
echo "Creating directory structure..."

SIGNS=("hello" "goodbye" "yes" "no" "thankyou" "please" "sorry" "stop" "good" "bad" "help" "what" "yourewelcome")

for sign in "${SIGNS[@]}"; do
    mkdir -p "public/images/asl-signs/$sign"
done

echo "✅ Directory structure created"
echo ""
echo "Next Steps:"
echo "==========="
echo ""
echo "1. Download ASL image datasets from:"
echo "   - Mendeley: https://data.mendeley.com/datasets/48dg9vhmyk/2"
echo "   - IEEE: https://ieee-dataport.org/documents/american-sign-language-dataset-semantic-communications"
echo "   - Figshare: https://figshare.com/articles/dataset/Hand_Gestures_Dataset/24449197"
echo ""
echo "2. Extract and organize images:"
echo "   - Look for images showing hands at different angles"
echo "   - Find images with various finger positions"
echo "   - Select 3-5 frames per sign for animation"
echo ""
echo "3. Place images in the corresponding folders:"
for sign in "${SIGNS[@]}"; do
    echo "   - public/images/asl-signs/$sign/"
done
echo ""
echo "4. Name images as: position1.png, position2.png, etc."
echo ""
echo "For 3D models:"
echo "============="
echo "1. Visit https://sketchfab.com/tags/asl"
echo "2. Download GLB models"
echo "3. Place in public/models/asl-hands/"
echo ""
echo "Alternative: Use online ASL dictionaries to take screenshots"
echo "- ASL University: https://www.lifeprint.com/dictionary.htm"
echo "- Signing Savvy: https://www.signingsavvy.com/"