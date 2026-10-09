import time
from enum import Enum
from typing import Dict, Optional

class CircuitState(str, Enum):
    CLOSED = "CLOSED"       # Normal operation
    OPEN = "OPEN"           # Failing, short-circuiting calls
    HALF_OPEN = "HALF_OPEN" # Testing recovery

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, cooldown_seconds: float = 30.0, recovery_threshold: int = 1):
        self.failure_threshold = failure_threshold
        self.cooldown_seconds = cooldown_seconds
        self.recovery_threshold = recovery_threshold
        
        # Per-platform state tracking: platform_name -> dict
        self._states: Dict[str, dict] = {}

    def _get_platform_data(self, platform: str) -> dict:
        if platform not in self._states:
            self._states[platform] = {
                "state": CircuitState.CLOSED,
                "failure_count": 0,
                "success_count": 0,
                "last_failure_time": 0.0,
                "last_state_change": time.time(),
                "last_error": None
            }
        return self._states[platform]

    def can_execute(self, platform: str) -> bool:
        data = self._get_platform_data(platform)
        state = data["state"]
        
        if state == CircuitState.CLOSED:
            return True
            
        if state == CircuitState.OPEN:
            now = time.time()
            if now - data["last_failure_time"] >= self.cooldown_seconds:
                # Transition to HALF_OPEN
                data["state"] = CircuitState.HALF_OPEN
                data["success_count"] = 0
                data["last_state_change"] = now
                return True
            return False
            
        if state == CircuitState.HALF_OPEN:
            return True
            
        return True

    def record_success(self, platform: str):
        data = self._get_platform_data(platform)
        state = data["state"]
        
        if state == CircuitState.HALF_OPEN:
            data["success_count"] += 1
            if data["success_count"] >= self.recovery_threshold:
                data["state"] = CircuitState.CLOSED
                data["failure_count"] = 0
                data["last_error"] = None
                data["last_state_change"] = time.time()
        elif state == CircuitState.CLOSED:
            data["failure_count"] = 0
            data["last_error"] = None

    def record_failure(self, platform: str, error_message: Optional[str] = None):
        data = self._get_platform_data(platform)
        data["failure_count"] += 1
        data["last_failure_time"] = time.time()
        data["last_error"] = error_message
        
        if data["state"] == CircuitState.HALF_OPEN:
            data["state"] = CircuitState.OPEN
            data["last_state_change"] = time.time()
        elif data["state"] == CircuitState.CLOSED:
            if data["failure_count"] >= self.failure_threshold:
                data["state"] = CircuitState.OPEN
                data["last_state_change"] = time.time()

    def get_status(self, platform: str) -> dict:
        data = self._get_platform_data(platform)
        return {
            "platform": platform,
            "state": data["state"],
            "failure_count": data["failure_count"],
            "last_error": data["last_error"],
            "cooldown_remaining": max(0.0, self.cooldown_seconds - (time.time() - data["last_failure_time"])) if data["state"] == CircuitState.OPEN else 0.0
        }

circuit_breaker = CircuitBreaker()
