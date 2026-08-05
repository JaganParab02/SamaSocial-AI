"""
Structured reusable logger service supporting timestamps, colored console outputs,
and automatic rotating file logs.
"""

import logging
import os
from logging.handlers import RotatingFileHandler
from typing import Optional

try:
    import colorlog
    HAS_COLORLOG = True
except ImportError:
    HAS_COLORLOG = False

from app.core.config import get_settings


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """
    Creates or retrieves a configured structured logger.
    
    Features:
    - Standard severity levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
    - Timestamps in ISO-like structured form
    - Colored terminal output for immediate visibility during developer inspection
    - Automatic rotating file log retention (max 10MB per file, retaining 5 backups)
    
    Args:
        name: Name of the logger namespace, defaults to caller module root
        
    Returns:
        logging.Logger instance configured to standard project guidelines.
    """
    settings = get_settings()
    logger_name = name or "SamaAI"
    logger = logging.getLogger(logger_name)

    # Avoid adding duplicate handlers if logger already initialized
    if logger.handlers:
        return logger

    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    logger.setLevel(level)

    # Log line formatting pattern
    log_format = (
        "%(asctime)s | %(levelname)-8s | [%(name)s:%(filename)s:%(lineno)d] | %(message)s"
    )
    date_format = "%Y-%m-%dT%H:%M:%S%z"

    # 1. Console Handler (Colored if colorlog is available)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(level)
    if HAS_COLORLOG:
        color_formatter = colorlog.ColoredFormatter(
            "%(log_color)s%(asctime)s | %(levelname)-8s | [%(name)s:%(filename)s:%(lineno)d] | %(message)s",
            datefmt=date_format,
            log_colors={
                "DEBUG": "cyan",
                "INFO": "green",
                "WARNING": "yellow",
                "ERROR": "red",
                "CRITICAL": "red,bg_white",
            },
        )
        console_handler.setFormatter(color_formatter)
    else:
        console_handler.setFormatter(logging.Formatter(log_format, datefmt=date_format))
    logger.addHandler(console_handler)

    # 2. Rotating File Handler
    log_dir = os.path.join(os.getcwd(), "logs")
    os.makedirs(log_dir, exist_ok=True)
    file_handler = RotatingFileHandler(
        filename=os.path.join(log_dir, "ai_backend.log"),
        maxBytes=10 * 1024 * 1024,  # 10 MB limit
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setLevel(level)
    file_handler.setFormatter(logging.Formatter(log_format, datefmt=date_format))
    logger.addHandler(file_handler)

    logger.propagate = False
    return logger
