# Durable deployment records
There is no deployment record because no deployment was performed. M4 must write
an atomic, validated record matching `record.schema.json` after observing chain
finality. Use `preprod/<address>.json`; keep older records while funded notes may
remain. Never infer an address from browser memory, an example or a session restart.
The public record must not contain coin openings, payment amounts, participants,
wallet seeds, signing keys, claim secrets or private state.
