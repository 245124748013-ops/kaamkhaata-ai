import os
import zipfile
import shutil

root_dir = r"C:\Users\DeepakRaj.Kuthadi\OneDrive\Desktop\PROJECT1"
zip_output = r"C:\Users\DeepakRaj.Kuthadi\OneDrive\Desktop\PROJECT1\KaamKhaata_AI.zip"
desktop_zip = r"C:\Users\DeepakRaj.Kuthadi\OneDrive\Desktop\KaamKhaata_AI.zip"

excluded_dirs = {'node_modules', 'dist', '.git', '__pycache__', '.pytest_cache', '.vite'}
excluded_files = {'KaamKhaata_AI.zip', 'make_zip.py'}

count = 0
with zipfile.ZipFile(zip_output, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in excluded_dirs]
        for file in files:
            if file in excluded_files or file.endswith('.zip'):
                continue
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, root_dir)
            zipf.write(full_path, rel_path)
            count += 1

shutil.copy2(zip_output, desktop_zip)

print(f"SUCCESS: Zipped {count} files.")
print(f"Project ZIP size: {os.path.getsize(zip_output)} bytes")
print(f"Desktop ZIP size: {os.path.getsize(desktop_zip)} bytes")
