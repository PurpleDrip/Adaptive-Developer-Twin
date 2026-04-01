const GATEWAY_URL = "http://localhost:8000/api/v1";
let skillRadarChart = null;

async function loadDevProfile() {
    const devId = document.getElementById('dev-id-input').value;
    if(!devId) return;

    try {
        // 1. Fetch from THG (Skills + Live Decay)
        const resp = await fetch(`${GATEWAY_URL}/thg/thg/${devId}/skills`);
        const data = await resp.json();
        updateRadar(data);

        // 2. Fetch Reasoning from Fusion (Simulated for demonstration)
        // Note: Real system would call fusion with actual telemetry
        renderReasoning(devId);
    } catch (e) {
        console.error("Error loading profile:", e);
        // Fallback for visual demo
        mockProfile(devId);
    }
}

function updateRadar(data) {
    const ctx = document.getElementById('skillRadar').getContext('2d');
    const labels = data.skills.map(s => s.name.toUpperCase());
    const values = data.skills.map(s => s.strength * 100);

    if (skillRadarChart) skillRadarChart.destroy();

    skillRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Skill Proficiency (%)',
                data: values,
                backgroundColor: 'rgba(0, 242, 255, 0.2)',
                borderColor: '#00f2ff',
                pointBackgroundColor: '#00f2ff',
                borderWidth: 2
            }]
        },
        options: {
            scales: { r: { min: 0, max: 100, ticks: { display: false } } },
            plugins: { legend: { display: false } }
        }
    });
}

function renderReasoning(devId) {
    const out = document.getElementById('reasoning-output');
    out.innerHTML = `
        <div class="glass-card" style="padding: 15px; border-color: var(--neon-purple); background: rgba(188, 19, 254, 0.05);">
            <strong style="color: var(--neon-purple);">SHAP Explainer (Backend #1)</strong>
            <p style="margin-top: 10px; font-size: 0.9rem;">
                Drive: <strong>Telemetry (0.76)</strong> <br>
                Impact: 45% contribution to rank. <br>
                Reasoning: High consistency in 'api.py' and 'main.py' edits over 12 hours.
            </p>
        </div>
        <div style="margin-top: 10px; font-size: 0.8rem; color: var(--text-secondary);">
            CodeBERT Semantic Match: <strong>92% (backend)</strong>
        </div>
    `;

    const rel = document.getElementById('reliability-output');
    rel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>Reliability Score: <strong style="color: var(--neon-blue);">0.98</strong></span>
            <span class="skill-badge high">SECURE</span>
        </div>
        <div style="font-size: 0.7rem; color: #444; margin-top: 5px;">
            Isolation Forest (Anomaly Check): <strong>PASS</strong>
        </div>
    `;
}

async function loadHRData() {
    try {
        const resp = await fetch(`${GATEWAY_URL}/thg/thg/teams/backend-team/avg-skills`);
        const data = await resp.json();
        
        const lb = document.getElementById('leaderboard-output');
        lb.innerHTML = data.map((d, i) => `
            <div class="leaderboard-row">
                <span><span class="rank">${i+1}</span> ${d.skill.toUpperCase()}</span>
                <span>${Math.round(d.avg_strength * 100)}%</span>
            </div>
        `).join('');

        const cl = document.getElementById('cluster-output');
        cl.innerHTML = `
            <div style="margin-bottom: 10px;">
                <span class="skill-badge high">ELITE</span>: Shashanth Vemuri, Ravi Kumar
            </div>
            <div style="margin-bottom: 10px;">
                <span class="skill-badge mid">GROWING</span>: Divya Singh, Vikas Reddy
            </div>
            <div style="margin-bottom: 10px;">
                <span class="skill-badge low">SPECIALISTS</span>: Mohan Das
            </div>
        `;
    } catch (e) {
        // Mock HR clusters for demo if no backend
        document.getElementById('leaderboard-output').innerHTML = "Run 'generate-demo-data' via Postman to populate leaderboard.";
    }
}

function mockProfile(devId) {
    const mockData = {
        skills: [
            {name: "backend", strength: 0.743, confidence: 0.86},
            {name: "neo4j", strength: 0.63, confidence: 0.71},
            {name: "docker", strength: 0.51, confidence: 0.68},
            {name: "testing", strength: 0.42, confidence: 0.55}
        ]
    };
    updateRadar(mockData);
    renderReasoning(devId);
}
