import os
import re

html_path = 'index.html'
assets_path = 'assets'

with open(html_path, 'r', encoding='utf-8') as f:
    existing_html = f.read()

existing_imgs = set(re.findall(r'src=["\']assets/([^"\']+)["\']', existing_html))
all_files = os.listdir(assets_path)

extensions = ['.png', '.jpg', '.jpeg', '.gif', '.mp4']
skip = ['mezuniyet.jpg', 'deneme1718.mp4'] 

new_html_items = []
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
             new_html_items.append(item)

if new_html_items:
    # Target the closing text of the section
    # Based on the view_file output:
    # 205:             </div>
    # 206:         </section>
    
    # Note: indentation might vary in valid range, so regex is safer.
    # We want to replace the LAST </div> inside the <section id="work" ...> 
    # But simplified string replacement on the known footprint is safer if we are sure of the structure.
    # The file view showed:
    #             </div>
    #         </section>
    
    # Let's construct the replacement string
    added_content = '\n'.join(new_html_items)
    
    # We look for the closing of the gallery-grid div and the section
    # The gallery-grid is the div immediately inside section#work.
    # So we are looking for the closing div of gallery-grid.
    
    pattern = r'(            </div>\s+        </section>)'
    
    match = re.search(pattern, existing_html)
    if match:
        # We insert BEFORE the closing div of the grid
        # The match group 1 is "            </div>\n        </section>"
        # We want to insert before that.
        
        # actually the match is the closing of gallery-grid AND section.
        # So we insert before it.
        
        new_content = existing_html.replace(match.group(1), '\n' + added_content + '\n' + match.group(1))
        
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Successfully appended {len(new_html_items)} images.")
    else:
        print("Could not find insertion point. Checked for indentation.")
else:
    print("No new images to add.")
