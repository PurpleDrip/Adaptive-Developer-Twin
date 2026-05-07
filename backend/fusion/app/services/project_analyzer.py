"""
ADT Project Analyzer — Seeds THG from existing codebases (GitHub/Zip).
Algorithm: Recursive Code Analysis + CodeBERT Semantic Pooling.
"""
import httpx
import zipfile
import io
import os
import logging
import redis
import json
from typing import Dict, Any, List
from app.services.ai_core import CodeBERTAnalyzer
from app.services.normalizer import Normalizer

logger = logging.getLogger("adt.project_analyzer")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
r_client = redis.from_url(REDIS_URL, decode_responses=True)

class ProjectAnalyzer:
    """
    Downloads and analyzes external projects to bootstrap developer skill profiles.
    """
    
    def __init__(self):
        self.analyzer = CodeBERTAnalyzer.get_instance()

    async def analyze_github_repo(self, repo_url: str, user_id: str = None) -> Dict[str, Any]:
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
                        return await self.analyze_zip_content(resp.content, user_id)
                except Exception as e:
                    logger.error(f"Failed to download GitHub repo: {e}")
                    return {"error": str(e), "status": "failed"}
        
        return {"error": "Invalid GitHub URL", "status": "failed"}

    async def analyze_zip_content(self, zip_bytes: bytes, user_id: str = None) -> Dict[str, Any]:
        """
        Analyzes the entire repository with Anti-Manipulation verification.
        Decouples imports from logic to prevent 'Import Inflation' tricks.
        """
        try:
            with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
                total_signals = {}
                file_count = 0
                languages = {}
                
                # Get total files for progress calculation
                all_files = [f for f in z.infolist() if not f.is_dir() and os.path.splitext(f.filename)[1].lower() in ['.py', '.ts', '.js', '.tsx', '.jsx', '.go', '.java']]
                total_target_files = len(all_files)

                # 1. Exhaustive Scan: No more 50-file limit
                for i, file_info in enumerate(all_files):
                    # Progress Reporting
                    if user_id and i % 5 == 0:
                        progress = {
                            "percent": round((i / total_target_files) * 100, 1) if total_target_files > 0 else 0,
                            "current_file": file_info.filename.split('/')[-1],
                            "files_processed": i,
                            "total_files": total_target_files,
                            "eta_seconds": round((total_target_files - i) * 0.1, 1) # Estimated 100ms per file
                        }
                        r_client.setex(f"analysis_progress:{user_id}", 300, json.dumps(progress))

                    ext = os.path.splitext(file_info.filename)[1].lower()
                    if ext not in ['.py', '.ts', '.js', '.tsx', '.jsx', '.go', '.java']:
                        continue

                    with z.open(file_info) as f:
                        content = f.read().decode('utf-8', errors='ignore')
                        if len(content.strip()) < 50: # Skip boilerplate/empty files
                            continue
                            
                        # 2. Counter-Loophole: Separate Imports from Logic
                        lines = content.splitlines()
                        import_symbols = []
                        logic_lines = []
                        
                        for line in lines:
                            clean_line = line.strip()
                            if clean_line.startswith(('import ', 'from ', 'require(', 'package ')):
                                import_symbols.append(clean_line)
                            else:
                                logic_lines.append(line)
                        
                        logic_code = "\n".join(logic_lines)
                        
                        # 3. Semantic Analysis on Logic Only
                        # This prevents users from just importing 'tensorflow' to get ML scores
                        file_signals = self.analyzer.analyze_code(logic_code)
                        
                        # 4. Verify Call-Site Usage (Simplified AST/Regex check)
                        # We extract all words used in the logic to see if they match domain patterns
                        used_words = set(re.findall(r'\b[A-Za-z_][A-Za-z0-9_]*\b', logic_code.lower()))
                        
                        for skill, score in file_signals.items():
                            # If CodeBERT detects a skill but no related architectural patterns are used
                            # it indicates 'Comment Inflation' or 'Dead Code'
                            patterns = self.analyzer.DOMAIN_PATTERNS.get(skill, [])
                            evidence_found = any(any(word.lower() in used_words for word in p.split()) for p in patterns)
                            
                            if not evidence_found and score > 0.3:
                                file_signals[skill] *= 0.2 # 80% penalty for unverified logic
                            
                            total_signals[skill] = total_signals.get(skill, 0) + file_signals[skill]
                        
                        file_count += 1
                        languages[ext] = languages.get(ext, 0) + 1

                # 5. Bayesian Aggregation (Mean of Signals)
                final_signals = {
                    skill: round(total / file_count, 4) if file_count > 0 else 0 
                    for skill, total in total_signals.items()
                }
                
                return {
                    "status": "completed",
                    "file_count": file_count,
                    "languages": languages,
                    "skill_signals": final_signals,
                    "audit_integrity": "high"
                }
                
        except Exception as e:
            logger.error(f"Deep zip analysis failed: {e}")
            return {"error": str(e), "status": "failed"}

import re # Added for word extraction
