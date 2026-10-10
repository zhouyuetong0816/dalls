"""Reassemble verified public assets split for bounded GitHub uploads."""
from pathlib import Path
import json,hashlib,base64
root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/'asset-manifest.json').read_text())
for item in manifest:
 target=(root/item['target']).resolve()
 target.relative_to((root/'docs').resolve())
 if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest()==item['sha256']:continue
 chunks=[]
 for part in item['parts']:
  path=(root/part['path']).resolve();path.relative_to((root/'asset-parts').resolve())
  data=base64.b64decode(path.read_text().strip(),validate=True)
  assert hashlib.sha256(data).hexdigest()==part['sha256'],part['path']
  chunks.append(data)
 data=b''.join(chunks)
 assert len(data)==item['size'] and hashlib.sha256(data).hexdigest()==item['sha256'],item['target']
 target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
print('PASS: public assets reconstructed with verified SHA-256 checksums.')
