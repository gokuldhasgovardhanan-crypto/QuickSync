import subprocess
import os
import sys

def build_frontend():
    node_dir = r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\nodejs"
    frontend_dir = r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\frontend"
    
    env = os.environ.copy()
    env["PATH"] = node_dir + os.pathsep + env.get("PATH", "")
    
    print("Building frontend...")
    npm_cmd = os.path.join(node_dir, "npm.cmd")
    result = subprocess.run([npm_cmd, "run", "build"], cwd=frontend_dir, env=env, shell=True)
    print("npm run build finished with code:", result.returncode)
    sys.exit(result.returncode)

if __name__ == "__main__":
    build_frontend()
