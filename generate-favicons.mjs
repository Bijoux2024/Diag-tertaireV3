import sharp from 'sharp';
import fs from 'fs/promises';
import pngToIco from 'png-to-ico';

const src = 'favicon-source.png';

async function generate() {
    const sizes = [16, 32, 180, 192, 512];
    const filenames = {
        16: 'favicon-16x16.png',
        32: 'favicon-32x32.png',
        180: 'apple-touch-icon.png',
        192: 'android-chrome-192x192.png',
        512: 'android-chrome-512x512.png'
    };
    
    // Generate PNGs
    for (const size of sizes) {
        await sharp(src)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .toFile(filenames[size]);
        console.log(`Generated ${filenames[size]}`);
    }
    
    // Generate ICO
    const buf = await pngToIco(['favicon-16x16.png', 'favicon-32x32.png']);
    await fs.writeFile('favicon.ico', buf);
    console.log('Generated favicon.ico');

    const manifest = {
      "name": "DiagTertiaire",
      "short_name": "DiagTertiaire",
      "icons": [
        {
          "src": "/android-chrome-192x192.png",
          "sizes": "192x192",
          "type": "image/png"
        },
        {
          "src": "/android-chrome-512x512.png",
          "sizes": "512x512",
          "type": "image/png"
        }
      ],
      "theme_color": "#2563EB",
      "background_color": "#ffffff",
      "display": "standalone"
    };

    await fs.writeFile('site.webmanifest', JSON.stringify(manifest, null, 2));
    console.log('Generated site.webmanifest');
}

generate().catch(console.error);
