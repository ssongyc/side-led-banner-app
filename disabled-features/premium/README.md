# Upgrade to Pro — disabled

Disabled by explicit user request on 2026-09-08. Keep the Upgrade to Pro entry and screen out of all builds until the user explicitly asks to restore them. Ordinary build, SDK update, or release requests do not authorize re-enabling this feature.

PremiumScreen.tsx preserves the implementation outside the Expo Router app directory. Do not import it from app code or register a premium route while disabled. Existing purchased entitlement verification and ad exemption remain unchanged. Re-enable only on explicit request by restoring the route and Settings entry together.
