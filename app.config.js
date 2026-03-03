export default ({config}) => {
    return {
            ...config,
            expo: {
                name: "Arc Wellness",
                slug: "betterhelp-test",
                version: "1.0.0",
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
                    bundleIdentifier: "com.betterhelp",
                    supportsTablet: true,
                    infoPlist: {
                        ITSAppUsesNonExemptEncryption: false
                    },
                    entitlements: {
                        "com.apple.developer.applesignin": ["Default"]
                    }
                },
                android: {
                    googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
                    package: "com.betterhelp",
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
                    [
                        "react-native-fbsdk-next",
                        {
                        "appID": "1544148290008338",
                        "displayName": "BetterHelp Capstone",
                        "clientToken": "4a08bdc135286e7788930e62f7ba94ae"
                        }
                    ],
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