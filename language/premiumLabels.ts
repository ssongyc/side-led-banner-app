import type { AppLocaleKey } from "@/constants/language";
import type { PremiumNotice } from "@/utils/ApiClient";

export type PremiumLabelKey = PremiumNotice | "loading" | "purchasing" | "restoring" | "owned" | "retry";
const labels: Record<PremiumLabelKey, Record<AppLocaleKey, string>> = {
  "loading": {
    "ko": "스토어 확인 중…",
    "en": "Checking store…",
    "ja": "ストアを確認中…",
    "zhTC": "正在查詢商店…",
    "zhSC": "正在查询商店…",
    "fr": "Vérification de la boutique…",
    "es": "Consultando la tienda…"
  },
  "purchasing": {
    "ko": "구매 처리 중…",
    "en": "Processing purchase…",
    "ja": "購入を処理中…",
    "zhTC": "正在處理購買…",
    "zhSC": "正在处理购买…",
    "fr": "Achat en cours…",
    "es": "Procesando la compra…"
  },
  "restoring": {
    "ko": "구매 복원 중…",
    "en": "Restoring purchases…",
    "ja": "購入を復元中…",
    "zhTC": "正在回復購買…",
    "zhSC": "正在恢复购买…",
    "fr": "Restauration des achats…",
    "es": "Restaurando compras…"
  },
  "owned": {
    "ko": "Pro 사용 중",
    "en": "Pro active",
    "ja": "Pro 有効",
    "zhTC": "Pro 已啟用",
    "zhSC": "Pro 已启用",
    "fr": "Pro activé",
    "es": "Pro activado"
  },
  "unavailable": {
    "ko": "현재 스토어 상품을 이용할 수 없습니다.",
    "en": "The store product is currently unavailable.",
    "ja": "現在ストアの商品を利用できません。",
    "zhTC": "目前無法取得商店商品。",
    "zhSC": "目前无法获取商店商品。",
    "fr": "Le produit est actuellement indisponible.",
    "es": "El producto no está disponible actualmente."
  },
  "error": {
    "ko": "구매 작업을 완료하지 못했습니다. 다시 확인해 주세요.",
    "en": "The purchase operation could not be completed. Please check again.",
    "ja": "購入処理を完了できませんでした。もう一度確認してください。",
    "zhTC": "無法完成購買作業，請重新確認。",
    "zhSC": "无法完成购买操作，请重新确认。",
    "fr": "L’opération d’achat n’a pas abouti. Veuillez réessayer.",
    "es": "No se pudo completar la operación. Vuelve a intentarlo."
  },
  "cancelled": {
    "ko": "구매가 취소되었습니다.",
    "en": "Purchase cancelled.",
    "ja": "購入をキャンセルしました。",
    "zhTC": "已取消購買。",
    "zhSC": "已取消购买。",
    "fr": "Achat annulé.",
    "es": "Compra cancelada."
  },
  "pending": {
    "ko": "결제 승인 대기 중입니다. 승인 후 Pro가 활성화됩니다.",
    "en": "Payment approval is pending. Pro activates after approval.",
    "ja": "支払いの承認待ちです。承認後に Pro が有効になります。",
    "zhTC": "正在等待付款核准，核准後將啟用 Pro。",
    "zhSC": "正在等待付款批准，批准后将启用 Pro。",
    "fr": "Paiement en attente d’approbation. Pro sera activé après validation.",
    "es": "El pago está pendiente de aprobación. Pro se activará al aprobarse."
  },
  "purchased": {
    "ko": "구매가 완료되었습니다. 모든 Pro 기능을 광고 없이 사용할 수 있습니다.",
    "en": "Purchase complete. All Pro features are unlocked without ads.",
    "ja": "購入が完了しました。すべての Pro 機能を広告なしで利用できます。",
    "zhTC": "購買完成，所有 Pro 功能已解鎖且無廣告。",
    "zhSC": "购买完成，所有 Pro 功能已解锁且无广告。",
    "fr": "Achat terminé. Toutes les fonctions Pro sont débloquées sans publicité.",
    "es": "Compra completada. Todas las funciones Pro están desbloqueadas sin anuncios."
  },
  "restored": {
    "ko": "Pro 구매를 복원했습니다.",
    "en": "Your Pro purchase has been restored.",
    "ja": "Pro の購入を復元しました。",
    "zhTC": "已回復 Pro 購買。",
    "zhSC": "已恢复 Pro 购买。",
    "fr": "Votre achat Pro a été restauré.",
    "es": "Se ha restaurado tu compra Pro."
  },
  "nothingToRestore": {
    "ko": "이 스토어 계정에 복원할 Pro 구매가 없습니다.",
    "en": "No Pro purchase was found for this store account.",
    "ja": "このストアアカウントに復元できる Pro の購入はありません。",
    "zhTC": "此商店帳號沒有可回復的 Pro 購買。",
    "zhSC": "此商店账号没有可恢复的 Pro 购买。",
    "fr": "Aucun achat Pro à restaurer pour ce compte.",
    "es": "No se encontró ninguna compra Pro en esta cuenta."
  },
  "verificationFailed": {
    "ko": "구매 확인을 완료하지 못했습니다. 구매 복원을 눌러 다시 확인해 주세요.",
    "en": "Purchase verification failed. Use Restore Purchases to check again.",
    "ja": "購入の確認に失敗しました。購入の復元から再確認してください。",
    "zhTC": "無法驗證購買，請使用回復購買重新確認。",
    "zhSC": "无法验证购买，请使用恢复购买重新确认。",
    "fr": "Échec de la vérification. Utilisez la restauration des achats.",
    "es": "No se pudo verificar la compra. Usa Restaurar compras."
  },
  "retry": {
    "ko": "다시 확인",
    "en": "Check again",
    "ja": "再確認",
    "zhTC": "重新確認",
    "zhSC": "重新确认",
    "fr": "Réessayer",
    "es": "Volver a consultar"
  }
};

export function premiumLabel(key: PremiumLabelKey, locale: AppLocaleKey) {
  return labels[key][locale];
}
