"""pure-Python headless turtle recorder -> SVG.

不依赖 tkinter / matplotlib / 任何第三方包。提供课程常用的海龟子集，
把每一步画图命令记录成 SVG，供前端内联显示。runner 会把本模块注入成
`turtle`，保证 `import turtle; t = turtle.Turtle()` 在无 GUI 环境也能跑。
"""
import math, base64

# ============ 模块级唯一绘制存储（所有海龟共享一张画布） ============
_G = []          # 每个元素: ('line',x1,y1,x2,y2,color,width) / ('circle',x,y,r,color)
                 #           ('poly',None,None,None,fillcolor,[(x,y)...]) / ('bg',...)


class Turtle:
    def __init__(self):
        self.x = 0.0
        self.y = 0.0
        self.heading_ = 0.0
        self.pen = True
        self.width_ = 3
        self.pen_color = '#333333'
        self.fill_color = None
        self._filling = False
        self._path = []
        self.speed_ = 3
        self._hidden = False

    # ---------- 基本移动 ----------
    def forward(self, d): self._move(d)
    def fd(self, d): self.forward(d)
    def backward(self, d): self._move(-d)
    def back(self, d): self.backward(d)
    def bk(self, d): self.backward(d)
    def right(self, a): self.heading_ = (self.heading_ - a) % 360
    def rt(self, a): self.right(a)
    def left(self, a): self.heading_ = (self.heading_ + a) % 360
    def lt(self, a): self.left(a)
    def setheading(self, a): self.heading_ = a % 360
    def seth(self, a): self.setheading(a)
    def goto(self, x, y=None):
        if y is None: x, y = x
        self._line_to(float(x), float(y))
    def setpos(self, x, y=None): self.goto(x, y)
    def setx(self, v): self._line_to(float(v), self.y)
    def sety(self, v): self._line_to(self.x, float(v))
    def home(self): self.goto(0, 0); self.setheading(0)

    def circle(self, radius, extent=None, steps=None):
        r = float(radius)
        e = 360.0 if extent is None else float(extent)
        seg = max(8, int(abs(e) / 45.0 * 4))
        step = math.radians(e) / seg
        start = math.radians(self.heading_)
        cx = self.x - r * math.cos(start)
        cy = self.y - r * math.sin(start)
        for i in range(1, seg + 1):
            a = start + step * i
            self._line_to(cx + r * math.cos(a), cy + r * math.sin(a))

    def dot(self, size=None, color=None):
        s = size if size is not None else max(5, self.width_ + 4)
        _G.append(('circle', self.x, self.y, float(s) / 2.0, color or self.pen_color))
    def stamp(self): return None

    # ---------- 笔 ----------
    def penup(self): self.pen = False
    def pu(self): self.penup()
    def up(self): self.penup()
    def pendown(self): self.pen = True
    def pd(self): self.pendown()
    def down(self): self.pendown()
    def pensize(self, w): self.width_ = int(w)
    def width(self, w): self.pensize(w)
    def color(self, *a):
        if len(a) == 1 and isinstance(a[0], (tuple, list)):
            c = self._col(a[0]); self.pen_color = c; self.fill_color = c
        elif len(a) == 2:
            self.pencolor(a[0]); self.fillcolor(a[1])
        else:
            self.pencolor(a[0])
    def pencolor(self, c=None):
        if c is not None: self.pen_color = self._col(c)
        return self.pen_color
    def fillcolor(self, c=None):
        if c is not None: self.fill_color = self._col(c)
        return self.fill_color
    def begin_fill(self):
        self._filling = True; self._path = [(self.x, self.y)]
    def end_fill(self):
        if self._filling and len(self._path) > 2:
            pts = self._path + [(self.x, self.y)]
            _G.append(('poly', None, None, None, self.fill_color, pts))
        self._filling = False; self._path = []

    # ---------- 可见性 / 速度 ----------
    def speed(self, s=None):
        if s is not None: self.speed_ = s
        return self.speed_
    def hideturtle(self): self._hidden = True
    def ht(self): self.hideturtle()
    def showturtle(self): self._hidden = False
    def st(self): self.showturtle()
    def isdown(self): return self.pen
    def clear(self): _G.clear()
    def reset(self):
        self.x = self.y = 0.0; self.heading_ = 0.0; self.pen = True
        self.pen_color = '#333333'; self.fill_color = None; self.width_ = 3
        _G.clear()
    def position(self): return (self.x, self.y)
    def pos(self): return self.position()
    def heading(self): return self.heading_
    def xcor(self): return self.x
    def ycor(self): return self.y
    def write(self, *a, **k): pass   # 文本标记暂不渲染，忽略

    # ---------- 内部 ----------
    def _move(self, d):
        a = math.radians(self.heading_)
        self._line_to(self.x + d * math.cos(a), self.y + d * math.sin(a))
    def _line_to(self, nx, ny):
        if self.pen:
            _G.append(('line', self.x, self.y, nx, ny, self.pen_color, self.width_))
            if self._filling: self._path.append((nx, ny))
        self.x = nx; self.y = ny
    @staticmethod
    def _col(c):
        if isinstance(c, (tuple, list)) and len(c) == 3:
            if max(c) <= 1.0: c = tuple(int(round(x * 255)) for x in c)
            return '#%02x%02x%02x' % tuple(int(x) for x in c)
        return c


class _Screen:
    def __init__(self): self.bg = '#ffffff'
    def bgcolor(self, c): self.bg = Turtle._col(c)
    def title(self, *a): pass
    def turtle(self, *a): return _screen_turtle
    def colormode(self, *a): pass
    def setup(self, *a): self.bgcolor(self.bg)
    def tracer(self, *a): pass
    def update(self): pass
    def bye(self): pass
    def clearscreen(self): _G.clear()
    def delay(self, *a): return 10
    def reset(self): _G.clear()


# Screen() 与 turtle() 都返回同一个单例，保证 `turtle.Screen()` / `turtle.onscreenclick` 可用
_turtle = Turtle()
_screen = _Screen()
_screen_turtle = _turtle


def Screen(): return _screen
def setup(*a, **k): return _screen
def bgcolor(c): _screen.bgcolor(c)
def turtle(): return _turtle
def colormode(*a): pass
def tracer(*a): pass
def update(): pass
def done(): pass
def mainloop(): pass
def bye(): pass
def delay(*a): return 10
def clearscreen(): _G.clear()
def reset(): _G.clear()


def _esc(s): return (s or '').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
def _fmt(n): return '%g' % n


def to_svg(width=520, height=520):
    W, H, C = int(width), int(height), float(width) / 2.0
    bg = '#ffffff'
    for it in _G:
        if it[0] == 'bg': bg = it[4]
    parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">' % (W, H, W, H)]
    parts.append('<rect x="0" y="0" width="%d" height="%d" fill="%s"/>' % (W, H, _esc(bg)))
    parts.append('<g transform="translate(%s %s) scale(1,-1)">' % (_fmt(C), _fmt(C)))
    for it in _G:
        t = it[0]
        if t == 'line':
            _, x1, y1, x2, y2, col, w = it
            parts.append('<line x1="%s" y1="%s" x2="%s" y2="%s" stroke="%s" stroke-width="%s" stroke-linecap="round"/>' % (
                _fmt(x1), _fmt(y1), _fmt(x2), _fmt(y2), _esc(col), _fmt(w)))
        elif t == 'circle':
            _, x, y, r, col = it
            parts.append('<circle cx="%s" cy="%s" r="%s" fill="%s"/>' % (_fmt(x), _fmt(y), _fmt(r), _esc(col)))
        elif t == 'poly':
            _, _x, _y, _r, col, pts = it
            d = 'M ' + ' L '.join('%s %s' % (_fmt(px), _fmt(py)) for px, py in pts) + ' Z'
            parts.append('<path d="%s" fill="%s" stroke="none"/>' % (d, _esc(col)))
    parts.append('</g></svg>')
    return ''.join(parts)


def svg_data_uri(width=520, height=520):
    b = to_svg(width, height).encode('utf-8')
    return 'data:image/svg+xml;base64,' + base64.b64encode(b).decode('ascii')