import http.server
import socketserver
import os
import json
import re
from urllib.parse import unquote, urlparse

PORT = 8000
DIRECTORY = '.'

class PortfolioHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path == '/delete-image':
            content_len = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_len)
            data = json.loads(post_body.decode('utf-8'))
            image_src = data.get('src')
            
            if image_src:
                # 1. Delete the file
                file_path = os.path.join(DIRECTORY, image_src.replace('/', os.sep))
                try:
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        print(f"Deleted file: {file_path}")
                    else:
                        print(f"File not found: {file_path}")
                except Exception as e:
                    print(f"Error deleting file: {e}")
                    self.send_error(500, f"Error deleting file: {e}")
                    return

                # 2. Update index.html to remove the gallery item
                try:
                    with open('index.html', 'r', encoding='utf-8') as f:
                        html_content = f.read()
                    
                    # Regex to find the gallery item containing this image
                    # Looking for <div class="gallery-item">...<img src="IMAGE_SRC"...</div>
                    # This is simple regex, might need robustness
                    # We escape the src for regex
                    src_escaped = re.escape(image_src)
                    
                    # Pattern: match <div class="gallery-item"> inside whitespace, then content including img src, then closing div
                    # This relies on standard formatting. 
                    pattern = r'<div class="gallery-item">\s*<img src="' + src_escaped + r'"[\s\S]*?</div>\s*</div>'
                    
                    # Simpler approach: Read file lines and remove the block? 
                    # Or regex? regex is risky with nested divs, but gallery-items are usually flat.
                    # Let's try a robust regex for the specific structure we generated.
                    
                    # Our structure:
                    # <div class="gallery-item">
                    #     <img src="assets/..." ...>
                    #     <div class="overlay">...</div>
                    # </div>
                    
                    pattern = r'\s*<div class="gallery-item">\s*<img src="' + src_escaped + r'"[\s\S]*?</div>\s*'
                    
                    if re.search(pattern, html_content):
                        new_html = re.sub(pattern, '\n', html_content, count=1)
                        with open('index.html', 'w', encoding='utf-8') as f:
                            f.write(new_html)
                        print(f"Removed HTML for: {image_src}")
                    else:
                        print(f"HTML block not found for {image_src}")

                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'status': 'success'}).encode('utf-8'))
                except Exception as e:
                    print(f"Error updating HTML: {e}")
                    self.send_error(500, f"Error updating HTML: {e}")
            else:
                self.send_error(400, "Missing src")

        elif parsed_path.path == '/update-title':
            content_len = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_len)
            data = json.loads(post_body.decode('utf-8'))
            image_src = data.get('src')
            new_title = data.get('title')
            new_subtitle = data.get('subtitle')

            if image_src:
                try:
                    with open('index.html', 'r', encoding='utf-8') as f:
                        html_content = f.read()
                    
                    # We need to find the block for this image and replace h3 and p
                    src_escaped = re.escape(image_src)
                    
                    # Regex to capture the block
                    # Regex to capture the block
                    # Robust pattern:
                    # 1. Match start of gallery item up to overlay start
                    # 2. Match h3 tag (allowing attributes) and its content (allowing newlines)
                    # 3. Match whitespace/newlines between h3 and p
                    # 4. Match p tag (allowing attributes) and its content (allowing newlines)
                    
                    pattern_block = r'(<div class="gallery-item">\s*<img src="' + src_escaped + r'"[\s\S]*?<div class="overlay">\s*)(<h3[\s\S]*?>[\s\S]*?</h3>)(\s*)(<p[\s\S]*?>[\s\S]*?</p>)'
                    
                    match = re.search(pattern_block, html_content)
                    if match:
                        # Construct new block parts
                        # match.group(1) is start up to h3 start
                        # match.group(2) is complete h3 block
                        # match.group(3) is separating whitespace
                        # match.group(4) is complete p block
                        
                        new_h3 = f"<h3>{new_title}</h3>"
                        new_p = f"<p>{new_subtitle}</p>"
                        
                        # Replace
                        # We use a lambda to replace carefully
                        def replace_func(m):
                             return f"{m.group(1)}{new_h3}{m.group(3)}{new_p}"
                        
                        new_html = re.sub(pattern_block, replace_func, html_content, count=1)
                        
                        with open('index.html', 'w', encoding='utf-8') as f:
                            f.write(new_html)
                        print(f"Updated titles for: {image_src}")
                        
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({'status': 'success'}).encode('utf-8'))
                    else:
                        print(f"HTML block not found for update: {image_src}")
                        self.send_error(404, "Item not found")
                except Exception as e:
                    print(f"Error updating HTML: {e}")
                    self.send_error(500, f"Error updating HTML: {e}")
            else:
                self.send_error(400, "Missing data")
        else:
            self.send_error(404)

if __name__ == "__main__":
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), PortfolioHandler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        print("To stop the server, press Ctrl+C")
        httpd.serve_forever()
