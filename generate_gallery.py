import os
import re

html_path = 'index.html'
assets_path = 'assets'

with open(html_path, 'r', encoding='utf-8') as f:
    existing_html = f.read()

# Find existing images in assets folder referenced in HTML
existing_imgs = set(re.findall(r'src=["\']assets/([^"\']+)["\']', existing_html))
all_files = os.listdir(assets_path)

extensions = ['.png', '.jpg', '.jpeg', '.gif', '.mp4']
# Skip specific files that are not gallery items
skip = ['mezuniyet.jpg', 'deneme1718.mp4'] 

new_html = []
for f in all_files:
    if any(f.lower().endswith(ext) for ext in extensions):
        if f not in existing_imgs and f not in skip and not f.endswith('zip'):
             item = f'''
                <div class="gallery-item">
                    <img src="assets/{f}" alt="Artwork" loading="lazy">
                    <div class="overlay">
                        <h3>Artwork</h3>
                        <p>Digital Art</p>
                    </div>
                </div>'''
             new_html.append(item)

print('\n'.join(new_html))
