import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find gallery items with generic title
# We look for <img src="..."> followed (eventually) by <h3>Artwork</h3>
# This is a bit tricky with regex if not consistent.
# But my generation script was very consistent:
# <div class="gallery-item">
#     <img src="assets/..." ...>
#     <div class="overlay">
#         <h3>Artwork</h3>

pattern = r'<img src="(assets/[^"]+)".*?<h3>Artwork</h3>'
matches = re.findall(pattern, content, re.DOTALL)

for m in matches:
    print(m)
