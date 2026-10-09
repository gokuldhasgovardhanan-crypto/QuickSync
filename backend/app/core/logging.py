import json
import logging
import sys
from datetime import datetime, timezone

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage()
        }
        if hasattr(record, "structured_data"):
            log_obj.update(record.structured_data)
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)

def get_logger(name: str = "quicksync"):
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        logger.propagate = False
    return logger

logger = get_logger()

def log_event(level: str, message: str, **kwargs):
    extra_data = {"structured_data": kwargs}
    if level.lower() == "info":
        logger.info(message, extra=extra_data)
    elif level.lower() == "warning":
        logger.warning(message, extra=extra_data)
    elif level.lower() == "error":
        logger.error(message, extra=extra_data)
    elif level.lower() == "debug":
        logger.debug(message, extra=extra_data)
