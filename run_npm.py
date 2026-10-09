import subprocess
import os
import sys

def run_npm_install():
    node_dir = r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\nodejs"
    frontend_dir = r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\frontend"
    
    env = os.environ.copy()
    env["PATH"] = node_dir + os.pathsep + env.get("PATH", "")
    
    print(f"Running npm install in {frontend_dir} with node from {node_dir}...")
    npm_cmd = os.path.join(node_dir, "npm.cmd")
    result = subprocess.run([npm_cmd, "install", "--legacy-peer-deps"], cwd=frontend_dir, env=env, shell=True)
    print("npm install finished with code:", result.returncode)

if __name__ == "__main__":
    run_npm_install()
