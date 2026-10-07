#!/usr/bin/env python3
"""kid-coder 沙箱执行器：跑小朋友的 Python，产出结构化 JSON（base64 单行）。

用法:  kidrunner.py <source_file>
stdout 输出: 一行 base64(JSON)。JSON 字段:
  ok      bool     进程是否在时限内正常退出
  timeout bool     是否超时（python 侧看门狗触发）
  code    int      进程退出码
  dur_ms  int      运行毫秒
  stdout  str      小朋友程序捕获到的 stdout
  stderr  str      捕获到 stderr（截断）
  svg     data URI turtle 图形（若画过），否则 ""
  png     data URI matplotlib 图形（若可用且画过），否则 ""
  err     str      运行前/解释阶段错误（如语法错误）
"""
import sys, os, json, base64, time, io, contextlib, traceback, threading, select

# ---------- 注入无 GUI 海龟 ----------
_dir = os.path.dirname(os.path.abspath(__file__))
if _dir not in sys.path:
    sys.path.insert(0, _dir)
import kidturtle            # noqa: E402
sys.modules['turtle'] = kidturtle
sys.modules['turtle']._G.clear()


def main():
    src_file = sys.argv[1]
    with open(src_file, 'r', encoding='utf-8') as f:
        src = f.read()

    started = time.time()
    out = io.StringIO()
    result = {'ok': False, 'timeout': False, 'code': 1, 'dur_ms': 0,
              'stdout': '', 'stderr': '', 'svg': '', 'png': '', 'err': ''}

    spec = {'source': src[:2000], 'limit': 2000}

    # python 侧看门狗：默认 8s 硬超时；可用第 2 个参数覆盖
    DEADLINE = float(sys.argv[2]) if len(sys.argv) > 2 else 8.0

    def _timeout_exit(out):
        result['timeout'] = True
        result['dur_ms'] = int((time.time() - started) * 1000)
        result['stdout'] = out.getvalue()[:4000]
        result['stderr'] = (result['stderr'] + '\n[超时] 程序跑太久了，已帮你叫停（8 秒上限）。').strip()
        result['ok'] = False
        # 用 os.write 直写 fd1，绕过 sys.stdout 缓冲（os._exit 不 flush）；统一输出 base64(JSON)
        try:
            payload = base64.b64encode(json.dumps(result, ensure_ascii=True).encode('utf-8')).decode('ascii')
            os.write(1, (payload + '\n').encode('ascii'))
        finally:
            os._exit(42)

    timer = threading.Timer(DEADLINE, _timeout_exit, args=(out,))
    timer.daemon = True

    try:
        timer.start()
        # 编译期错误（语法错误）单独捕获
        try:
            code_obj = compile(src, '<kid-code>', 'exec')
        except SyntaxError as e:
            result['err'] = traceback.format_exc(limit=3)
            result['ok'] = False
            result['code'] = 2
            return result

        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(out):
            try:
                exec(code_obj, {'__name__': '__main__', 'turtle': kidturtle})
                result['ok'] = True
                result['code'] = 0
            except SystemExit as e:
                result['code'] = int(e.code or 0)
                result['ok'] = result['code'] == 0
            except BaseException:
                result['code'] = 3
                result['stderr'] = traceback.format_exc(limit=6)
        result['err'] = ''
    finally:
        timer.cancel()

    result['stdout'] = out.getvalue()[:4000]
    if not result['stderr']:
        result['stderr'] = ''
    # 图形：海龟（我们自己的记录器一定可用）
    try:
        if kidturtle._G:
            result['svg'] = kidturtle.svg_data_uri()
    except Exception:
        pass
    # 图形：matplotlib（可选，装了才给 PNG）
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        # 若 matplotlib 被小朋友 import 过且画了图，则保存
        if any('matplotlib' in str(m.__name__) for m in sys.modules.values()):
            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight')
            buf.seek(0)
            result['png'] = 'data:image/png;base64,' + base64.b64encode(buf.read()).decode('ascii')
    except Exception:
        pass

    result['dur_ms'] = int((time.time() - started) * 1000)
    return result


if __name__ == '__main__':
    r = main()
    sys.stdout.write(base64.b64encode(json.dumps(r, ensure_ascii=True).encode('utf-8')).decode('ascii'))
    sys.stdout.write('\n')
    sys.stdout.flush()