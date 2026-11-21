"""Point house storage at a temp dir before the app is imported, so tests never touch real-user data."""
import os
import tempfile

os.environ.setdefault("NESTORA_STORAGE_DIR", tempfile.mkdtemp(prefix="nestora_test_"))
