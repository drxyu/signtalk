# ASL Hand Gesture Resources

## Free Image Datasets (2D)

### 1. **Mendeley ASL Dataset** (Recommended)
- **URL**: https://data.mendeley.com/datasets/48dg9vhmyk/2
- **Size**: 210,000 images
- **Classes**: 28 (A-Z, Delete, Space)
- **Features**: Multiple angles, different backgrounds
- **Updated**: December 2024
- **Format**: PNG/JPG images

### 2. **IEEE DataPort ASL Dataset**
- **URL**: https://ieee-dataport.org/documents/american-sign-language-dataset-semantic-communications
- **Size**: 440 training + 75 test images per letter
- **Features**: Color-coded fingers, RGB images
- **Published**: January 2025
- **Note**: Static images only (no J or Z)

### 3. **Hand Gestures Dataset (Figshare)**
- **URL**: https://figshare.com/articles/dataset/Hand_Gestures_Dataset/24449197
- **Signs**: Hello, Bye, Yes, No, Perfect, Thank You
- **Size**: 400 images per category
- **Format**: JPG/PNG

## 3D Models

### 1. **Sketchfab ASL Models**
- **URL**: https://sketchfab.com/tags/asl
- **Format**: GLB (downloadable)
- **Features**: Animated ASL alphabet
- **License**: Check individual models

### 2. **IconScout ASL 3D Icons**
- **URL**: https://iconscout.com/3d-illustration-pack/gestures-american-sign-language-asl
- **Count**: 39 ASL gesture icons
- **Formats**: PNG, BLEND, FBX, glTF
- **Price**: Free tier available

### 3. **CGTrader ASL Models**
- **URL**: https://www.cgtrader.com/3d-models/asl
- **Formats**: FBX, OBJ, MAX, 3DS
- **Note**: Filter for free models

## Implementation Suggestions

### For Quick MVP (15-30 minutes):
1. Download hand gesture images from Mendeley or IEEE datasets
2. Extract images for your 10-15 core signs
3. Resize/crop to consistent dimensions
4. Place in `/frontend/public/images/asl-signs/`

### For Better Quality (2-4 hours):
1. Use multiple angles from datasets
2. Create sprite sheets for smooth transitions
3. Implement frame-based animation
4. Add proper hand orientations

### For 3D Implementation (4-8 hours):
1. Download GLB models from Sketchfab
2. Use Three.js GLTFLoader
3. Implement hand pose interpolation
4. Add proper lighting and camera angles

## Quick Start Steps:

1. **Download Images**:
   ```bash
   # Create directories
   mkdir -p frontend/public/images/asl-signs/{hello,yes,no,thanks,please,stop,good,bad,help,what}
   
   # Download and organize images by sign
   ```

2. **Implement Sprite Animation**:
   ```javascript
   // Use multiple images per sign
   const signFrames = {
     'hello': ['/images/asl-signs/hello/frame1.png', '/images/asl-signs/hello/frame2.png', ...],
     'yes': ['/images/asl-signs/yes/frame1.png', '/images/asl-signs/yes/frame2.png', ...],
     // etc.
   };
   ```

3. **Update Component**:
   - Replace SVG with actual images
   - Implement frame-based animation
   - Add proper timing for each sign

## License Notes:
- Most academic datasets are free for educational/research use
- Check individual licenses for commercial use
- Attribution may be required for some datasets