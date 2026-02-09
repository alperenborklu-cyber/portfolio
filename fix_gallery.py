import re

file_path = "c:/Users/Alp/Downloads/new/portfolio-v1/index.html"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Split the content to isolate the gallery section
# We know it starts with <section id="work" ...> and ends with </section>
# But specifically the grid starts with <div class="gallery-grid">

start_marker = '<div class="gallery-grid">'
end_marker = '</section>'

start_idx = content.find(start_marker)
if start_idx == -1:
    print("Could not find gallery-grid")
    exit()

# We need to find the end of the section
end_idx = content.find(end_marker, start_idx)
if end_idx == -1:
    print("Could not find end of section")
    exit()

# Extract the gallery grid content
gallery_content = content[start_idx + len(start_marker):end_idx]

# Helper to extract actual items
# We look for <div class="gallery-item"> ... </div> blocks
# But since they are malformed/nested, we will exact content by Regex
# We want image src, title, subtitle.

items = []
pattern = re.compile(r'<img src="([^"]+)".*?>\s*<div class="overlay">\s*<h3>(.*?)</h3>\s*<p>(.*?)</p>', re.DOTALL)

matches = pattern.findall(gallery_content)

print(f"Found {len(matches)} items")

new_gallery_html = '\n            <div class="gallery-grid">\n'

for src, title, subtitle in matches:
    item_html = f'''                <div class="gallery-item">
                    <img src="{src}" alt="{title}" loading="lazy">
                    <div class="overlay">
                        <h3>{title}</h3>
                        <p>{subtitle}</p>
                    </div>
                </div>
'''
    new_gallery_html += item_html

new_gallery_html += '            </div>\n        '

# Reconstruct the file
# We replace everything from start_marker to just before end_marker (which closes section)
# But wait, the previous code had </div>s for the grid?
# The original file structure had <div class="gallery-grid"> ... </div> </section>
# My extraction included the mess.
# I will replace the messy part with the clean part.

# Find where the gallery section content effectively ends (before </section>)
prefix = content[:start_idx]
suffix = content[end_idx:]

new_content = prefix + new_gallery_html + suffix

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Fixed index.html")
