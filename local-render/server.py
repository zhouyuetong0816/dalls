#!/usr/bin/env python3
"""Loopback development server + asynchronous, server-side OpenAI image edits.
No third-party Python packages. The browser never receives the API key.
"""
import argparse
import base64
import hashlib
import json
import os
import re
import struct
import shutil
import subprocess
import tempfile
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urlsplit
from urllib.request import Request, urlopen

from blender_service import BLENDER, validate_scene, render as blender_render
from render_spec import STYLE_VERSION, build_prompt, validate_design

ROOT = Path(__file__).resolve().parent
RUNTIME = ROOT.parent.parent / 'work' / 'plush-runtime'
API_URL = 'https://api.openai.com/v1/images/edits'
MAX_BODY = 40 * 1024 * 1024


def settings(root=ROOT):
    values = {}
    env_file = root / '.env.local'
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            name, value = line.removeprefix('export ').split('=', 1)
            values[name.strip()] = value.strip().strip('"\'')
    key = os.environ.get('OPENAI_API_KEY') or values.get('OPENAI_API_KEY', '')
    model = os.environ.get('OPENAI_IMAGE_MODEL') or values.get('OPENAI_IMAGE_MODEL', 'gpt-image-2')
    if not re.fullmatch(r'gpt-image-[a-zA-Z0-9._-]{1,80}', model):
        model = 'gpt-image-2'
    return key, model


def png_data_url(value):
    if not isinstance(value, str) or not value.startswith('data:image/png;base64,') or len(value) > 12 * 1024 * 1024:
        raise ValueError('需要有效的 PNG 模型或草稿截图')
    try:
        raw = base64.b64decode(value.split(',', 1)[1], validate=True)
        if len(raw) < 33 or not raw.startswith(b'\x89PNG\r\n\x1a\n') or raw[12:16] != b'IHDR':
            raise ValueError()
        w, h = struct.unpack('>II', raw[16:24])
        if not 1 <= w <= 8192 or not 1 <= h <= 8192:
            raise ValueError()
    except (ValueError, struct.error):
        raise ValueError('PNG 截图内容无效')
    return raw


def api_error_message(status, body):
    try:
        detail = json.loads(body).get('error', {})
        code, kind = detail.get('code'), detail.get('type')
    except (ValueError, AttributeError):
        code, kind = None, None
    if status == 429:
        if code == 'credit_balance_exhausted' or kind == 'insufficient_quota' or code == 'insufficient_quota':
            return 'OpenAI API 可用额度不足，请在 API 平台检查余额与用量限制。反复重试不会恢复额度。'
        if code in ('project_spend_limit_exceeded', 'organization_spend_limit_exceeded', 'organization_usage_limit_exceeded'):
            return 'OpenAI API 项目或组织已达到用量上限，请调整对应限额后再生成。'
        return 'OpenAI 请求频率受限，请稍后重试。'
    return {400: '图像服务未接受这次请求，请检查模型与图像设置。',
            401: 'OpenAI 密钥无效，请更新本地连接。',
            403: '当前 OpenAI 项目或网络位置没有此模型的访问权限。',
            404: '当前项目找不到此图像模型，请检查模型访问权限。'}.get(status, 'OpenAI 服务暂不可用，请稍后重试。')


def api_json(url, key, payload=None, timeout=300):
    # curl uses the system TLS/network stack, avoiding the observed Python TLS handshake failure.
    # Authorization travels through stdin only. Large image payloads use a private temporary file.
    curl = shutil.which('curl')
    if curl:
        config = ['url = ' + json.dumps(url), 'header = ' + json.dumps('Authorization: Bearer ' + key),
                  'silent', 'show-error', 'connect-timeout = 15', 'max-time = ' + str(timeout),
                  'write-out = "\\n%{http_code}"']
        body_path = None
        if payload is not None:
            with tempfile.NamedTemporaryFile(mode='w', prefix='plush-request-', suffix='.json', delete=False) as stream:
                json.dump(payload, stream)
                body_path = stream.name
            config.extend(['request = "POST"', 'header = "Content-Type: application/json"',
                           'data-binary = ' + json.dumps('@' + body_path)])
        started = time.monotonic()
        try:
            result = subprocess.run([curl, '--config', '-'], input='\n'.join(config) + '\n',
                                    text=True, capture_output=True, timeout=timeout + 5)
        except (subprocess.TimeoutExpired, OSError):
            raise RuntimeError('OpenAI 连接或生成等待超时，请检查网络后重试。')
        finally:
            if body_path:
                try:
                    os.unlink(body_path)
                except FileNotFoundError:
                    pass
        if result.returncode:
            if result.returncode == 28:
                message = '连接 OpenAI 的 HTTPS 握手超时，请检查本机到 api.openai.com 的网络连接。' if time.monotonic()-started < 25 else 'OpenAI 生成等待超时，暂时无法确认出图结果，请稍后再试。'
            elif result.returncode in (5, 6):
                message = '无法解析 OpenAI 或网络代理地址，请检查网络设置。'
            elif result.returncode == 26:
                message = '本地生成请求读取失败，请检查服务端请求文件。'
            elif result.returncode in (35, 60):
                message = 'OpenAI HTTPS 安全连接失败，请检查系统证书与网络连接。'
            else:
                message = '本机无法连接 OpenAI，请检查网络及本地代理服务。'
            raise RuntimeError(message)
        body, _, status = result.stdout.rpartition('\n')
        if not status.isdigit():
            raise RuntimeError('OpenAI 连接返回了无效响应。')
        if int(status) >= 400:
            raise RuntimeError(api_error_message(int(status), body))
        try:
            return json.loads(body)
        except ValueError:
            raise RuntimeError('OpenAI 服务没有返回有效响应。')
    request = Request(url, data=json.dumps(payload).encode() if payload is not None else None,
                      headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
    try:
        with urlopen(request, timeout=timeout) as response:
            return json.load(response)
    except HTTPError as e:
        raise RuntimeError(api_error_message(e.code, e.read().decode(errors='replace')))
    except (URLError, TimeoutError, OSError):
        raise RuntimeError('OpenAI HTTPS 连接超时或失败，请检查本机网络。')


def openai_edit(payload, key):
    result = api_json(API_URL, key, payload)
    try:
        image = base64.b64decode(result['data'][0]['b64_json'], validate=True)
        if not image.startswith(b'\x89PNG\r\n\x1a\n'):
            raise ValueError()
    except (KeyError, IndexError, TypeError, ValueError):
        raise RuntimeError('图像服务没有返回有效的 PNG 图片。')
    return image


class RenderJobs:
    def __init__(self, root=ROOT, runtime=RUNTIME, transport=openai_edit):
        self.root, self.runtime, self.transport = root, runtime, transport
        self.runtime.mkdir(parents=True, exist_ok=True)
        self.lock = threading.RLock()
        self.executor = ThreadPoolExecutor(max_workers=1)
        self.jobs = {}
        for path in self.runtime.glob('*.json'):
            try:
                job = json.loads(path.read_text())
                if job['status'] in ('queued', 'generating'):
                    job.update(status='failed', error='服务已重启，上次生成状态无法确认。请检查后手动重试。')
                self.jobs[job['id']] = job
            except (ValueError, KeyError):
                pass

    def public(self, job):
        return {k: job[k] for k in ('id', 'status', 'imageUrl', 'error', 'createdAt', 'model') if k in job}

    def save(self, job):
        path = self.runtime / (job['id'] + '.json')
        temp = path.with_suffix('.tmp')
        temp.write_text(json.dumps(job, ensure_ascii=False))
        temp.replace(path)

    def get(self, job_id):
        with self.lock:
            job = self.jobs.get(job_id)
            return self.public(job) if job else None

    def create(self, data):
        design = validate_design(data.get('design'))
        png_data_url(data.get('modelImage'))
        png_data_url(data.get('sketchImage'))
        key, model = settings(self.root)
        if not key:
            raise RuntimeError('还未连接 OpenAI。请在本地 .env.local 配置 OPENAI_API_KEY，保存后刷新页面。')
        reference = self.root / 'assets' / 'plush-style-reference.png'
        if not reference.is_file():
            raise RuntimeError('缺少统一效果图的风格参考图。')
        prompt = build_prompt(design)
        images = [{'image_url': data['modelImage']}, {'image_url': data['sketchImage']},
                  {'image_url': 'data:image/png;base64,' + base64.b64encode(reference.read_bytes()).decode()}]
        fingerprint = hashlib.sha256(json.dumps({'design': design, 'images': images,
            'model': model, 'style': STYLE_VERSION}, sort_keys=True).encode()).hexdigest()
        with self.lock:
            for job in self.jobs.values():
                if job.get('fingerprint') == fingerprint and (job['status'] in ('queued', 'generating') or
                    (job['status'] == 'complete' and not data.get('regenerate') and
                     (self.root / job.get('imageUrl', '').lstrip('/')).is_file())):
                    return self.public(job)
            if sum(j['status'] in ('queued', 'generating') for j in self.jobs.values()) >= 3:
                raise RuntimeError('已有生成任务正在进行，请等完成后再试。')
            job = {'id': uuid.uuid4().hex, 'status': 'queued', 'createdAt': time.time(),
                   'model': model, 'fingerprint': fingerprint}
            self.jobs[job['id']] = job
            self.save(job)
            payload = {'model': model, 'images': images, 'prompt': prompt,
                       'n': 1, 'size': '1024x1024', 'quality': 'high', 'output_format': 'png'}
            self.executor.submit(self.run, job['id'], payload, key, design)
            return self.public(job)

    def create_blender(self, data):
        if not BLENDER.is_file():
            raise RuntimeError('本机未找到 Blender。')
        design = validate_design(data.get('design'))
        scene = validate_scene(data.get('scene'))
        with self.lock:
            if sum(j['status'] in ('queued', 'generating') for j in self.jobs.values()) >= 3:
                raise RuntimeError('已有渲染任务，请稍候。')
            job = {'id': uuid.uuid4().hex, 'status': 'queued', 'createdAt': time.time(), 'model': 'Blender Cycles'}
            self.jobs[job['id']] = job
            self.save(job)
            self.executor.submit(self.run_blender, job['id'], {'scene': scene, 'design': design})
            return self.public(job)

    def run_blender(self, job_id, data):
        with self.lock:
            job = self.jobs[job_id]
            job['status'] = 'generating'
            self.save(job)
        try:
            blender_render(self.root, job_id, data)
            with self.lock:
                job.update(status='complete', imageUrl='/generated/' + job_id + '.png')
        except Exception as e:
            with self.lock:
                job.update(status='failed', error=str(e) if isinstance(e, RuntimeError) else 'Blender 渲染失败，请查看本地日志。')
        finally:
            with self.lock:
                self.save(job)

    def run(self, job_id, payload, key, design):
        with self.lock:
            job = self.jobs[job_id]
            job['status'] = 'generating'
            self.save(job)
        try:
            image = self.transport(payload, key)
            directory = self.root / 'generated'
            directory.mkdir(exist_ok=True)
            target = directory / (job_id + '.png')
            temp = target.with_suffix('.tmp')
            temp.write_bytes(image)
            temp.replace(target)
            (directory / (job_id + '.design.json')).write_text(json.dumps(
                {'design': design, 'prompt': payload['prompt'], 'model': payload['model'],
                 'styleVersion': STYLE_VERSION}, ensure_ascii=False, indent=2))
            with self.lock:
                job.update(status='complete', imageUrl='/generated/' + job_id + '.png')
        except Exception as e:
            with self.lock:
                # Only errors intentionally written for users leave the backend.
                job.update(status='failed', error=str(e) if isinstance(e, RuntimeError) else '生成失败，请稍后重试。')
        finally:
            with self.lock:
                self.save(job)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, root=ROOT, jobs=None, **kwargs):
        self.root, self.jobs = root, jobs
        super().__init__(*args, directory=str(root), **kwargs)

    def local_request(self):
        port = self.server.server_port
        allowed = {'127.0.0.1:' + str(port), 'localhost:' + str(port)}
        if self.headers.get('Host') not in allowed:
            self.send_error(403)
            return False
        origin = self.headers.get('Origin')
        if origin and (urlsplit(origin).scheme != 'http' or urlsplit(origin).netloc not in allowed):
            self.send_error(403)
            return False
        return True

    def reply(self, status, body):
        raw = json.dumps(body, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(raw)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(raw)

    def list_directory(self, path):
        self.send_error(404)
        return None

    def static_allowed(self):
        parts = unquote(urlsplit(self.path).path).split('/')
        return not any(p.startswith('.') or p.endswith(('.py', '.pyc')) for p in parts if p)

    def do_HEAD(self):
        if self.local_request():
            if self.static_allowed():
                super().do_HEAD()
            else:
                self.send_error(404)

    def do_GET(self):
        if not self.local_request():
            return
        path = urlsplit(self.path).path
        if path == '/api/render-config':
            key, model = settings(self.root)
            self.reply(200, {'configured': bool(key), 'model': model, 'styleVersion': STYLE_VERSION,
                             'referenceUrl': '/assets/plush-style-reference.png',
                             'renderMode': 'local', 'blenderAvailable': BLENDER.is_file(), 'customRegions': True})
        elif re.fullmatch('/api/render-jobs/[a-f0-9]{32}', path):
            job = self.jobs.get(path.rsplit('/', 1)[1])
            self.reply(200 if job else 404, job or {'error': '找不到生成任务，请重新生成。'})
        elif path.startswith('/api/'):
            self.reply(404, {'error': '找不到接口'})
        elif not self.static_allowed():
            self.send_error(404)
        else:
            super().do_GET()

    def do_POST(self):
        if not self.local_request():
            return
        if urlsplit(self.path).path == '/api/blender-render':
            try:
                if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
                    raise ValueError('需要 JSON 请求')
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= MAX_BODY:
                    raise ValueError('模型数据过大')
                data = json.loads(self.rfile.read(length))
                self.reply(202, self.jobs.create_blender(data))
            except (ValueError, TypeError, AttributeError) as e:
                self.reply(400, {'error': str(e) if isinstance(e, ValueError) else '模型数据不完整'})
            except RuntimeError as e:
                self.reply(503, {'error': str(e)})
            return
        if urlsplit(self.path).path == '/api/local-render':
            if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
                self.reply(415, {'error': '需要 JSON 请求'})
                return
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= MAX_BODY:
                    raise ValueError('渲染图片过大')
                data = json.loads(self.rfile.read(length))
                image = png_data_url(data.get('image'))
                design = validate_design(data.get('design'))
                directory = self.root / 'generated'
                directory.mkdir(exist_ok=True)
                rid = uuid.uuid4().hex
                (directory / (rid + '.png')).write_bytes(image)
                (directory / (rid + '.design.json')).write_text(json.dumps(
                    {'mode': 'local-3d', 'design': design}, ensure_ascii=False, indent=2))
                self.reply(200, {'id': rid, 'status': 'complete', 'mode': 'local-3d',
                                 'imageUrl': '/generated/' + rid + '.png'})
            except (ValueError, TypeError, AttributeError):
                self.reply(400, {'error': '渲染图片或玩偶设置无效'})
            except OSError:
                self.reply(500, {'error': '无法保存渲染图片，请检查本地目录权限。'})
            return
        if urlsplit(self.path).path == '/api/check-connection':
            key, model = settings(self.root)
            if not key:
                self.reply(503, {'error': '请先保存 OpenAI API 密钥。'})
                return
            try:
                api_json('https://api.openai.com/v1/models/' + model, key, timeout=25)
                self.reply(200, {'configured': True, 'model': model, 'verified': True})
            except RuntimeError as e:
                self.reply(503, {'error': str(e)})
            return
        if urlsplit(self.path).path == '/api/local-connection':
            if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
                self.reply(415, {'error': '需要 JSON 请求'})
                return
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 4096:
                    raise ValueError('连接信息无效')
                body = json.loads(self.rfile.read(length))
                key = body.get('apiKey', '').strip()
                if not re.fullmatch(r'sk-[A-Za-z0-9_-]{16,512}', key):
                    raise ValueError('请填入完整的 OpenAI API 密钥')
                _, model = settings(self.root)
                target = self.root / '.env.local'
                temporary = self.root / ('.env-save-' + uuid.uuid4().hex)
                try:
                    fd = os.open(str(temporary), os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
                    with os.fdopen(fd, 'w') as stream:
                        stream.write('OPENAI_API_KEY=' + key + '\nOPENAI_IMAGE_MODEL=' + model + '\n')
                    temporary.replace(target)
                finally:
                    if temporary.exists():
                        temporary.unlink()
                self.reply(200, {'configured': True, 'model': model})
            except (ValueError, TypeError, AttributeError):
                self.reply(400, {'error': '请填入完整的 OpenAI API 密钥'})
            except OSError:
                self.reply(500, {'error': '本地连接信息无法保存，请检查目录权限。'})
            return
        if urlsplit(self.path).path != '/api/final-render':
            self.reply(404, {'error': '找不到接口'})
            return
        if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
            self.reply(415, {'error': '需要 JSON 请求'})
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= MAX_BODY:
                self.reply(413, {'error': '模型截图过大'})
                return
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise ValueError('无效请求')
            job = self.jobs.create(data)
            self.reply(202, job)
        except (ValueError, TypeError, AttributeError) as e:
            self.reply(400, {'error': str(e) if isinstance(e, ValueError) else '玩偶设置不完整'})
        except RuntimeError as e:
            self.reply(503, {'error': str(e)})
        except OSError:
            self.reply(500, {'error': '本地生成服务无法保存任务，请检查目录权限。'})

    def log_message(self, fmt, *args):
        # Never log request bodies or configuration values.
        print('[studio] ' + fmt % args)


def serve(port=5173):
    jobs = RenderJobs()
    server = ThreadingHTTPServer(('127.0.0.1', port), partial(Handler, root=ROOT, jobs=jobs))
    print('Soft things: http://127.0.0.1:' + str(port), flush=True)
    print('OpenAI image service: ' + ('configured' if settings()[0] else 'not configured'), flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        jobs.executor.shutdown(wait=False)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=5173)
    serve(parser.parse_args().port)
