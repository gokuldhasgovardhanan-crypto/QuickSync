import subprocess
import os
import sys

def deploy():
    node_dir = r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\nodejs"
    frontend_dir = r"C:\Users\N.Magesh kumar\.gemini\antigravity-ide\scratch\quicksync\frontend"
    
    env = os.environ.copy()
    env["PATH"] = node_dir + os.pathsep + env.get("PATH", "")
    
    print("=" * 60)
    print("🚀 QuickSync Vercel Deployment Assistant")
    print("=" * 60)
    print("Running production build...")
    build_res = subprocess.run(["npm.cmd", "run", "build"], cwd=frontend_dir, env=env, shell=True)
    if build_res.returncode != 0:
        print("Build failed. Please resolve errors before deploying.")
        return
    
    print("\nStarting Vercel Deployment...")
    print("If this is your first time, Vercel will prompt you to log in.")
    subprocess.run(["vercel", "--prod"], cwd=frontend_dir, env=env, shell=True)

if __name__ == "__main__":
    deploy()
