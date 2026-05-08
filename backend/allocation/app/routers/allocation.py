from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import httpx
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.services.skill_matcher import SkillMatcher
from app.services.workload_optimizer import WorkloadOptimizer

class TaskAllocationRequest(BaseModel):
    task_id: Optional[str] = None
    title: str
    description: str
    required_skills: Dict[str, float]
    min_confidence: float = 0.3

router = APIRouter(tags=["allocation"])
THG_URL = os.getenv("THG_URL", "http://thg-service:8000")
FUSION_URL = os.getenv("FUSION_URL", "http://fusion-service:8000")

@router.post("/rank", status_code=200)
async def rank_devs(request: TaskAllocationRequest):
    """
    Production-Level Smart Allocation Algorithm.
    """
    async with httpx.AsyncClient() as client:
        # 1. SEMANTIC VECTORIZATION: Call CodeBERT to understand the task
        # We combine title and description
        task_desc = f"{request.title}\n{request.description}"
        try:
            f_resp = await client.post(f"{FUSION_URL}/api/v1/fusion/fusion/analyze-text", json={"text": task_desc})
            task_vector = f_resp.json().get("vector", {})
        except:
            task_vector = {}

        # Merge task_vector with required_skills (required_skills take precedence)
        # Normalize keys to lowercase so "Python" and "python" match
        merged = {**task_vector, **request.required_skills}
        combined_task_vector = {k.lower(): float(v) for k, v in merged.items() if v}

        # 2. FETCH LATEST DATA: Query all developers
        try:
            thg_resp = await client.get(f"{THG_URL}/api/v1/thg/developers")
            developers = thg_resp.json()
            if not isinstance(developers, list):
                print(f"THG returned non-list: {developers}")
                developers = []
        except Exception as e:
            print(f"THG fetch failed: {e}")
            developers = []

    # Normalize dev skill keys to lowercase too, while preserving original casing for display
    for dev in developers:
        original = dev.get("skills", {}) or {}
        normalized = {}
        display_map = {}
        for sk, sv in original.items():
            lk = sk.lower()
            normalized[lk] = max(normalized.get(lk, 0.0), float(sv))
            display_map[lk] = sk
        dev["skills"] = normalized
        dev["_display_skills"] = display_map
    
    # 3. Calculate Scores
    ranked = []
    for dev in developers:
        skills = dev.get("skills", {})
        conf = float(dev.get("confidence", 0.5))

        if conf < request.min_confidence:
            continue

        # Calculate match using real AI vector vs graph skills
        match_score = SkillMatcher.calculate_match(combined_task_vector, skills)

        # Multi-factor score: 60% skill match, 20% confidence, 20% baseline
        skill_component = match_score * 0.6
        conf_component = conf * 0.2
        baseline = 0.2
        final_score = min(1.0, skill_component + conf_component + baseline)

        # Build explainability payload (skills are lowercase; recover display casing)
        display_map = dev.get("_display_skills", {})
        matched = []
        for skill_key, task_weight in combined_task_vector.items():
            if task_weight <= 0:
                continue
            dev_strength = skills.get(skill_key, 0.0)
            if dev_strength > 0:
                matched.append({
                    "skill": display_map.get(skill_key, skill_key.capitalize()),
                    "task_weight": round(float(task_weight), 3),
                    "dev_strength": round(float(dev_strength), 3),
                    "contribution": round(float(task_weight) * float(dev_strength), 3),
                })
        matched.sort(key=lambda m: m["contribution"], reverse=True)

        top_dev_skills = sorted(skills.items(), key=lambda x: x[1], reverse=True)[:3]
        top_dev_skills_fmt = [
            {"skill": display_map.get(s, s.capitalize()), "strength": round(float(v), 3)}
            for s, v in top_dev_skills
        ]

        primary_skill_key = max(skills, key=skills.get) if skills else None
        primary_skill_display = (
            display_map.get(primary_skill_key, primary_skill_key.capitalize())
            if primary_skill_key else "General"
        )

        ranked.append({
            "user_id": dev["id"],
            "name": dev["name"],
            "match_score": round(final_score, 4),
            "primary_skill": primary_skill_display,
            "explanation": {
                "skill_match": round(float(match_score), 4),
                "confidence": round(conf, 4),
                "breakdown": {
                    "skill_component": round(skill_component, 4),
                    "confidence_component": round(conf_component, 4),
                    "baseline": baseline,
                },
                "matched_skills": matched[:5],
                "top_dev_skills": top_dev_skills_fmt,
            },
        })

    ranked.sort(key=lambda x: x["match_score"], reverse=True)

    # Attach human-readable rationale to top 3 (XAI)
    for idx, c in enumerate(ranked[:3]):
        exp = c["explanation"]
        matched = exp["matched_skills"]
        skill_pct = int(round(exp["skill_match"] * 100))
        conf_pct = int(round(exp["confidence"] * 100))
        name = c.get("name", "this developer")

        def fmt_skill(m):
            return f"{m['skill']} ({int(round(m['dev_strength'] * 100))}%)"

        if matched:
            top = matched[:3]
            top_skill = top[0]
            secondary = top[1] if len(top) > 1 else None
            tertiary = top[2] if len(top) > 2 else None

            if idx == 0:
                # Rank #1 — strongest absolute fit
                bits = [
                    f"{name} is the top match because their {fmt_skill(top_skill)} directly anchors "
                    f"the task's primary skill requirement."
                ]
                if secondary:
                    bits.append(
                        f"They also bring {fmt_skill(secondary)}"
                        + (f" and {fmt_skill(tertiary)}" if tertiary else "")
                        + ", which lifts the cosine score to "
                        + f"{skill_pct}% — the highest in your squad."
                    )
                else:
                    bits.append(f"This single-skill alignment alone produces a {skill_pct}% cosine match.")
                bits.append(
                    f"Twin confidence sits at {conf_pct}%, so the THG considers their skill graph "
                    f"well-evidenced rather than inferred."
                )
                rationale = " ".join(bits)
            elif idx == 1:
                # Rank #2 — strong fit, second to top
                if secondary:
                    rationale = (
                        f"{name} ranks just below the leader, scoring {skill_pct}% on cosine alignment. "
                        f"Their {fmt_skill(top_skill)} covers the core requirement, with {fmt_skill(secondary)} "
                        f"reinforcing the secondary axis. With {conf_pct}% twin confidence, they're a credible "
                        f"alternative if the rank-1 candidate is overloaded."
                    )
                else:
                    rationale = (
                        f"{name} is a clean #2 pick — their {fmt_skill(top_skill)} maps to the task's primary "
                        f"requirement at a {skill_pct}% cosine score. Twin confidence is {conf_pct}%, "
                        f"making them a low-risk fallback."
                    )
            else:
                # Rank #3 — solid contender
                rationale = (
                    f"{name} closes out the top 3 with a {skill_pct}% cosine score, anchored by "
                    f"{fmt_skill(top_skill)}"
                    + (f" and supported by {fmt_skill(secondary)}" if secondary else "")
                    + f". At {conf_pct}% twin confidence this is a viable third option, "
                    + "useful for parallelization or as a peer reviewer."
                )
        else:
            top_skills = [s["skill"] for s in exp["top_dev_skills"][:2]]
            top_skills_phrase = ", ".join(top_skills) if top_skills else "general engineering"
            if idx == 0:
                rationale = (
                    f"{name} surfaces at #1 despite zero direct overlap with the task vector — the squad "
                    f"has no exact skill match for this work. Their adjacent expertise in {top_skills_phrase} "
                    f"and {conf_pct}% twin confidence make them the closest stretch candidate available."
                )
            elif idx == 1:
                rationale = (
                    f"{name} ranks #2 on the same stretch basis — no direct task-vector skill, but "
                    f"{conf_pct}% twin confidence and adjacent strengths in {top_skills_phrase} keep "
                    f"them in contention."
                )
            else:
                rationale = (
                    f"{name} rounds out the top 3 by confidence rather than skill match. With "
                    f"{top_skills_phrase} as their strongest domains, consider them only if rank-1 "
                    f"and rank-2 are unavailable."
                )
        c["explanation"]["rationale"] = rationale

    return {
        "task_id": request.task_id,
        "candidates": ranked,
        "algorithm": "Semantic-Weighted-Rank-v2-Full",
        "scoring_formula": "0.6 * cosine(task, skills) + 0.2 * twin_confidence + 0.2 baseline",
    }

@router.post("/optimize", status_code=200)
async def optimize_allocations(tasks: List[TaskAllocationRequest]):
    """
    Global optimization using the Hungarian Algorithm.
    Assumes a batch of open tasks and available developers.
    """
    # 1. Fetch Developers
    async with httpx.AsyncClient() as client:
        thg_resp = await client.get(f"{THG_URL}/api/v1/thg/developers")
        developers = thg_resp.json()
    
    if not tasks or not developers:
        return {"assignments": []}

    # 2. Build Match Matrix
    # Matrix shape: [num_tasks x num_devs]
    matrix = []
    for t in tasks:
        row = []
        # Get task vector (simplified for batch)
        t_vec = t.required_skills
        for d in developers:
            score = SkillMatcher.calculate_match(t_vec, d.get("skills", {}))
            row.append(score)
        matrix.append(row)
    
    # 3. Run Hungarian Algorithm
    matrix_np = np.array(matrix)
    # Convert tasks and developers to simple list of dicts for the optimizer
    tasks_simple = [{"task_id": t.task_id or f"T-{i}"} for i, t in enumerate(tasks)]
    devs_simple = [{"user_id": d["id"]} for d in developers]
    
    assignments = WorkloadOptimizer.optimize_assignments(tasks_simple, devs_simple, matrix_np)
    
    return {
        "assignments": assignments,
        "optimization_method": "Hungarian-Algorithm-Global-Optimal"
    }

@router.post("/select", status_code=200)
async def select_dev(user_id: str, task_id: str):
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(f"{THG_URL}/api/v1/thg/record-assignment", json={
                "dev_id": user_id,
                "task_id": task_id
            })
            resp.raise_for_status()
            return {"status": "success", "user_id": user_id, "task_id": task_id}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

import numpy as np # Needed for the optimize endpoint
