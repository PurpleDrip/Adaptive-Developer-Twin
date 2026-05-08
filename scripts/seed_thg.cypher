// =====================================================================
// ADT THG — Reference Seed
// 5 managers x 10 devs = 50 developers, 22 skills, 15 tasks
// IDs match scripts/seed_production_demo.py exactly so Mongo and Neo4j
// stay aligned. Run order does not matter.
//
// Usage:
//   - Neo4j Browser: paste this whole file and run.
//   - cypher-shell:  cypher-shell -u neo4j -p <pwd> -f scripts/seed_thg.cypher
// =====================================================================

// 1. WIPE EVERYTHING
MATCH (n) DETACH DELETE n;

// 2. CREATE MANAGERS
UNWIND [
  {id: 'mgr_001', name: 'Aarav Kapoor',     dept: 'AI'},
  {id: 'mgr_002', name: 'Priya Sharma',     dept: 'Backend'},
  {id: 'mgr_003', name: 'Marcus Chen',      dept: 'Frontend'},
  {id: 'mgr_004', name: 'Sofia Rodriguez',  dept: 'Mobile'},
  {id: 'mgr_005', name: 'David Park',       dept: 'DevOps'}
] AS m
CREATE (:Manager {id: m.id, name: m.name, department: m.dept});

// 3. CREATE DEVELOPERS
UNWIND [
  // AI squad (mgr_001)
  {id:'dev_001', name:'Ananya Iyer',     squad:'ai'},
  {id:'dev_002', name:'Lucas Bernardo',  squad:'ai'},
  {id:'dev_003', name:'Mei Tanaka',      squad:'ai'},
  {id:'dev_004', name:'Daniel Foster',   squad:'ai'},
  {id:'dev_005', name:'Elena Volkov',    squad:'ai'},
  {id:'dev_006', name:'Rajesh Kumar',    squad:'ai'},
  {id:'dev_007', name:'Yara Mansour',    squad:'ai'},
  {id:'dev_008', name:'Oliver Schmidt',  squad:'ai'},
  {id:'dev_009', name:'Naomi Park',      squad:'ai'},
  {id:'dev_010', name:'Tobias Larsen',   squad:'ai'},
  // Backend squad (mgr_002)
  {id:'dev_011', name:'Maya Patel',      squad:'backend'},
  {id:'dev_012', name:'Diego Morales',   squad:'backend'},
  {id:'dev_013', name:'Hannah Berg',     squad:'backend'},
  {id:'dev_014', name:'Vikram Reddy',    squad:'backend'},
  {id:'dev_015', name:'Carla Souza',     squad:'backend'},
  {id:'dev_016', name:'Adrian Walsh',    squad:'backend'},
  {id:'dev_017', name:'Lin Wei',         squad:'backend'},
  {id:'dev_018', name:'Felipe Castro',   squad:'backend'},
  {id:'dev_019', name:'Amara Okonkwo',   squad:'backend'},
  {id:'dev_020', name:'Ben Carter',      squad:'backend'},
  // Frontend squad (mgr_003)
  {id:'dev_021', name:'Julia Novak',     squad:'frontend'},
  {id:'dev_022', name:'Kai Yamamoto',    squad:'frontend'},
  {id:'dev_023', name:'Isabella Romano', squad:'frontend'},
  {id:'dev_024', name:'Ravi Joshi',      squad:'frontend'},
  {id:'dev_025', name:'Emma Thompson',   squad:'frontend'},
  {id:'dev_026', name:'Jake Wilson',     squad:'frontend'},
  {id:'dev_027', name:'Sasha Petrov',    squad:'frontend'},
  {id:'dev_028', name:'Aiko Suzuki',     squad:'frontend'},
  {id:'dev_029', name:'Henrik Olsen',    squad:'frontend'},
  {id:'dev_030', name:'Zara Khan',       squad:'frontend'},
  // Mobile squad (mgr_004)
  {id:'dev_031', name:'Carlos Mendez',   squad:'mobile'},
  {id:'dev_032', name:'Aisha Hassan',    squad:'mobile'},
  {id:'dev_033', name:'Tom Anderson',    squad:'mobile'},
  {id:'dev_034', name:'Nadia Ali',       squad:'mobile'},
  {id:'dev_035', name:'Akira Sato',      squad:'mobile'},
  {id:'dev_036', name:'Luca Bianchi',    squad:'mobile'},
  {id:'dev_037', name:'Priya Menon',     squad:'mobile'},
  {id:'dev_038', name:'Ethan Brooks',    squad:'mobile'},
  {id:'dev_039', name:'Maria Silva',     squad:'mobile'},
  {id:'dev_040', name:'Jin Wu',          squad:'mobile'},
  // DevOps squad (mgr_005)
  {id:'dev_041', name:'Sergei Ivanov',   squad:'devops'},
  {id:'dev_042', name:'Olivia Chen',     squad:'devops'},
  {id:'dev_043', name:'Mateo Garcia',    squad:'devops'},
  {id:'dev_044', name:'Fatima Al-Rashid',squad:'devops'},
  {id:'dev_045', name:"Connor O'Brien",  squad:'devops'},
  {id:'dev_046', name:'Chloe Dubois',    squad:'devops'},
  {id:'dev_047', name:'Arjun Nair',      squad:'devops'},
  {id:'dev_048', name:'Sofia Martinez',  squad:'devops'},
  {id:'dev_049', name:'Liam Murphy',     squad:'devops'},
  {id:'dev_050', name:'Yuki Nakamura',   squad:'devops'}
] AS d
CREATE (:Developer {id: d.id, name: d.name, squad: d.squad});

// 4. CREATE SKILLS
UNWIND [
  'Python','FastAPI','Django','Node.js','Go','Rust',
  'React','TypeScript','Next.js','Vue','Tailwind CSS',
  'PostgreSQL','MongoDB','Redis','Neo4j',
  'Docker','Kubernetes','AWS','Terraform',
  'PyTorch','TensorFlow','LangChain'
] AS skill_name
CREATE (:Skill {name: skill_name});

// 5. CREATE TASKS
UNWIND [
  {id:'task_001', title:'Migrate Authentication Service to OAuth 2.1 with PKCE'},
  {id:'task_002', title:'Implement Real-Time Collaborative Editor with CRDT'},
  {id:'task_003', title:'Refactor Payment Gateway for Stripe Connect'},
  {id:'task_004', title:'Build GraphQL Federation Gateway'},
  {id:'task_005', title:'Optimize Postgres Query Performance for Reporting'},
  {id:'task_006', title:'Design Canary Deployment Pipeline on Kubernetes'},
  {id:'task_007', title:'Implement Vector Search for Semantic Document Retrieval'},
  {id:'task_008', title:'Build Multi-Tenant Database Migration Tool'},
  {id:'task_009', title:'Create Event-Driven Webhook Microservice'},
  {id:'task_010', title:'Add Server-Side Rendering to Marketing Site'},
  {id:'task_011', title:'Develop Cross-Platform Push Notification Service'},
  {id:'task_012', title:'Migrate Frontend from Vue 2 to Vue 3 Composition API'},
  {id:'task_013', title:'Build Internal Feature Flag System'},
  {id:'task_014', title:'Implement Tiered Rate Limiting for Public API'},
  {id:'task_015', title:'Refactor Logging Pipeline to Loki + Grafana'}
] AS t
CREATE (:Task {id: t.id, title: t.title});

// 6. MANAGES  (each manager owns exactly 10 devs)
UNWIND [
  {m:'mgr_001', d:'dev_001'},{m:'mgr_001', d:'dev_002'},{m:'mgr_001', d:'dev_003'},{m:'mgr_001', d:'dev_004'},{m:'mgr_001', d:'dev_005'},
  {m:'mgr_001', d:'dev_006'},{m:'mgr_001', d:'dev_007'},{m:'mgr_001', d:'dev_008'},{m:'mgr_001', d:'dev_009'},{m:'mgr_001', d:'dev_010'},
  {m:'mgr_002', d:'dev_011'},{m:'mgr_002', d:'dev_012'},{m:'mgr_002', d:'dev_013'},{m:'mgr_002', d:'dev_014'},{m:'mgr_002', d:'dev_015'},
  {m:'mgr_002', d:'dev_016'},{m:'mgr_002', d:'dev_017'},{m:'mgr_002', d:'dev_018'},{m:'mgr_002', d:'dev_019'},{m:'mgr_002', d:'dev_020'},
  {m:'mgr_003', d:'dev_021'},{m:'mgr_003', d:'dev_022'},{m:'mgr_003', d:'dev_023'},{m:'mgr_003', d:'dev_024'},{m:'mgr_003', d:'dev_025'},
  {m:'mgr_003', d:'dev_026'},{m:'mgr_003', d:'dev_027'},{m:'mgr_003', d:'dev_028'},{m:'mgr_003', d:'dev_029'},{m:'mgr_003', d:'dev_030'},
  {m:'mgr_004', d:'dev_031'},{m:'mgr_004', d:'dev_032'},{m:'mgr_004', d:'dev_033'},{m:'mgr_004', d:'dev_034'},{m:'mgr_004', d:'dev_035'},
  {m:'mgr_004', d:'dev_036'},{m:'mgr_004', d:'dev_037'},{m:'mgr_004', d:'dev_038'},{m:'mgr_004', d:'dev_039'},{m:'mgr_004', d:'dev_040'},
  {m:'mgr_005', d:'dev_041'},{m:'mgr_005', d:'dev_042'},{m:'mgr_005', d:'dev_043'},{m:'mgr_005', d:'dev_044'},{m:'mgr_005', d:'dev_045'},
  {m:'mgr_005', d:'dev_046'},{m:'mgr_005', d:'dev_047'},{m:'mgr_005', d:'dev_048'},{m:'mgr_005', d:'dev_049'},{m:'mgr_005', d:'dev_050'}
] AS link
MATCH (m:Manager {id: link.m})
MATCH (d:Developer {id: link.d})
CREATE (m)-[:MANAGES {since: date() - duration({days: toInteger(rand()*900)})}]->(d);

// 7. HAS_SKILL — primary skills per squad (high strength)
MATCH (d:Developer)
WITH d, CASE d.squad
  WHEN 'ai'       THEN ['Python','PyTorch','TensorFlow','LangChain','Rust']
  WHEN 'backend'  THEN ['Python','FastAPI','Django','Go','PostgreSQL','Redis']
  WHEN 'frontend' THEN ['React','TypeScript','Next.js','Tailwind CSS','Vue']
  WHEN 'mobile'   THEN ['TypeScript','React','Tailwind CSS','Node.js','Vue']
  WHEN 'devops'   THEN ['Docker','Kubernetes','AWS','Terraform','Go']
END AS primary_skills
UNWIND primary_skills AS skill_name
MATCH (s:Skill {name: skill_name})
CREATE (d)-[:HAS_SKILL {
  strength:   0.65 + rand()*0.30,
  confidence: 0.75 + rand()*0.20,
  last_verified: datetime() - duration({days: toInteger(rand()*180)})
}]->(s);

// 8. HAS_SKILL — secondary cross-domain skills (lower strength, ~50% chance)
MATCH (d:Developer)
WITH d, CASE d.squad
  WHEN 'ai'       THEN ['MongoDB','Neo4j','FastAPI','Docker']
  WHEN 'backend'  THEN ['Docker','Kubernetes','MongoDB','Neo4j','Rust']
  WHEN 'frontend' THEN ['Node.js','MongoDB','Python']
  WHEN 'mobile'   THEN ['Next.js','Redis','Python']
  WHEN 'devops'   THEN ['Python','PostgreSQL','MongoDB','Redis','FastAPI']
END AS adjacent_skills
UNWIND adjacent_skills AS skill_name
WITH d, skill_name, rand() AS pick
WHERE pick > 0.45
MATCH (s:Skill {name: skill_name})
CREATE (d)-[:HAS_SKILL {
  strength:   0.30 + rand()*0.30,
  confidence: 0.60 + rand()*0.25,
  last_verified: datetime() - duration({days: toInteger(rand()*365)})
}]->(s);

// 9. REQUIRES_SKILL — task vector weights for the Allocation Engine
UNWIND [
  {t:'task_001', skill:'Python',       w:0.9},
  {t:'task_001', skill:'FastAPI',      w:0.7},
  {t:'task_001', skill:'Redis',        w:0.5},
  {t:'task_002', skill:'TypeScript',   w:0.9},
  {t:'task_002', skill:'React',        w:0.8},
  {t:'task_002', skill:'Node.js',      w:0.6},
  {t:'task_003', skill:'Python',       w:0.8},
  {t:'task_003', skill:'Django',       w:0.7},
  {t:'task_003', skill:'PostgreSQL',   w:0.6},
  {t:'task_004', skill:'Go',           w:0.9},
  {t:'task_004', skill:'Node.js',      w:0.6},
  {t:'task_005', skill:'PostgreSQL',   w:1.0},
  {t:'task_005', skill:'Python',       w:0.5},
  {t:'task_006', skill:'Kubernetes',   w:0.9},
  {t:'task_006', skill:'Docker',       w:0.8},
  {t:'task_006', skill:'Terraform',    w:0.6},
  {t:'task_007', skill:'Python',       w:0.7},
  {t:'task_007', skill:'PyTorch',      w:0.8},
  {t:'task_007', skill:'LangChain',    w:0.6},
  {t:'task_008', skill:'PostgreSQL',   w:0.7},
  {t:'task_008', skill:'Python',       w:0.6},
  {t:'task_009', skill:'Go',           w:0.8},
  {t:'task_009', skill:'Redis',        w:0.6},
  {t:'task_009', skill:'Kubernetes',   w:0.5},
  {t:'task_010', skill:'Next.js',      w:0.9},
  {t:'task_010', skill:'React',        w:0.8},
  {t:'task_010', skill:'TypeScript',   w:0.7},
  {t:'task_011', skill:'TypeScript',   w:0.7},
  {t:'task_011', skill:'Node.js',      w:0.6},
  {t:'task_012', skill:'Vue',          w:1.0},
  {t:'task_012', skill:'TypeScript',   w:0.6},
  {t:'task_013', skill:'Python',       w:0.6},
  {t:'task_013', skill:'FastAPI',      w:0.6},
  {t:'task_013', skill:'PostgreSQL',   w:0.5},
  {t:'task_014', skill:'Go',           w:0.7},
  {t:'task_014', skill:'Redis',        w:0.7},
  {t:'task_015', skill:'Docker',       w:0.7},
  {t:'task_015', skill:'Kubernetes',   w:0.6}
] AS req
MATCH (t:Task {id: req.t})
MATCH (s:Skill {name: req.skill})
MERGE (t)-[r:REQUIRES_SKILL]->(s)
SET r.weight = req.w;

// 10. ASSIGNED_TO — pre-allot 5 tasks for demo realism
UNWIND [
  {d:'dev_001', t:'task_007'},
  {d:'dev_011', t:'task_001'},
  {d:'dev_021', t:'task_010'},
  {d:'dev_041', t:'task_006'},
  {d:'dev_031', t:'task_011'}
] AS a
MATCH (d:Developer {id: a.d}), (t:Task {id: a.t})
CREATE (d)-[:ASSIGNED_TO {
  at: datetime() - duration({days: toInteger(rand()*14)}),
  role: 'Lead'
}]->(t);

// VERIFY — squad sizes
MATCH (m:Manager)
RETURN m.id AS manager,
       m.name AS name,
       m.department AS dept,
       size([(m)-[:MANAGES]->(d) | d]) AS squad_size
ORDER BY manager;
