"""
Custom exceptions for Hopes & Sorrows application.
"""

class HopesSorrowsError(Exception):
    """Base exception for Hopes & Sorrows application."""
    pass

class AnalysisError(HopesSorrowsError):
    """Exception raised during sentiment or audio analysis."""
    pass

class ConfigurationError(HopesSorrowsError):
    """Exception raised for configuration-related errors."""
    pass

class DatabaseError(HopesSorrowsError):
    """Exception raised for database-related errors."""
    pass

class APIError(HopesSorrowsError):
    """Exception raised for external API errors."""
    pass 