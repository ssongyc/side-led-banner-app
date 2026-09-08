Pod::Spec.new do |s|
  s.name = 'LedPopAdImmersive'
  s.version = '1.0.0'
  s.summary = 'LED POP native advertising configuration boundary'
  s.description = 'Native AdMob profile verification for LED POP.'
  s.license = { :type => 'Proprietary' }
  s.author = 'Sunny Innovation Lab'
  s.homepage = 'https://github.com/ssongyc/side-led-banner-app'
  s.source = { :git => 'https://github.com/ssongyc/side-led-banner-app.git' }
  s.platforms = { :ios => '16.4' }
  s.swift_version = '5.9'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
