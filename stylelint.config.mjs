/**
 * Bu site elle yazılmış tek bir stylesheet kullanıyor; amaç kod stilini
 * yeniden biçimlendirmek değil, gerçek hataları (bilinmeyen özellik, bozuk
 * söz dizimi, yinelenen seçici) yakalamak. Aşağıdaki kurallar bu dosyanın
 * bilinçli tercihleriyle çakıştığı için kapatıldı.
 */
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    // Tek satırlık kısa kurallar dosya boyunca bilinçli bir tercih.
    'declaration-block-single-line-max-declarations': null,
    // --bg: #ffffff komşu değişkenlerle aynı 6 haneli biçimi koruyor.
    'color-hex-length': null,
    // -webkit-text-size-adjust iOS Safari için hâlâ gerekli.
    'property-no-vendor-prefix': null,
    // Kaskad sırası el ile kurgulandı; uyarı gürültüden ibaret.
    'no-descending-specificity': null,
  },
};
