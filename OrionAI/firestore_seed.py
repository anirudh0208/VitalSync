import json
import os
import firebase_admin
from firebase_admin import credentials, firestore

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
SERVICE_ACCOUNT_FILE = "firebase-service-account.json"
DATA_DIR = "firestore_import"

if not os.path.exists(SERVICE_ACCOUNT_FILE):
    print(f"❌ Error: {SERVICE_ACCOUNT_FILE} not found.")
    print("Please download your service account key from Firebase Console and place it in this directory.")
    exit(1)

# ─────────────────────────────────────────────
# INIT FIREBASE
# ─────────────────────────────────────────────
print("🚀 Initializing Firebase Admin SDK...")
cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
firebase_admin.initialize_app(cred)
db = firestore.client()

def import_collection(collection_name, file_name):
    file_path = os.path.join(DATA_DIR, file_name)
    if not os.path.exists(file_path):
        print(f"⚠️ Warning: {file_path} not found. Skipping.")
        return

    print(f"📦 Importing {collection_name}...")
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    batch = db.batch()
    count = 0
    for item in data:
        # Use 'id' field as document ID if it exists, otherwise auto-generate
        doc_id = item.get('id')
        if doc_id:
            doc_ref = db.collection(collection_name).document(str(doc_id))
        else:
            doc_ref = db.collection(collection_name).document()
        
        batch.set(doc_ref, item)
        count += 1
        
        # Firestore batch limit is 500
        if count % 500 == 0:
            batch.commit()
            batch = db.batch()
    
    batch.commit()
    print(f"✅ Successfully imported {count} documents into '{collection_name}'")

# ─────────────────────────────────────────────
# RUN IMPORT
# ─────────────────────────────────────────────
if __name__ == "__main__":
    try:
        import_collection("shipments", "shipments.json")
        import_collection("alerts", "alerts.json")
        print("\n✨ Firestore data seeding complete!")
    except Exception as e:
        print(f"❌ An error occurred: {e}")
