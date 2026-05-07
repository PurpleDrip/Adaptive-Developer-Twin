"""
ADT Normalizer — Converts raw telemetry into normalized domain skill signals.
Algorithm: Rule-based + configurable feature engineering.
"""
from typing import Dict, List, Any
import logging

logger = logging.getLogger("adt.normalizer")


class Normalizer:
    """Extracts and normalizes skill signals from telemetry and profile data."""

    # Configurable file → domain mapping
    FILE_DOMAIN_MAP = {
        "backend": ["api.py", "router.py", "service.py", "main.py", "db.py", "models.py",
                     "schemas.py", "views.py", "serializers.py", "middleware.py", "urls.py"],
        "frontend": ["app.tsx", "component.tsx", "styles.css", "index.html", "page.tsx",
                      "layout.tsx", ".jsx", ".vue", ".svelte", "tailwind.config"],
        "devops": ["Dockerfile", "docker-compose", "k8s.yaml", "jenkinsfile", ".github/workflows",
                   "terraform", ".tf", "ansible", "nginx.conf", "Makefile"],
        "ml": ["model.py", "train.py", "notebook.ipynb", "dataset.py", "pipeline.py",
               "predict.py", "evaluate.py", "features.py", "preprocessing.py"],
        "neo4j": ["neo4j", "cypher", "graph.py", "thg.py", "node.py", "relationship.py"],
        "testing": ["test_", "_test.py", "conftest.py", "fixture", "spec.ts", "spec.js",
                     ".test.ts", ".test.js", "cypress"],
        "database": ["migration", "alembic", "schema.sql", "query.sql", "repository.py",
                      "dao.py", "orm.py"],
        "security": ["auth.py", "jwt", "oauth", "encrypt", "hash", "permission", "rbac",
                      "cors", "csrf", "sanitize"],
    }

    # Language → domain signals
    LANGUAGE_DOMAIN_MAP = {
        "python": {"backend": 0.35, "ml": 0.15, "devops": 0.1},
        "typescript": {"frontend": 0.45, "backend": 0.15},
        "javascript": {"frontend": 0.4, "backend": 0.1},
        "sql": {"database": 0.5, "backend": 0.15},
        "yaml": {"devops": 0.3},
        "dockerfile": {"devops": 0.4},
        "css": {"frontend": 0.35},
        "html": {"frontend": 0.3},
        "java": {"backend": 0.35},
        "go": {"backend": 0.35, "devops": 0.15},
        "rust": {"backend": 0.3, "security": 0.1},
        "cypher": {"neo4j": 0.6},
    }

    @classmethod
    def extract_telemetry_signals(cls, telemetry_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Convert aggregated telemetry batch into normalized skill signals (0-1).
        """
        signals = {d: 0.0 for d in cls.FILE_DOMAIN_MAP}

        # 1. File-based evidence
        top_files = telemetry_data.get("top_files", [])
        if isinstance(top_files, dict):
            top_files = list(top_files.keys())
        elif isinstance(top_files, list) and top_files and isinstance(top_files[0], (list, tuple)):
            top_files = [f[0] for f in top_files]

        for file_entry in top_files:
            filename = file_entry if isinstance(file_entry, str) else str(file_entry)
            for domain, patterns in cls.FILE_DOMAIN_MAP.items():
                if any(p.lower() in filename.lower() for p in patterns):
                    signals[domain] = min(signals[domain] + 0.15, 1.0)

        # 2. Language-based evidence
        languages = telemetry_data.get("language_distribution", {})
        for lang, pct in languages.items():
            lang_lower = lang.lower()
            if lang_lower in cls.LANGUAGE_DOMAIN_MAP:
                for domain, weight in cls.LANGUAGE_DOMAIN_MAP[lang_lower].items():
                    signals[domain] = min(signals[domain] + pct * weight, 1.0)

        # 3. Command-based evidence
        total_commands = telemetry_data.get("total_commands", 0)
        if total_commands > 20:
            signals["devops"] = min(signals["devops"] + 0.1, 1.0)

        total_commits = telemetry_data.get("total_commits", 0)
        if total_commits > 0:
            signals["devops"] = min(signals["devops"] + 0.05 * min(total_commits, 5), 1.0)

        # 4. Error handling evidence
        errors_fixed = telemetry_data.get("total_errors_fixed", 0)
        errors_total = telemetry_data.get("total_errors", 0)
        if errors_total > 0 and errors_fixed > 0:
            fix_ratio = errors_fixed / errors_total
            if fix_ratio > 0.5:
                signals["testing"] = min(signals["testing"] + 0.15, 1.0)

        return {k: round(v, 4) for k, v in signals.items()}

    @classmethod
    def extract_profile_signals(cls, profile_data: Dict[str, Any]) -> Dict[str, float]:
        """Normalize project evidence and direct skill tags into domain signals."""
        signals = {d: 0.0 for d in cls.FILE_DOMAIN_MAP}
        
        # 1. Direct Skill Tags (Legacy/Manual)
        for skill in profile_data.get("resume_skills", []):
            key = skill.lower()
            if key in signals:
                signals[key] = 0.7

        # 2. Project-based evidence (Verifiable Code Audit)
        for project in profile_data.get("projects", []):
            quality = project.get("quality_score", 0.5)
            for skill in project.get("skills", []):
                key = skill.lower()
                if key in signals:
                    signals[key] = max(signals[key], quality)

        return signals
