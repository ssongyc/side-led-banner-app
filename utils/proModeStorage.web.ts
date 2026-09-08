import { WEB_AD_DIAGNOSTICS } from "./webAdDiagnostics.web";
// Memory only: simulation never reads/writes the real reward key or survives reload.
let diagnosticExpiry: number | null = null;
export async function readProModeExpiry(): Promise<number | null> { return WEB_AD_DIAGNOSTICS ? diagnosticExpiry : null; }
export async function writeProModeExpiry(expiry: number | null): Promise<void> {
  if (WEB_AD_DIAGNOSTICS) diagnosticExpiry = expiry;
  else if (expiry !== null) throw new Error("Reward simulation is disabled on ordinary web");
}
