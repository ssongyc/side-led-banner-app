import LottieView from "lottie-react-native";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";

export function SplashLoadingScreen({ onImageLoad, onImageError }: {
  onImageLoad: () => void; onImageError: () => void;
}) {
  const [imageReady, setImageReady] = useState(false);
  return (
    <View style={styles.container}>
      <View style={[styles.composition, { opacity: imageReady ? 1 : 0 }]}>
        <Image
          source={require("@/assets/images/splash-icon.png")}
          style={styles.icon}
          resizeMode="contain"
          fadeDuration={0}
          onLoad={() => {
            setImageReady(true);
            onImageLoad();
          }}
          onError={onImageError}
        />
        <View style={styles.dotsContainer}>
          <LottieView
            source={require("@/assets/splash.json")}
            autoPlay
            loop
            style={styles.lottieDots}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  composition: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 200,
    height: 200,
  },
  dotsContainer: {
    position: "absolute",
    top: "50%",
    marginTop: 140,
    width: 150,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  lottieDots: {
    width: "100%",
    height: "100%",
  },
});
