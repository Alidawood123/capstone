export default ({config}) => {
    return {
            ...config,
            expo: {
                name: "Arc Wellness",
                slug: "betterhelp-test",
                version: "1.0.1",
                orientation: "portrait",
                icon: "./assets/icon.png",
                userInterfaceStyle: "light",
                newArchEnabled: true,
                splash: {
                    image: "./assets/splash-icon.png",
                    resizeMode: "contain",
                    backgroundColor: "#ffffff"
                },
                ios: {
                    googleServicesFile: process.env.GOOGLE_SERVICES_PLIST || "./GoogleService-Info.plist",
                    bundleIdentifier: process.env.EXPO_PUBLIC_IOS_BUNDLE_IDENTIFIER,
                    supportsTablet: true,
                    infoPlist: {
                        ITSAppUsesNonExemptEncryption: false,
                        NSPhotoLibraryUsageDescription: "Arc Wellness uses your photo library to let you upload progress pictures. For example, you can select a photo taken during your workout to track your fitness journey over time.",
                        NSCameraUsageDescription: "Arc Wellness uses your camera to let you take progress pictures. For example, you can snap a photo after a workout to track your fitness journey over time."
                    },
                    entitlements: {
                        "com.apple.developer.applesignin": ["Default"]
                    }
                },
                android: {
                    googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
                    package: process.env.EXPO_PUBLIC_ANDROID_PACKAGE,
                    adaptiveIcon: {
                        foregroundImage: "./assets/adaptive-icon.png",
                        backgroundColor: "#ffffff"
                    },
                    edgeToEdgeEnabled: true,
                    predictiveBackGestureEnabled: false
                },
                web: {
                    favicon: "./assets/favicon.png"
                },
                plugins: [
                    "@react-native-firebase/app",
                    "@react-native-firebase/auth",
                    [
                        "expo-build-properties",
                        {
                        "ios": {
                            "useFrameworks": "static",
                            "forceStaticLinking": [
                                "RNFBApp",
                                "RNFBAuth"
                            ]
                        }
                        }
                    ],
                    "@react-native-google-signin/google-signin",
                    ...(process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ? [[
                        "react-native-fbsdk-next",
                        {
                            "appID": process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
                            "displayName": process.env.EXPO_PUBLIC_FACEBOOK_DISPLAY_NAME,
                            "clientToken": process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN
                        }
                    ]] : []),
                    [
                        "expo-asset",
                        {
                        "assests": ["./src/services/updated_exercises_500.csv"]
                        }
                    ]
                ],
                extra: {
                    eas: {
                        projectId: "82b55843-73f7-4453-a6d6-55b4ba269c42"
                    }
                },
                owner: "betterhelp"
            }
    }
}