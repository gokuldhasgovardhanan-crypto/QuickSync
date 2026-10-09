import os

dirs = [
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\backend\app\api",
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\backend\app\core",
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\backend\app\models",
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\backend\app\schemas",
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\backend\app\connectors",
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\backend\app\services",
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\backend\app\repositories",
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\backend\app\websocket",
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\backend\app\middleware",
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\backend\app\utils",
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\backend\alembic\versions",
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\frontend\src\api",
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\frontend\src\components",
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\frontend\src\hooks",
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\frontend\src\layouts",
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\frontend\src\pages",
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\frontend\src\store",
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\frontend\src\types",
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\frontend\src\utils",
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\tests",
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\docs",
    r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\docker",
]

for d in dirs:
    os.makedirs(d, exist_ok=True)
    print(f"Created {d}")
