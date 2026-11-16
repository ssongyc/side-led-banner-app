import { AppState } from 'react-native';
import { addNetworkStateListener, getNetworkStateAsync, type NetworkState } from 'expo-network';

// Process-owned connectivity. Unknown/error is not proof of disconnection.
let checked = false;
let offline = false;
let revision = 0;
let started = false;
const listeners = new Set<() => void>();
export const canUseAdNetwork = () => checked && !offline;
function isOffline(value: NetworkState | null) {
  return !!value && !!value.type && value.type !== 'UNKNOWN' &&
    (value.type === 'NONE' || value.isConnected === false || value.isInternetReachable === false);
}
function publish(value: NetworkState | null) {
  checked = true;
  if (value?.type && value.type !== 'UNKNOWN') offline = isOffline(value);
  listeners.forEach(listener => listener());
}
async function refresh() {
  const request = ++revision;
  try {
    const value = await getNetworkStateAsync();
    if (request === revision) publish(value);
  } catch (error) {
    console.warn('[Ads] Connectivity query unavailable', error);
    if (request === revision) publish(null);
  }
}
export function subscribeAdNetwork(listener: () => void) {
  listeners.add(listener);
  if (!started) {
    started = true;
    addNetworkStateListener(value => {
      revision++;
      // A disconnect event can still describe the previous active transport.
      // Suspend dispatch until the new transport is confirmed.
      if (isOffline(value)) publish(value);
      else {
        checked = false;
        listeners.forEach(listener => listener());
      }
      void refresh();
    });
    AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    void refresh();
  }
  return () => { listeners.delete(listener); };
}
