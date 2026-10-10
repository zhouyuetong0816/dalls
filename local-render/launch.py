from pathlib import Path
import os,sys,subprocess
root=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(root.parent/'scripts/assemble-assets.py')],check=True)
free=root/'free'
if not free.exists(): free.symlink_to(root.parent/'docs',target_is_directory=True)
os.chdir(root)
from server import serve
serve()
