#!/usr/bin/env python3
"""
Setup script for Hopes & Sorrows - Interactive Emotional Voice Analysis
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read the README file
readme_file = Path(__file__).parent / "README.md"
long_description = readme_file.read_text(encoding="utf-8") if readme_file.exists() else ""

# Read requirements
requirements_file = Path(__file__).parent / "requirements.txt"
requirements = []
if requirements_file.exists():
    requirements = requirements_file.read_text().splitlines()
    # Filter out comments and empty lines
    requirements = [req.strip() for req in requirements if req.strip() and not req.startswith('#')]

setup(
    name="hopes-sorrows",
    version="1.0.0",
    author="Hopes & Sorrows Team",
    author_email="team@hopes-sorrows.com",
    description="Interactive Emotional Voice Analysis using AI",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/hopes-sorrows/hopes-sorrows",
    package_dir={"": "src"},
    packages=find_packages(where="src"),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Multimedia :: Sound/Audio :: Analysis",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=22.0.0",
            "flake8>=4.0.0",
            "mypy>=0.950",
        ],
        "audio": [
            "librosa>=0.10.0",
            "soundfile>=0.12.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "hopes-sorrows=hopes_sorrows.__main__:main",
            "hopes-sorrows-web=hopes_sorrows.web.api.app:main",
            "hopes-sorrows-cli=hopes_sorrows.cli.__main__:main",
        ],
    },
    include_package_data=True,
    package_data={
        "hopes_sorrows.web": ["static/**/*", "templates/**/*"],
    },
    zip_safe=False,
    keywords="sentiment analysis, emotion detection, voice analysis, AI, machine learning",
    project_urls={
        "Bug Reports": "https://github.com/hopes-sorrows/hopes-sorrows/issues",
        "Source": "https://github.com/hopes-sorrows/hopes-sorrows",
        "Documentation": "https://hopes-sorrows.readthedocs.io/",
    },
) 