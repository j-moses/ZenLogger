const sharp = require('sharp');
const fs = require('fs');

async function generate() {
  console.log('Generating PNG assets from SVGs...');
  
  // Generate Icon
  await sharp('assets/icon.svg')
    .resize(1024, 1024)
    .png()
    .toFile('assets/icon.png');
  console.log('✓ assets/icon.png created');

  // Generate Splash
  await sharp('assets/icon.svg')
    .resize(2732, 2732)
    .extend({
        top: 854, bottom: 854, left: 854, right: 854,
        background: '#1a1a1a'
    })
    .png()
    .toFile('assets/splash.png');
  console.log('✓ assets/splash.png created');
  
  console.log('Done! You can now run: npx @capacitor/assets generate --android');
}

generate().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
