from typing import Dict, List, Any

class Normalizer:
    @staticmethod
    def extract_telemetry_signals(telemetry_summary: Dict[str, Any]) -> Dict[str, float]:
        """
        Converts a single hourly summary into normalized skill evidence (0-1).
        Heuristics based on files, languages, and commands.
        """
        top_files = telemetry_summary.get("top_files", [])
        languages = telemetry_summary.get("language_distribution", {})
        commands = telemetry_summary.get("total_commands", 0)
        
        signals = {
            "backend": 0.0,
            "devops": 0.0,
            "ml": 0.0,
            "frontend": 0.0,
            "neo4j": 0.0
        }
        
        # 1. File-based evidence
        backend_files = ["api.py", "router.py", "service.py", "main.py", "db.py"]
        devops_files = ["Dockerfile", "docker-compose.yml", "k8s.yaml", "jenkinsfile"]
        ml_files = ["model.py", "train.py", "notebook.ipynb", "dataset.py"]
        frontend_files = ["app.tsx", "component.tsx", "styles.css", "index.html"]
        
        for file in top_files:
            if any(bf in file for bf in backend_files): signals["backend"] += 0.2
            if any(df in file for df in devops_files): signals["devops"] += 0.2
            if any(mf in file for mf in ml_files): signals["ml"] += 0.2
            if any(ff in file for ff in frontend_files): signals["frontend"] += 0.2
            if "neo4j" in file.lower() or "cypher" in file.lower(): signals["neo4j"] += 0.2

        # 2. Language-based evidence
        if languages.get("python", 0) > 0.5: signals["backend"] += 0.3
        if languages.get("sql", 0) > 0.2: signals["backend"] += 0.2
        if languages.get("typescript", 0) > 0.4: signals["frontend"] += 0.4
        
        # 3. Cap signals at 1.0
        return {k: min(v, 1.0) for k, v in signals.items()}

    @staticmethod
    def extract_profile_signals(profile_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Normalizes resume and project evidence scores.
        """
        # (For prototype: We just extract existing scores or map them)
        resume_skills = profile_data.get("resume_skills", [])
        projects = profile_data.get("projects", [])
        
        signals = {}
        for skill in resume_skills:
            signals[skill.lower()] = 0.7  # Default strength for declared skills
            
        for project in projects:
            quality = project.get("quality_score", 0.5)
            for skill in project.get("skills", []):
                skill_key = skill.lower()
                signals[skill_key] = max(signals.get(skill_key, 0), quality)
                
        return signals
