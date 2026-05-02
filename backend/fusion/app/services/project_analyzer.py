"""
ADT Project Analyzer — Seeds THG from existing codebases (GitHub/Zip).
Algorithm: Recursive Code Analysis + CodeBERT Semantic Pooling.
"""
import httpx
import zipfile
import io
import os
import logging
from typing import Dict, Any, List
from app.services.ai_core import CodeBERTAnalyzer
from app.services.normalizer import Normalizer

logger = logging.getLogger("adt.project_analyzer")

class ProjectAnalyzer:
    """
    Downloads and analyzes external projects to bootstrap developer skill profiles.
    """
    
    def __init__(self):
        self.analyzer = CodeBERTAnalyzer.get_instance()

    async def analyze_github_repo(self, repo_url: str) -> Dict[str, Any]:
        """
        Downloads repo as zipball and analyzes contents.
        """
        # Convert github.com/user/repo to api.github.com/repos/user/repo/zipball/main
        if "github.com" in repo_url:
            parts = repo_url.rstrip('/').split('/')
            if len(parts) >= 5:
                user, repo = parts[-2], parts[-1]
                zip_url = f"https://api.github.com/repos/{user}/{repo}/zipball/main"
                
                try:
                    async with httpx.AsyncClient(follow_redirects=True) as client:
                        resp = await client.get(zip_url)
                        resp.raise_for_status()
                        return await self.analyze_zip_content(resp.content)
                except Exception as e:
                    logger.error(f"Failed to download GitHub repo: {e}")
                    return {"error": str(e), "status": "failed"}
        
        return {"error": "Invalid GitHub URL", "status": "failed"}

    async def analyze_zip_content(self, zip_bytes: bytes) -> Dict[str, Any]:
        """
        Analyzes code within a zip file.
        """
        try:
            with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
                all_code = ""
                file_count = 0
                languages = {}
                
                # Sample files (limit to 50 files for performance)
                for file_info in z.infolist()[:50]:
                    if not file_info.is_dir() and any(file_info.filename.endswith(ext) for ext in ['.py', '.ts', '.js', '.tsx', '.jsx', '.go', '.java']):
                        with z.open(file_info) as f:
                            content = f.read().decode('utf-8', errors='ignore')
                            all_code += content[:1000] + "\n" # Sample first 1KB
                            file_count += 1
                            
                            ext = os.path.splitext(file_info.filename)[1]
                            languages[ext] = languages.get(ext, 0) + 1

                # Normalize results
                semantic_signals = self.analyzer.analyze_code(all_code)
                
                # Combine with file-based normalizer signals
                # (Simulated combination)
                return {
                    "status": "completed",
                    "file_count": file_count,
                    "languages": languages,
                    "skill_signals": semantic_signals
                }
                
        except Exception as e:
            logger.error(f"Zip analysis failed: {e}")
            return {"error": str(e), "status": "failed"}
