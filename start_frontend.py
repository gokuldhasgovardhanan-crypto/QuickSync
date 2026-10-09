import subprocess
import os
import sys

def start_dev_server():
    node_dir = r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\nodejs"
    frontend_dir = r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\frontend"
    
    env = os.environ.copy()
    env["PATH"] = node_dir + os.pathsep + env.get("PATH", "")
    
    npm_cmd = os.path.join(node_dir, "npm.cmd")
    subprocess.run([npm_cmd, "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173"], cwd=frontend_dir, env=env, shell=True)

if __name__ == "__main__":
    start_dev_server()
