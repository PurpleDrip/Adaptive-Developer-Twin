"""
ADT Mongo Reference Seed
========================
Wipes all collections and re-populates with the same IDs the THG Cypher seed uses.
Run this AFTER (or before) the Cypher script — IDs are deterministic so the two
sources stay aligned.

Usage:
    python scripts/seed_production_demo.py
"""
import asyncio
import os
import random
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://shashanth1239_db_user:aCEe1GwfqiAWxwcc@adt.dzyoggh.mongodb.net/adt_db?retryWrites=true&w=majority&appName=ADT",
)
client = AsyncIOMotorClient(MONGO_URI)
db = client.adt_db
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
PASSWORD_HASH = pwd_context.hash("demo123")

# ---------------------------------------------------------------------------
# Static data (matches Cypher seed)
# ---------------------------------------------------------------------------
MANAGERS = [
    {"user_id": "mgr_001", "username": "aarav.kapoor",    "name": "Aarav Kapoor",    "email": "aarav.kapoor@adt.ai",    "department": "AI",       "phone_number": "+1-555-0101", "gender": "Male"},
    {"user_id": "mgr_002", "username": "priya.sharma",    "name": "Priya Sharma",    "email": "priya.sharma@adt.ai",    "department": "Backend",  "phone_number": "+1-555-0102", "gender": "Female"},
    {"user_id": "mgr_003", "username": "marcus.chen",     "name": "Marcus Chen",     "email": "marcus.chen@adt.ai",     "department": "Frontend", "phone_number": "+1-555-0103", "gender": "Male"},
    {"user_id": "mgr_004", "username": "sofia.rodriguez", "name": "Sofia Rodriguez", "email": "sofia.rodriguez@adt.ai", "department": "Mobile",   "phone_number": "+1-555-0104", "gender": "Female"},
    {"user_id": "mgr_005", "username": "david.park",      "name": "David Park",      "email": "david.park@adt.ai",      "department": "DevOps",   "phone_number": "+1-555-0105", "gender": "Male"},
]

# (id, name, manager_id, squad, primary_domains)
DEVS_RAW = [
    # AI squad
    ("dev_001", "Ananya Iyer",     "mgr_001", "ai",       ["Python", "PyTorch", "LangChain"]),
    ("dev_002", "Lucas Bernardo",  "mgr_001", "ai",       ["Python", "TensorFlow"]),
    ("dev_003", "Mei Tanaka",      "mgr_001", "ai",       ["Python", "PyTorch", "Rust"]),
    ("dev_004", "Daniel Foster",   "mgr_001", "ai",       ["Python", "LangChain"]),
    ("dev_005", "Elena Volkov",    "mgr_001", "ai",       ["Python", "PyTorch", "TensorFlow"]),
    ("dev_006", "Rajesh Kumar",    "mgr_001", "ai",       ["Python", "TensorFlow", "FastAPI"]),
    ("dev_007", "Yara Mansour",    "mgr_001", "ai",       ["Python", "LangChain", "MongoDB"]),
    ("dev_008", "Oliver Schmidt",  "mgr_001", "ai",       ["Python", "PyTorch"]),
    ("dev_009", "Naomi Park",      "mgr_001", "ai",       ["Python", "TensorFlow", "Neo4j"]),
    ("dev_010", "Tobias Larsen",   "mgr_001", "ai",       ["Python", "Rust", "PyTorch"]),
    # Backend squad
    ("dev_011", "Maya Patel",      "mgr_002", "backend",  ["Python", "FastAPI", "PostgreSQL"]),
    ("dev_012", "Diego Morales",   "mgr_002", "backend",  ["Go", "Redis", "PostgreSQL"]),
    ("dev_013", "Hannah Berg",     "mgr_002", "backend",  ["Python", "Django", "MongoDB"]),
    ("dev_014", "Vikram Reddy",    "mgr_002", "backend",  ["Go", "FastAPI", "Kubernetes"]),
    ("dev_015", "Carla Souza",     "mgr_002", "backend",  ["Python", "FastAPI", "Redis"]),
    ("dev_016", "Adrian Walsh",    "mgr_002", "backend",  ["Python", "Django", "PostgreSQL"]),
    ("dev_017", "Lin Wei",         "mgr_002", "backend",  ["Go", "PostgreSQL", "Docker"]),
    ("dev_018", "Felipe Castro",   "mgr_002", "backend",  ["Python", "FastAPI", "Neo4j"]),
    ("dev_019", "Amara Okonkwo",   "mgr_002", "backend",  ["Rust", "Go", "Redis"]),
    ("dev_020", "Ben Carter",      "mgr_002", "backend",  ["Python", "Django", "FastAPI"]),
    # Frontend squad
    ("dev_021", "Julia Novak",     "mgr_003", "frontend", ["React", "TypeScript", "Next.js"]),
    ("dev_022", "Kai Yamamoto",    "mgr_003", "frontend", ["React", "TypeScript", "Tailwind CSS"]),
    ("dev_023", "Isabella Romano", "mgr_003", "frontend", ["Vue", "TypeScript", "Tailwind CSS"]),
    ("dev_024", "Ravi Joshi",      "mgr_003", "frontend", ["React", "Next.js", "Node.js"]),
    ("dev_025", "Emma Thompson",   "mgr_003", "frontend", ["React", "TypeScript", "Tailwind CSS"]),
    ("dev_026", "Jake Wilson",     "mgr_003", "frontend", ["Vue", "TypeScript", "Next.js"]),
    ("dev_027", "Sasha Petrov",    "mgr_003", "frontend", ["React", "TypeScript"]),
    ("dev_028", "Aiko Suzuki",     "mgr_003", "frontend", ["React", "Next.js", "Tailwind CSS"]),
    ("dev_029", "Henrik Olsen",    "mgr_003", "frontend", ["Vue", "TypeScript", "Tailwind CSS"]),
    ("dev_030", "Zara Khan",       "mgr_003", "frontend", ["React", "TypeScript", "Next.js"]),
    # Mobile squad
    ("dev_031", "Carlos Mendez",   "mgr_004", "mobile",   ["TypeScript", "React", "Tailwind CSS"]),
    ("dev_032", "Aisha Hassan",    "mgr_004", "mobile",   ["TypeScript", "React", "Node.js"]),
    ("dev_033", "Tom Anderson",    "mgr_004", "mobile",   ["TypeScript", "Vue", "Tailwind CSS"]),
    ("dev_034", "Nadia Ali",       "mgr_004", "mobile",   ["TypeScript", "React"]),
    ("dev_035", "Akira Sato",      "mgr_004", "mobile",   ["TypeScript", "Node.js", "Tailwind CSS"]),
    ("dev_036", "Luca Bianchi",    "mgr_004", "mobile",   ["TypeScript", "React", "Vue"]),
    ("dev_037", "Priya Menon",     "mgr_004", "mobile",   ["TypeScript", "React"]),
    ("dev_038", "Ethan Brooks",    "mgr_004", "mobile",   ["TypeScript", "Node.js"]),
    ("dev_039", "Maria Silva",     "mgr_004", "mobile",   ["TypeScript", "React", "Tailwind CSS"]),
    ("dev_040", "Jin Wu",          "mgr_004", "mobile",   ["TypeScript", "Vue"]),
    # DevOps squad
    ("dev_041", "Sergei Ivanov",       "mgr_005", "devops", ["Docker", "Kubernetes", "AWS"]),
    ("dev_042", "Olivia Chen",         "mgr_005", "devops", ["Docker", "Terraform", "AWS"]),
    ("dev_043", "Mateo Garcia",        "mgr_005", "devops", ["Kubernetes", "Go", "AWS"]),
    ("dev_044", "Fatima Al-Rashid",    "mgr_005", "devops", ["Docker", "Kubernetes", "Terraform"]),
    ("dev_045", "Connor O'Brien",      "mgr_005", "devops", ["AWS", "Terraform", "Python"]),
    ("dev_046", "Chloe Dubois",        "mgr_005", "devops", ["Docker", "Kubernetes", "PostgreSQL"]),
    ("dev_047", "Arjun Nair",          "mgr_005", "devops", ["Kubernetes", "Go", "Redis"]),
    ("dev_048", "Sofia Martinez",      "mgr_005", "devops", ["Docker", "AWS", "FastAPI"]),
    ("dev_049", "Liam Murphy",         "mgr_005", "devops", ["Terraform", "AWS", "Python"]),
    ("dev_050", "Yuki Nakamura",       "mgr_005", "devops", ["Kubernetes", "Docker", "Go"]),
]

TECH_STAFF = [
    {"user_id": "tech_001", "username": "admin_root",    "name": "Root Admin",        "email": "admin@adt.ai",        "phone_number": "+1-555-0901", "gender": "Other",  "clearance_level": "ROOT"},
    {"user_id": "tech_002", "username": "rachel.cooper", "name": "Rachel Cooper",     "email": "rachel.cooper@adt.ai","phone_number": "+1-555-0902", "gender": "Female", "clearance_level": "STANDARD"},
    {"user_id": "tech_003", "username": "ahmed.youssef", "name": "Ahmed Youssef",     "email": "ahmed.youssef@adt.ai","phone_number": "+1-555-0903", "gender": "Male",   "clearance_level": "STANDARD"},
]

TASKS = [
    ("task_001", "Migrate Authentication Service to OAuth 2.1 with PKCE",   {"python": 0.9, "fastapi": 0.7, "redis": 0.5},                "HIGH",   "dev_011"),
    ("task_002", "Implement Real-Time Collaborative Editor with CRDT",      {"typescript": 0.9, "react": 0.8, "node.js": 0.6},            "HIGH",   None),
    ("task_003", "Refactor Payment Gateway for Stripe Connect",             {"python": 0.8, "django": 0.7, "postgresql": 0.6},            "HIGH",   None),
    ("task_004", "Build GraphQL Federation Gateway",                        {"go": 0.9, "node.js": 0.6},                                  "MEDIUM", None),
    ("task_005", "Optimize Postgres Query Performance for Reporting",       {"postgresql": 1.0, "python": 0.5},                           "MEDIUM", None),
    ("task_006", "Design Canary Deployment Pipeline on Kubernetes",         {"kubernetes": 0.9, "docker": 0.8, "terraform": 0.6},         "HIGH",   "dev_041"),
    ("task_007", "Implement Vector Search for Semantic Document Retrieval", {"python": 0.7, "pytorch": 0.8, "langchain": 0.6},            "HIGH",   "dev_001"),
    ("task_008", "Build Multi-Tenant Database Migration Tool",              {"postgresql": 0.7, "python": 0.6},                           "MEDIUM", None),
    ("task_009", "Create Event-Driven Webhook Microservice",                {"go": 0.8, "redis": 0.6, "kubernetes": 0.5},                 "MEDIUM", None),
    ("task_010", "Add Server-Side Rendering to Marketing Site",             {"next.js": 0.9, "react": 0.8, "typescript": 0.7},            "MEDIUM", "dev_021"),
    ("task_011", "Develop Cross-Platform Push Notification Service",        {"typescript": 0.7, "node.js": 0.6},                          "LOW",    "dev_031"),
    ("task_012", "Migrate Frontend from Vue 2 to Vue 3 Composition API",    {"vue": 1.0, "typescript": 0.6},                              "MEDIUM", None),
    ("task_013", "Build Internal Feature Flag System",                      {"python": 0.6, "fastapi": 0.6, "postgresql": 0.5},           "LOW",    None),
    ("task_014", "Implement Tiered Rate Limiting for Public API",           {"go": 0.7, "redis": 0.7},                                    "MEDIUM", None),
    ("task_015", "Refactor Logging Pipeline to Loki + Grafana",             {"docker": 0.7, "kubernetes": 0.6},                           "LOW",    None),
]


# ---------------------------------------------------------------------------
# Seed
# ---------------------------------------------------------------------------
async def seed():
    now = datetime.now(timezone.utc)
    print("=" * 60)
    print("[ADT] Nuclear Reset — Synchronizing Data Vault")
    print("=" * 60)

    # 1. PURGE
    for col in (
        "users", "managers", "tech_staff", "tasks",
        "assessments", "test_submissions", "weekly_tests", "audit_logs",
        "whitelist", "telemetry_batches", "telemetry_raw",
        "system_config", "notifications", "project_analyses",
    ):
        await db[col].delete_many({})
    print("[PURGE] All collections wiped.")

    # 2. MANAGERS
    manager_docs = []
    for m in MANAGERS:
        manager_docs.append({
            **m,
            "role": "manager",
            "password_hash": PASSWORD_HASH,
            "is_active": True,
            "registered_at": now - timedelta(days=random.randint(400, 1000)),
        })
    await db.managers.insert_many(manager_docs)
    print(f"[SEED] {len(manager_docs)} managers -> `managers` (ISOLATED)")

    # 3. TECH STAFF
    tech_docs = []
    for t in TECH_STAFF:
        tech_docs.append({
            **t,
            "role": "tech",
            "password_hash": PASSWORD_HASH,
            "is_active": True,
            "registered_at": now - timedelta(days=random.randint(200, 800)),
        })
    await db.tech_staff.insert_many(tech_docs)
    print(f"[SEED] {len(tech_docs)} tech staff -> `tech_staff` (ISOLATED)")

    # 4. DEVELOPERS + WHITELIST
    dev_docs, whitelist_docs = [], []
    for (dev_id, name, manager_id, squad, domains) in DEVS_RAW:
        i = int(dev_id.split("_")[1])
        ext_id = f"ADT-DX-{i:03d}"
        dev_docs.append({
            "user_id": dev_id,
            "username": dev_id,
            "name": name,
            "role": "developer",
            "email": f"{name.lower().replace(' ', '.').replace(chr(39), '')}@adt.ai",
            "phone_number": f"+1-555-{2000 + i:04d}",
            "gender": "Female" if i % 2 == 0 else "Male",
            "password_hash": PASSWORD_HASH,
            "manager_id": manager_id,
            "squad": squad,
            "experience_level": "Senior" if i % 4 == 0 else ("Mid" if i % 2 == 0 else "Junior"),
            "strong_domains": domains,
            "extension_id": ext_id,
            "machine_id": None,
            "registered_at": now - timedelta(days=random.randint(30, 600)),
            "is_active": True,
            "project_analysis_status": "completed",
        })
        whitelist_docs.append({
            "extension_id": ext_id,
            "user_id": dev_id,
            "is_active": True,
            "machine_id": None,
            "created_at": now - timedelta(days=random.randint(30, 600)),
        })

    await db.users.insert_many(dev_docs)
    await db.whitelist.insert_many(whitelist_docs)
    print(f"[SEED] {len(dev_docs)} developers -> `users` (10 per manager)")
    print(f"[SEED] {len(whitelist_docs)} whitelist entries")

    # 5. TASKS
    task_docs = []
    for (task_id, title, required_skills, priority, assigned_to) in TASKS:
        task_docs.append({
            "task_id": task_id,
            "title": title,
            "description": f"{title}. Owned by the engineering org.",
            "priority": priority,
            "complexity": round(random.uniform(2.0, 9.0), 1),
            "estimated_hours": random.choice([16, 24, 40, 60, 80, 120]),
            "status": "allotted" if assigned_to else "pending",
            "assigned_to": assigned_to,
            "required_skills": required_skills,
            "created_by": MANAGERS[i % len(MANAGERS)]["user_id"],
            "created_at": now - timedelta(days=random.randint(1, 30)),
        })
    await db.tasks.insert_many(task_docs)
    print(f"[SEED] {len(task_docs)} tasks -> `tasks`")

    # 6. SYSTEM CONFIG
    await db.system_config.insert_one({
        "key": "global_config",
        "telemetry_window_minutes": 5,
        "burnout_threshold_pct": 25,
        "holidays": [],
        "updated_at": now,
        "updated_by": "tech_001",
    })
    print(f"[SEED] system_config initialised")

    # 7. SAMPLE NOTIFICATIONS for first dev of each squad
    notif_docs = []
    for (dev_id, _, _, _, _) in DEVS_RAW:
        if dev_id.endswith("_001") or dev_id.endswith("_011") or dev_id.endswith("_021") or dev_id.endswith("_031") or dev_id.endswith("_041"):
            notif_docs.append({
                "notification_id": f"NOTIF-{dev_id}",
                "user_id": dev_id,
                "type": "task_allotted",
                "title": "New task assigned",
                "message": "Your manager has allotted you a new task. Check the dashboard.",
                "is_read": False,
                "created_at": now - timedelta(hours=random.randint(1, 48)),
            })
    if notif_docs:
        await db.notifications.insert_many(notif_docs)
    print(f"[SEED] {len(notif_docs)} notifications")

    # 8. ASSESSMENTS — 10-question MCQ tests created by managers
    assessment_blueprints = [
        {
            "title": "Python Async & Concurrency Mastery",
            "domain": "python",
            "created_by": "mgr_002",
            "questions": [
                ("What does asyncio.gather() return when all coroutines succeed?",
                 ["A list of results in the order awaitables were passed",
                  "The first completed result",
                  "A dict keyed by coroutine name",
                  "None"], "A"),
                ("Which keyword pauses a coroutine until an awaitable completes?",
                 ["yield", "await", "async", "future"], "B"),
                ("What's the difference between asyncio.create_task and asyncio.ensure_future?",
                 ["They are identical",
                  "create_task only accepts coroutines and is the modern API",
                  "ensure_future is faster",
                  "create_task blocks the loop"], "B"),
                ("How do you run a blocking I/O call without freezing the event loop?",
                 ["Use threading.Thread directly",
                  "Wrap it with loop.run_in_executor",
                  "Call it inside an async function",
                  "Use multiprocessing.Pool"], "B"),
                ("What does the @asynccontextmanager decorator do?",
                 ["Creates a sync context manager",
                  "Lets you write async with using a generator",
                  "Schedules a task",
                  "Wraps a coroutine in a future"], "B"),
                ("What's the safest way to cancel a running asyncio.Task?",
                 ["Call task.cancel() then await it",
                  "Set task = None",
                  "Raise SystemExit",
                  "Call loop.stop()"], "A"),
                ("Which library is the de-facto standard async HTTP client in Python?",
                 ["requests", "urllib3", "httpx", "tornado"], "C"),
                ("In FastAPI, an endpoint declared with `async def` runs on…",
                 ["A separate thread per request",
                  "The main event loop",
                  "A worker process",
                  "The OS scheduler"], "B"),
                ("What does asyncio.Semaphore primarily protect against?",
                 ["Race conditions on shared memory",
                  "Bounded concurrency for a resource",
                  "Deadlocks",
                  "CPU starvation"], "B"),
                ("Which exception fires when a Task is cancelled mid-await?",
                 ["RuntimeError",
                  "asyncio.CancelledError",
                  "KeyboardInterrupt",
                  "TimeoutError"], "B"),
            ],
        },
        {
            "title": "React Performance Optimization",
            "domain": "react",
            "created_by": "mgr_003",
            "questions": [
                ("Which hook avoids re-creating a function on every render?",
                 ["useEffect", "useMemo", "useCallback", "useRef"], "C"),
                ("React.memo prevents a component from re-rendering when…",
                 ["Its parent re-renders with identical props",
                  "Its state changes",
                  "It uses Context",
                  "Always"], "A"),
                ("What's the cost of using useMemo for cheap computations?",
                 ["No cost",
                  "Memory + comparison overhead can outweigh the win",
                  "It blocks the main thread",
                  "It triggers extra renders"], "B"),
                ("Which API is best for offloading heavy work off the render path?",
                 ["useEffect", "useTransition", "useLayoutEffect", "useState"], "B"),
                ("Why is passing inline objects as props a perf foot-gun?",
                 ["They cause TypeScript errors",
                  "Reference identity changes every render, busting memo",
                  "They take more memory",
                  "They are deprecated"], "B"),
                ("What does React's concurrent rendering enable?",
                 ["Multi-threading in the browser",
                  "Interrupting renders to keep input responsive",
                  "Server components",
                  "Faster Webpack builds"], "B"),
                ("Which tool surfaces wasted re-renders during dev?",
                 ["React DevTools Profiler",
                  "Lighthouse",
                  "Webpack Bundle Analyzer",
                  "ESLint"], "A"),
                ("Lazy-loading a route component is best done with…",
                 ["import()", "require()", "<script defer>", "useEffect"], "A"),
                ("Which prop on <img> hints the browser to defer offscreen loads?",
                 ["loading=\"lazy\"", "defer", "async", "preload"], "A"),
                ("In a list of 10,000 rows, the right primitive is…",
                 ["map() inside a div",
                  "A virtualized list (react-window/virtual)",
                  "useMemo",
                  "useEffect"], "B"),
            ],
        },
        {
            "title": "Kubernetes Networking Deep-Dive",
            "domain": "kubernetes",
            "created_by": "mgr_005",
            "questions": [
                ("What does a Service of type ClusterIP expose?",
                 ["A pod-internal virtual IP",
                  "A node port",
                  "A public LB",
                  "A hostname"], "A"),
                ("Which Service type allocates a port on every node?",
                 ["ClusterIP", "NodePort", "LoadBalancer", "ExternalName"], "B"),
                ("Pod-to-pod traffic across nodes traverses…",
                 ["The host network only",
                  "The CNI overlay (Calico, Cilium, etc.)",
                  "kube-proxy",
                  "etcd"], "B"),
                ("kube-proxy's job is to…",
                 ["Run the API server",
                  "Implement Service IPs via iptables/IPVS",
                  "Schedule pods",
                  "Pull container images"], "B"),
                ("An Ingress object on its own routes traffic. T/F?",
                 ["True",
                  "False — it needs an Ingress Controller",
                  "Only with TLS",
                  "Only with NodePort"], "B"),
                ("What's the default DNS suffix for in-cluster services?",
                 ["cluster.local", "svc.local", "k8s.io", "internal"], "A"),
                ("NetworkPolicy enforces…",
                 ["RBAC",
                  "L3/L4 ingress and egress rules between pods",
                  "TLS",
                  "Image scanning"], "B"),
                ("A headless Service is one with…",
                 ["No selector",
                  "clusterIP: None",
                  "type: ExternalName",
                  "type: NodePort"], "B"),
                ("Cilium's main differentiator is…",
                 ["eBPF datapath",
                  "Java agents",
                  "VXLAN-only mode",
                  "Sidecar proxy"], "A"),
                ("To load-balance UDP, the Service must…",
                 ["Be type LoadBalancer with protocol: UDP",
                  "Use Ingress",
                  "Use a DaemonSet",
                  "Be impossible"], "A"),
            ],
        },
        {
            "title": "Postgres Indexing & Query Tuning",
            "domain": "postgresql",
            "created_by": "mgr_002",
            "questions": [
                ("Which index type is best for equality on high-cardinality columns?",
                 ["B-tree", "GIN", "BRIN", "Hash"], "A"),
                ("GIN indexes shine for…",
                 ["Range scans",
                  "Composite types like jsonb and arrays",
                  "Sequential reads",
                  "Bitmap heap scans"], "B"),
                ("EXPLAIN ANALYZE differs from EXPLAIN by…",
                 ["Showing the planner output",
                  "Actually executing the query and timing it",
                  "Adding indexes",
                  "Showing locks"], "B"),
                ("A partial index is one that…",
                 ["Indexes only rows matching a WHERE predicate",
                  "Indexes a subset of columns",
                  "Is unfinished",
                  "Indexes a view"], "A"),
                ("Why might a query ignore an existing index?",
                 ["Statistics are stale",
                  "The planner estimates a seq scan is cheaper",
                  "An OR clause defeats it",
                  "All of the above"], "D"),
                ("VACUUM ANALYZE primarily does…",
                 ["Reclaims dead tuples and refreshes stats",
                  "Reindexes everything",
                  "Compresses tables",
                  "Replicates to standby"], "A"),
                ("Which join is best for tiny+large unindexed tables?",
                 ["Hash join", "Nested loop", "Merge join", "Cross join"], "A"),
                ("A covering index lets you skip…",
                 ["WAL writes",
                  "Heap fetches via INCLUDE columns",
                  "Locks",
                  "Vacuum"], "B"),
                ("CONCURRENTLY on CREATE INDEX…",
                 ["Lets writes proceed while building",
                  "Speeds up the build",
                  "Skips validation",
                  "Builds on a replica"], "A"),
                ("pg_stat_statements is used to…",
                 ["Sample slow queries by normalized form",
                  "Replicate WAL",
                  "Run vacuum",
                  "Encrypt data"], "A"),
            ],
        },
        {
            "title": "TypeScript Generics & Type Inference",
            "domain": "typescript",
            "created_by": "mgr_003",
            "questions": [
                ("`function id<T>(x: T): T` — what is T?",
                 ["A runtime parameter",
                  "A type parameter inferred from the call site",
                  "A class",
                  "Any"], "B"),
                ("`keyof T` produces…",
                 ["A union of T's property names",
                  "A tuple of values",
                  "Object.keys(T)",
                  "An array"], "A"),
                ("`Pick<T, K>` returns…",
                 ["A type with keys K from T",
                  "Only required keys",
                  "All keys of T",
                  "A function"], "A"),
                ("What does `T extends U ? X : Y` do?",
                 ["Conditional type — picks X if T is assignable to U",
                  "Runtime if/else",
                  "Class inheritance",
                  "Type assertion"], "A"),
                ("Distributive conditional types kick in when…",
                 ["The checked type is a naked type parameter that's a union",
                  "You use mapped types",
                  "You use enums",
                  "You import the type"], "A"),
                ("`Awaited<Promise<string>>` is…",
                 ["string", "Promise<string>", "any", "unknown"], "A"),
                ("`as const` on an array literal makes it…",
                 ["A readonly tuple of literal types",
                  "A class",
                  "Mutable",
                  "Any"], "A"),
                ("Variance of `(x: T) => void` in T is…",
                 ["Covariant", "Contravariant", "Bivariant", "Invariant"], "B"),
                ("`infer R` is used inside…",
                 ["Conditional types to extract a type",
                  "Decorators",
                  "Enums",
                  "Modules"], "A"),
                ("`unknown` differs from `any` because…",
                 ["You must narrow it before use",
                  "It's slower",
                  "It's a class",
                  "It's identical"], "A"),
            ],
        },
    ]

    assessments_docs = []
    test_id_map = {}  # title -> test_id
    for idx, blueprint in enumerate(assessment_blueprints):
        test_id = f"TEST-{blueprint['domain'].upper()}-{18 - idx:02d}"
        test_id_map[blueprint["title"]] = (test_id, blueprint["domain"])
        questions = []
        for q_idx, (q_text, options, correct) in enumerate(blueprint["questions"]):
            questions.append({
                "id": f"Q{q_idx + 1}",
                "question": q_text,
                "options": [f"{chr(65 + i)}) {opt}" for i, opt in enumerate(options)],
                "correct_option": correct,
                "domain": blueprint["domain"],
            })
        assessments_docs.append({
            "test_id": test_id,
            "title": blueprint["title"],
            "domain": blueprint["domain"],
            "created_by": blueprint["created_by"],
            "questions": questions,
            "is_active": True,
            "created_at": now - timedelta(days=random.randint(1, 14)),
        })
    await db.assessments.insert_many(assessments_docs)
    print(f"[SEED] {len(assessments_docs)} assessments (10 questions each)")

    # 9. TEST SUBMISSIONS — devs who already attempted assessments
    submission_docs = []
    # Map domain to relevant squad so submissions look natural
    squad_for_domain = {
        "python": "backend", "react": "frontend", "kubernetes": "devops",
        "postgresql": "backend", "typescript": "frontend",
    }
    for assessment in assessments_docs:
        domain = assessment["domain"]
        target_squad = squad_for_domain.get(domain)
        relevant_devs = [d for d in DEVS_RAW if d[3] == target_squad][:6]  # 6 devs per assessment

        for (dev_id, _, _, _, _) in relevant_devs:
            # Realistic score distribution: 50% high (8-10), 35% mid (5-7), 15% low (3-4)
            roll = random.random()
            if roll < 0.5:
                correct_count = random.randint(8, 10)
            elif roll < 0.85:
                correct_count = random.randint(5, 7)
            else:
                correct_count = random.randint(3, 4)

            # Generate plausible per-question answers matching the score
            answers = {}
            correct_indices = set(random.sample(range(10), correct_count))
            for q_idx, q in enumerate(assessment["questions"]):
                if q_idx in correct_indices:
                    answers[q["id"]] = q["correct_option"]
                else:
                    wrong = [opt for opt in ["A", "B", "C", "D"] if opt != q["correct_option"]]
                    answers[q["id"]] = random.choice(wrong)

            score = correct_count / 10.0
            submission_docs.append({
                "submission_id": f"SUB-{assessment['test_id']}-{dev_id}",
                "test_id": assessment["test_id"],
                "user_id": dev_id,
                "answers": answers,
                "score": score,
                "verified_at": assessment["created_at"] + timedelta(hours=random.randint(2, 72)),
                "is_legit": True,
            })
    await db.test_submissions.insert_many(submission_docs)
    print(f"[SEED] {len(submission_docs)} test submissions")

    # 10. WEEKLY TESTS — calibration submissions (skill-domain self-scores)
    weekly_test_docs = []
    iso_year, iso_week, _ = (now - timedelta(days=7)).isocalendar()
    for (dev_id, _, _, squad, _) in DEVS_RAW:
        # Each dev's self-scoring is anchored to their squad's domain
        scores = {}
        if squad == "ai":
            scores = {"python": round(random.uniform(0.7, 0.95), 2),
                      "ml": round(random.uniform(0.6, 0.9), 2),
                      "backend": round(random.uniform(0.4, 0.7), 2)}
        elif squad == "backend":
            scores = {"python": round(random.uniform(0.7, 0.95), 2),
                      "fastapi": round(random.uniform(0.6, 0.9), 2),
                      "postgresql": round(random.uniform(0.5, 0.85), 2)}
        elif squad == "frontend":
            scores = {"react": round(random.uniform(0.7, 0.95), 2),
                      "typescript": round(random.uniform(0.6, 0.9), 2),
                      "css": round(random.uniform(0.5, 0.85), 2)}
        elif squad == "mobile":
            scores = {"typescript": round(random.uniform(0.6, 0.9), 2),
                      "react": round(random.uniform(0.55, 0.85), 2),
                      "performance": round(random.uniform(0.5, 0.8), 2)}
        else:  # devops
            scores = {"kubernetes": round(random.uniform(0.65, 0.95), 2),
                      "docker": round(random.uniform(0.7, 0.95), 2),
                      "aws": round(random.uniform(0.5, 0.85), 2)}

        weekly_test_docs.append({
            "user_id": dev_id,
            "week_number": iso_week,
            "year": iso_year,
            "test_scores": scores,
            "time_taken_minutes": round(random.uniform(8, 28), 1),
            "thg_calibration_result": {
                "drift_pct": round(random.uniform(-0.1, 0.1), 3),
                "verdict": random.choice(["aligned", "minor_drift", "aligned"]),
            },
            "submitted_at": now - timedelta(days=random.randint(2, 6)),
        })
    await db.weekly_tests.insert_many(weekly_test_docs)
    print(f"[SEED] {len(weekly_test_docs)} weekly_tests (calibration)")

    # 11. PROJECT ANALYSES — initial repo audit on registration
    project_analysis_docs = []
    sample_repos = [
        "https://github.com/{u}/microservice-template",
        "https://github.com/{u}/data-pipeline",
        "https://github.com/{u}/portfolio-site",
        "https://github.com/{u}/cli-toolkit",
        "https://github.com/{u}/notes-app",
    ]
    for (dev_id, name, _, squad, domains) in DEVS_RAW:
        username_handle = name.lower().split()[0]
        url = random.choice(sample_repos).format(u=username_handle)
        if squad == "ai":
            langs = {"Python": 0.78, "Jupyter Notebook": 0.18, "Shell": 0.04}
            frameworks = ["PyTorch", "Transformers", "FastAPI"]
        elif squad == "backend":
            langs = {"Python": 0.72, "SQL": 0.22, "Dockerfile": 0.06}
            frameworks = ["FastAPI", "SQLAlchemy", "Alembic"]
        elif squad == "frontend":
            langs = {"TypeScript": 0.66, "CSS": 0.22, "JavaScript": 0.12}
            frameworks = ["React", "Next.js", "TailwindCSS"]
        elif squad == "mobile":
            langs = {"TypeScript": 0.7, "Kotlin": 0.18, "Swift": 0.12}
            frameworks = ["React Native", "Expo"]
        else:
            langs = {"Go": 0.55, "HCL": 0.30, "YAML": 0.15}
            frameworks = ["Terraform", "Helm", "ArgoCD"]

        project_analysis_docs.append({
            "user_id": dev_id,
            "source": "github",
            "github_url": url,
            "zip_path": None,
            "status": "completed",
            "analysis_result": {
                "intent_summary": f"{', '.join(domains)} project with idiomatic structure.",
                "complexity": round(random.uniform(3.0, 8.5), 1),
                "test_coverage_pct": random.randint(45, 92),
            },
            "skill_scores": {d.lower(): round(random.uniform(0.55, 0.92), 2) for d in domains},
            "file_count": random.randint(40, 320),
            "languages_detected": langs,
            "frameworks_detected": frameworks,
            "code_quality_score": round(random.uniform(6.5, 9.4), 1),
            "analyzed_at": now - timedelta(days=random.randint(15, 540)),
            "created_at": now - timedelta(days=random.randint(20, 600)),
        })
    await db.project_analyses.insert_many(project_analysis_docs)
    print(f"[SEED] {len(project_analysis_docs)} project_analyses (note: collection currently unused at runtime)")

    # 12. TELEMETRY RAW — last few hours of activity for ~half the squad
    telemetry_raw_docs = []
    active_devs = [d for d in DEVS_RAW if int(d[0].split("_")[1]) <= 25]  # first 25 devs
    for (dev_id, _, _, squad, domains) in active_devs:
        ext_id = f"ADT-DX-{int(dev_id.split('_')[1]):03d}"
        machine_id = f"MACHINE-{ext_id[-6:]}-A1"
        # 8 raw samples per dev, last 4 hours
        for s in range(8):
            ts = now - timedelta(minutes=30 * s + random.randint(0, 25))
            primary_lang = domains[0] if domains else "Python"
            telemetry_raw_docs.append({
                "user_id": dev_id,
                "extension_id": ext_id,
                "machine_id": machine_id,
                "sync_type": "delta" if s > 0 else "initial",
                "timestamp": ts,
                "wpm": round(random.uniform(28, 72), 1),
                "keystrokes": random.randint(80, 1200),
                "commands_executed": random.randint(2, 28),
                "idle_seconds": round(random.uniform(0, 90), 1),
                "active_file": random.choice([
                    "src/api/routers/users.py",
                    "src/components/Dashboard.tsx",
                    "k8s/deployment.yaml",
                    "src/services/allocator.go",
                    "tests/test_skill_match.py",
                ]),
                "diff_payload": "@@ -1,3 +1,4 @@\n+# refactor: add typed return\n",
                "git_branch": random.choice(["main", "feature/auth-rewrite", "fix/cache-invalidation", "wip/perf"]),
                "languages_used": {primary_lang: 1.0},
                "processed": s > 1,
                "ingested_at": ts + timedelta(seconds=random.randint(1, 8)),
            })
    await db.telemetry_raw.insert_many(telemetry_raw_docs)
    print(f"[SEED] {len(telemetry_raw_docs)} telemetry_raw events")

    # 13. TELEMETRY BATCHES — aggregated 5-min windows
    batch_docs = []
    for (dev_id, _, _, squad, domains) in active_devs:
        primary_lang = domains[0] if domains else "Python"
        # 3 batches per dev (last 15 min)
        for b in range(3):
            window_end = now - timedelta(minutes=5 * b)
            window_start = window_end - timedelta(minutes=5)
            avg_wpm = round(random.uniform(32, 68), 2)
            keystrokes = random.randint(400, 1800)
            commands = random.randint(4, 22)
            batch_docs.append({
                "batch_id": f"BATCH-{dev_id}-{b:02d}",
                "user_id": dev_id,
                "window_start": window_start,
                "window_end": window_end,
                "record_count": random.randint(8, 12),
                "aggregated_signals": {
                    "avg_wpm": avg_wpm,
                    "wpm_values": [round(avg_wpm + random.uniform(-8, 8), 1) for _ in range(5)],
                    "total_keystrokes": keystrokes,
                    "total_commands": commands,
                    "total_errors": random.randint(0, 4),
                    "total_errors_fixed": random.randint(0, 3),
                    "total_commits": random.randint(0, 2),
                    "total_idle_seconds": round(random.uniform(20, 180), 1),
                    "top_files": [
                        ["src/api/routers/users.py", random.randint(60, 240)],
                        ["src/services/allocator.go", random.randint(20, 90)],
                    ],
                    "language_distribution": {primary_lang: 0.85, "YAML": 0.10, "Markdown": 0.05},
                    "code_snippets": [],
                    "total_copy_paste": random.randint(0, 5),
                },
                "fusion_result": {
                    "skill_deltas": {primary_lang.lower(): round(random.uniform(0.001, 0.012), 4)},
                    "burst_detected": random.choice([True, False]),
                },
                "thg_updates": {"applied": True, "skill_count": random.randint(1, 3)},
                "status": "processed" if b > 0 else "pending",
                "created_at": window_end,
                "processed_at": window_end + timedelta(seconds=random.randint(2, 12)) if b > 0 else None,
            })
    await db.telemetry_batches.insert_many(batch_docs)
    print(f"[SEED] {len(batch_docs)} telemetry_batches")

    # 14. AUDIT LOGS — system trail across actions
    audit_docs = []
    audit_actions = [
        # Registration events
        *[("registration", "manual", dev_id, {"role": "developer"}, {"role": "developer", "extension_id": f"ADT-DX-{int(dev_id.split('_')[1]):03d}"})
          for (dev_id, _, _, _, _) in DEVS_RAW[:8]],
        # THG skill updates from telemetry
        *[("thg_update", "telemetry_batch", dev_id,
           {"skill": "python", "strength": 0.71, "confidence": 0.84},
           {"skill": "python", "strength": round(0.71 + random.uniform(0.005, 0.02), 3), "confidence": 0.85})
          for (dev_id, _, _, _, _) in DEVS_RAW[:12]],
        # THG updates from weekly tests
        *[("weekly_test", "weekly_test", dev_id,
           {"skill": "react", "strength": 0.68},
           {"skill": "react", "strength": round(0.68 + random.uniform(-0.02, 0.04), 3)})
          for (dev_id, _, _, squad, _) in DEVS_RAW if squad == "frontend"][:5],
        # Task assignments
        ("task_assign", "manual", "dev_011", None, {"task_id": "task_001", "assigned_by": "mgr_002"}),
        ("task_assign", "manual", "dev_021", None, {"task_id": "task_010", "assigned_by": "mgr_003"}),
        ("task_assign", "manual", "dev_041", None, {"task_id": "task_006", "assigned_by": "mgr_005"}),
        ("task_assign", "manual", "dev_001", None, {"task_id": "task_007", "assigned_by": "mgr_001"}),
        ("task_assign", "manual", "dev_031", None, {"task_id": "task_011", "assigned_by": "mgr_004"}),
        # System config changes
        ("system_config_change", "manual", "tech_001",
         {"telemetry_window_minutes": 3},
         {"telemetry_window_minutes": 5}),
        ("system_config_change", "manual", "tech_001",
         {"burnout_threshold_pct": 20},
         {"burnout_threshold_pct": 25}),
        # Project analysis completions
        *[("project_analysis", "project_analysis", dev_id,
           {"status": "analyzing"},
           {"status": "completed", "frameworks_detected_count": random.randint(2, 5)})
          for (dev_id, _, _, _, _) in DEVS_RAW[:10]],
        # Feedback events
        *[("feedback", "review_feedback", dev_id,
           {"score": 3.5}, {"score": round(random.uniform(3.6, 4.8), 1)})
          for (dev_id, _, _, _, _) in DEVS_RAW[15:21]],
    ]

    for idx, (action, source, user_id, before, after) in enumerate(audit_actions):
        # Spread timestamps across the last 7 days, newest first
        ts = now - timedelta(minutes=idx * 12 + random.randint(0, 8))
        audit_docs.append({
            "user_id": user_id,
            "action": action,
            "source": source,
            "before_state": before or {},
            "after_state": after or {},
            "metadata": {"seeded": True},
            "timestamp": ts,
        })

    await db.audit_logs.insert_many(audit_docs)
    print(f"[SEED] {len(audit_docs)} audit_logs")

    # ----- VERIFY -----
    print("\n" + "=" * 60)
    print("[VERIFICATION] Collection counts:")
    for col in (
        "users", "managers", "tech_staff", "tasks", "whitelist",
        "notifications", "system_config",
        "assessments", "test_submissions", "weekly_tests",
        "project_analyses", "telemetry_raw", "telemetry_batches", "audit_logs",
    ):
        print(f"  {col:20} : {await db[col].count_documents({})}")
    print("=" * 60)
    print("[SUCCESS] ADT Mongo seed complete. Run the Cypher script to align Neo4j.")


if __name__ == "__main__":
    asyncio.run(seed())
