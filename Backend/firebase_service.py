import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class FirebaseService:
    """Optional Firebase integration layer.

    If firebase-admin or credentials are not available, methods gracefully
    return and callers can fall back to local storage.
    """

    def __init__(self) -> None:
        self.enabled = False
        self._auth = None
        self._firestore = None
        self._server_timestamp = None
        self._initialize()

    def _initialize(self) -> None:
        try:
            import firebase_admin
            from firebase_admin import auth, credentials, firestore
        except Exception as exc:
            logger.info("firebase-admin not available, running without Firebase: %s", exc)
            return

        if firebase_admin._apps:
            self.enabled = True
            self._auth = auth
            self._firestore = firestore.client()
            self._server_timestamp = firestore.SERVER_TIMESTAMP
            return

        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
        cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")

        cred = None
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
        elif cred_json:
            try:
                cred_data = json.loads(cred_json)
                cred = credentials.Certificate(cred_data)
            except Exception as exc:
                logger.warning("Invalid FIREBASE_CREDENTIALS_JSON: %s", exc)
                return

        if not cred:
            logger.info("Firebase credentials not configured. Set FIREBASE_CREDENTIALS_PATH or FIREBASE_CREDENTIALS_JSON.")
            return

        try:
            firebase_admin.initialize_app(cred)
            self.enabled = True
            self._auth = auth
            self._firestore = firestore.client()
            self._server_timestamp = firestore.SERVER_TIMESTAMP
            logger.info("Firebase initialized successfully")
        except Exception as exc:
            logger.warning("Failed to initialize Firebase: %s", exc)

    def verify_bearer_token(self, auth_header: Optional[str]) -> Optional[Dict[str, Any]]:
        if not self.enabled or not auth_header:
            return None
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ", 1)[1].strip()
        if not token:
            return None

        try:
            decoded = self._auth.verify_id_token(token)
            return {
                "uid": decoded.get("uid"),
                "email": decoded.get("email"),
                "name": decoded.get("name"),
                "picture": decoded.get("picture"),
            }
        except Exception as exc:
            logger.warning("Token verification failed: %s", exc)
            return None

    def upsert_user_profile(self, user: Dict[str, Any], extra: Optional[Dict[str, Any]] = None) -> None:
        if not self.enabled:
            return
        uid = user.get("uid")
        if not uid:
            return

        payload = {
            "uid": uid,
            "email": user.get("email"),
            "display_name": user.get("name"),
            "photo_url": user.get("picture"),
            "updated_at": self._server_timestamp,
        }
        if extra:
            payload.update(extra)

        self._firestore.collection("users").document(uid).set(payload, merge=True)

    def save_detection_log(self, log_entry: Dict[str, Any], user: Optional[Dict[str, Any]]) -> bool:
        return bool(self.save_forensic_log(log_entry, user))

    def save_forensic_log(
        self,
        log_entry: Dict[str, Any],
        user: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        if not self.enabled:
            return None

        payload = dict(log_entry)
        payload.setdefault("timestamp", datetime.utcnow().isoformat())
        payload.setdefault("source_type", "upload")

        if user and user.get("uid"):
            payload["user_id"] = user.get("uid")
            payload["user_email"] = user.get("email")

        payload["created_at"] = self._server_timestamp
        doc_ref = self._firestore.collection("forensic_logs").document()
        payload["id"] = doc_ref.id
        doc_ref.set(payload)
        return payload

    def _normalize_log_doc(self, doc: Any) -> Dict[str, Any]:
        item = doc.to_dict() or {}
        item["id"] = item.get("id") or doc.id

        created_at = item.get("created_at")
        if hasattr(created_at, "isoformat"):
            item["created_at"] = created_at.isoformat()

        timestamp = item.get("timestamp")
        if hasattr(timestamp, "isoformat"):
            item["timestamp"] = timestamp.isoformat()
        elif item.get("timestamp") is None:
            item["timestamp"] = datetime.utcnow().isoformat()
        return item

    def get_forensic_logs(
        self,
        page: int = 1,
        page_size: int = 50,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        source_type: Optional[str] = None,
        user: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        if not self.enabled:
            return {"items": [], "total": 0, "page": page, "page_size": page_size}

        try:
            from firebase_admin import firestore
        except Exception:
            return {"items": [], "total": 0, "page": page, "page_size": page_size}

        base_query = self._firestore.collection("forensic_logs")

        if user and user.get("uid"):
            base_query = base_query.where("user_id", "==", user.get("uid"))
        if source_type:
            base_query = base_query.where("source_type", "==", source_type)
        if start_date:
            base_query = base_query.where("timestamp", ">=", start_date)
        if end_date:
            base_query = base_query.where("timestamp", "<=", end_date)

        total = sum(1 for _ in base_query.stream())
        offset = max(0, (page - 1) * page_size)

        page_query = (
            base_query
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
            .offset(offset)
            .limit(page_size)
        )

        items = [self._normalize_log_doc(doc) for doc in page_query.stream()]
        return {"items": items, "total": total, "page": page, "page_size": page_size}

    def get_detection_logs(self, limit: int = 50, user: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        response = self.get_forensic_logs(
            page=1,
            page_size=limit,
            source_type="upload",
            user=user,
        )
        return response.get("items", [])

    def delete_forensic_log(self, log_id: str, user: Optional[Dict[str, Any]] = None) -> bool:
        if not self.enabled or not log_id:
            return False

        doc_ref = self._firestore.collection("forensic_logs").document(log_id)
        doc = doc_ref.get()
        if not doc.exists:
            return False

        payload = doc.to_dict() or {}
        if user and user.get("uid") and payload.get("user_id") != user.get("uid"):
            return False

        doc_ref.delete()
        return True

    def clear_forensic_logs(
        self,
        user: Optional[Dict[str, Any]] = None,
        source_type: Optional[str] = None,
    ) -> int:
        if not self.enabled:
            return 0

        query = self._firestore.collection("forensic_logs")

        if user and user.get("uid"):
            query = query.where("user_id", "==", user.get("uid"))
        if source_type:
            query = query.where("source_type", "==", source_type)

        docs = query.stream()
        deleted = 0
        for doc in docs:
            doc.reference.delete()
            deleted += 1
        return deleted

    def get_user_profile(self, uid: str) -> Optional[Dict[str, Any]]:
        if not self.enabled or not uid:
            return None

        doc = self._firestore.collection("users").document(uid).get()
        if not doc.exists:
            return None
        data = doc.to_dict() or {}
        data["uid"] = uid
        return data
