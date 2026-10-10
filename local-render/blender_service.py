import json, math, subprocess, tempfile, os, shutil
from pathlib import Path
BLENDER=Path(os.environ.get('BLENDER_BIN') or shutil.which('blender') or '/Applications/Blender.app/Contents/MacOS/Blender')
def validate_scene(scene):
    if not isinstance(scene,dict) or scene.get('version')!=1 or not isinstance(scene.get('meshes'),list) or not 1<=len(scene['meshes'])<=400:raise ValueError('模型数据无效')
    total=0
    for item in scene['meshes']:
        p=item.get('positions');idx=item.get('indices');uv=item.get('uv')
        if not isinstance(p,list) or not p or len(p)%3 or any(type(v) not in (float,int) or not math.isfinite(v) or abs(v)>50 for v in p):raise ValueError('模型坐标无效')
        total+=len(p)
        if total>3000000:raise ValueError('模型过大')
        if idx is not None and (not isinstance(idx,list) or len(idx)%3 or any(type(v)!=int or v<0 or v>=len(p)//3 for v in idx)):raise ValueError('模型索引无效')
        if uv is not None and (len(uv)!=len(p)//3*2 or any(type(v) not in (float,int) or not math.isfinite(v) for v in uv)):raise ValueError('贴图坐标无效')
        import re
        if not re.fullmatch('#[0-9a-fA-F]{6}',item.get('color','')):raise ValueError('模型颜色无效')
        if item.get('texture') and not item['texture'].startswith('data:image/png;base64,'):raise ValueError('贴图格式无效')
    return scene

def render(root,job_id,data):
    target=root/'generated'/(job_id+'.png');target.parent.mkdir(exist_ok=True)
    target.with_suffix('.scene.json').write_text(json.dumps(data,ensure_ascii=False))
    with tempfile.TemporaryDirectory(prefix='plush-blender-') as tmp:
        source=Path(tmp)/'scene.json';source.write_text(json.dumps(data,ensure_ascii=False))
        with (target.with_suffix('.render.log')).open('w') as log:
            result=subprocess.run([str(BLENDER),'-b','-t','6','--python',str(root/'blender_render.py'),'--',str(source),str(target)],stdout=log,stderr=subprocess.STDOUT,timeout=1800)
        if result.returncode or not target.is_file():
            log_text=target.with_suffix('.render.log').read_text()
            if result.returncode in (-11,139) and 'Writing:' in log_text:
                raise RuntimeError('Blender 启动时无法访问图形设备。请双击项目的 start.command，在普通终端启动服务后重试。')
            raise RuntimeError('Blender 渲染未完成，请查看本地渲染日志。')
    target.with_suffix('.design.json').write_text(json.dumps({'mode':'blender-cycles','design':data['design']},ensure_ascii=False,indent=2))
