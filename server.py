import http.server
import urllib.request
import json
import re

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/fuel':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            try:
                req = urllib.request.Request(
                    'https://search.naver.com/search.naver?query=%EC%A0%84%EA%B5%AD%EC%A3%BC%EC%9C%A0%EC%86%8C%ED%8F%89%EA%B7%A0%EA%B0%80',
                    headers={'User-Agent': 'Mozilla/5.0'}
                )
                with urllib.request.urlopen(req) as response:
                    html = response.read().decode('utf-8')
                    gas = re.search(r'\|\s*휘발유\s*\|\s*([\d,.]+)', html).group(1)
                    prem = re.search(r'\|\s*고급휘발유\s*\|\s*([\d,.]+)', html).group(1)
                    dies = re.search(r'\|\s*경유\s*\|\s*([\d,.]+)', html).group(1)
                    
                    data = {
                        'gasoline': int(gas.replace(',', '').split('.')[0]),
                        'premium': int(prem.replace(',', '').split('.')[0]),
                        'diesel': int(dies.replace(',', '').split('.')[0])
                    }
                    self.wfile.write(json.dumps(data).encode('utf-8'))
            except Exception as e:
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return
        
        return super().do_GET()

if __name__ == '__main__':
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    http.server.test(HandlerClass=Handler, port=port)
