/** Synthetic telemetry payloads for use across tests. */

export const NORMAL_TELEMETRY_PAYLOAD = {
  extension_id: 'ADT-TESTID12',
  machine_id: 'test-machine-id',
  native_hwid: 'native-hwid-test',
  sync_type: 'delta',
  wpm: 52.3,
  keystrokes: 1240,
  commands_executed: 18,
  errors_encountered: 3,
  idle_seconds: 45.0,
  copy_paste_count: 5,
  session_duration: 1800,
  timestamp: new Date().toISOString(),
};

export const BOT_TELEMETRY_PAYLOAD = {
  ...NORMAL_TELEMETRY_PAYLOAD,
  wpm: 300.0,
  keystrokes: 50000,
  idle_seconds: 0,
};

export const SECRET_CONTAINING_SNIPPET = `
const apiKey = "sk-proj-abc123xyz456def789ghi012jkl345mno678pq";
const awsKey = "AKIAIOSFODNN7EXAMPLE";
const password = "password=MySecret123";
`;

export const CLEAN_SNIPPET = `
function add(a: number, b: number): number {
  return a + b;
}
`;
