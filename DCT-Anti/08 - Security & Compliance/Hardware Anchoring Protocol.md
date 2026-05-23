---
tags: [security, algorithm]
---

# Hardware Anchoring Protocol

Hardware Anchoring ensures that an `extension_id` cannot be hijacked and executed on multiple client machines. Every developer's telemetry stream must originate from their whitelisted hardware.

## Under the Hood: SHA-HWID

When the VS Code extension initializes, it retrieves the client machine identifier:

```typescript
// extension/src/telemetry/collector.ts
const machineId = vscode.env.machineId; // Cryptographically salted OS hardware fingerprint
```

The extension hashes this fingerprint along with the whitelisted `extension_id` and registers it on onboarding:

```
SHA256(extension_id + "_" + vscode.env.machineId) === SHA-HWID
```

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant Ext as IDE Extension
    participant Auth as Auth Service (:8001)
    
    Dev->>Ext: Installs extension & inputs extension_id
    Ext->>Ext: Gathers machineId from vscode.env.machineId
    Ext->>Auth: POST /auth/users/hardware-lock { extension_id, machine_id }
    Note over Auth: Checks if whitelisted for extension_id
    alt First Time Setup
        Auth->>Auth: Sets machine_id = SHA256(machine_id)
        Auth->>Mongo: Saves to whitelist collection
        Auth-->>Ext: Lock Successful (status: locked)
    else Hardware Mismatch
        Auth->>Auth: Compares new machine_id with whitelisted hash
        Auth-->>Ext: Lock Failed (HTTP 403 Forbidden)
    end
```

## Security Loophole & Tier-1 Fixes

### ⚠️ Current Loopholes:
- **`vscode.env.machineId` spoofability**: If a user runs VS Code inside a virtual machine or modifies their local VS Code environment variables, they can spoof their `machineId`.
- **Admin Lock Reset**: Whitelist changes are currently done manually by DB edits without full validation of credentials.

### Tier-1 Hardening Actions:
1. **Multi-Factor Fingerprinting**: Incorporate multiple hardware endpoints (motherboard UUID, CPU serials, MAC address) using a native node utility within the extension bundle, rather than relying solely on VS Code variables.
2. **Re-Verification Nonce**: Force re-validation of hardware during each `/handshake` step.
