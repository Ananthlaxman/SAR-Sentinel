
import h5py
import glob
import os
from pathlib import Path

files = glob.glob("data/downloads/*.part")

for file_path in files:
    print("\n" + "=" * 70)
    print("FILE:", Path(file_path).name)
    print("SIZE:", round(os.path.getsize(file_path) / (1024 ** 3), 2), "GB")

    try:
        with h5py.File(file_path, "r") as f:
            print("OPENABLE: YES")
            print("TOP LEVEL GROUPS:", list(f.keys()))

    except Exception as error:
        print("OPENABLE: NO")
        print("ERROR:", str(error)[:250])

print("\nInspection completed.")
