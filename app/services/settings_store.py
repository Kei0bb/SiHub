"""
JSON-based Settings Store
Persists product active states and yield targets to a JSON file
"""
import json
import os
from pathlib import Path
from typing import Dict, Optional
from datetime import datetime


class SettingsStore:
    def __init__(self, filepath: str = None):
        if filepath is None:
            # Default to data/settings.json relative to project root
            project_root = Path(__file__).parent.parent.parent
            self._filepath = project_root / "data" / "settings.json"
        else:
            self._filepath = Path(filepath)
        
        # Ensure directory exists
        self._filepath.parent.mkdir(parents=True, exist_ok=True)
        
        # Load existing data or initialize empty
        self._data = self._load()
    
    def _load(self) -> Dict:
        """Load settings from JSON file"""
        if self._filepath.exists():
            try:
                with open(self._filepath, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return self._default_data()
        return self._default_data()
    
    def _default_data(self) -> Dict:
        return {
            "product_active_states": {},
            "yield_targets": {}
        }
    
    def _save(self):
        """Save settings to JSON file"""
        try:
            with open(self._filepath, 'w', encoding='utf-8') as f:
                json.dump(self._data, f, indent=2, ensure_ascii=False)
        except IOError as e:
            print(f"Warning: Could not save settings: {e}")
    
    # Product active states
    def get_product_active(self, product_id: str) -> bool:
        """Get product active state, default False"""
        return self._data["product_active_states"].get(product_id, False)
    
    def set_product_active(self, product_id: str, active: bool):
        """Set product active state and save"""
        self._data["product_active_states"][product_id] = active
        self._save()
    
    # Yield targets
    def get_target(self, product_id: str, month: str = None) -> Optional[float]:
        """Get yield target for product/month, returns None if not set"""
        if not month:
            month = datetime.now().strftime("%Y-%m")
        key = f"{product_id}-{month}"
        return self._data["yield_targets"].get(key)
    
    def set_target(self, product_id: str, month: str, target: float):
        """Set yield target and save"""
        key = f"{product_id}-{month}"
        self._data["yield_targets"][key] = target
        self._save()


# Singleton instance
settings_store = SettingsStore()
