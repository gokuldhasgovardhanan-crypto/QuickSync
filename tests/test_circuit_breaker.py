import pytest
import time
from backend.app.connectors.circuit_breaker import CircuitBreaker, CircuitState

def test_circuit_breaker_transition_cycle():
    cb = CircuitBreaker(failure_threshold=3, cooldown_seconds=0.5, recovery_threshold=1)
    platform = "TestPlatform"

    # Initial state: CLOSED
    assert cb.can_execute(platform) is True
    status = cb.get_status(platform)
    assert status["state"] == CircuitState.CLOSED

    # Record 3 failures to trigger OPEN
    cb.record_failure(platform, "HTTP 502 Upstream Error")
    assert cb.can_execute(platform) is True
    cb.record_failure(platform, "HTTP 502 Upstream Error")
    assert cb.can_execute(platform) is True
    cb.record_failure(platform, "HTTP 502 Upstream Error")

    # Now circuit is OPEN
    assert cb.can_execute(platform) is False
    status = cb.get_status(platform)
    assert status["state"] == CircuitState.OPEN

    # Wait for cooldown
    time.sleep(0.6)

    # State transitions to HALF_OPEN on next call
    assert cb.can_execute(platform) is True
    status = cb.get_status(platform)
    assert status["state"] == CircuitState.HALF_OPEN

    # Record success -> resets to CLOSED
    cb.record_success(platform)
    status = cb.get_status(platform)
    assert status["state"] == CircuitState.CLOSED
